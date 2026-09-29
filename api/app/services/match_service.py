"""Orchestrates AI matching in both directions.

    student  ─►  open positions on Labora          (positions_for_student)
    student  ─►  professors worldwide (OpenAlex)   (professors_for_student)
    professor ─► ideal-candidate profile           (build_persona)
    professor ─► students who opted in             (students_for_persona)

Stage 1 is always the explainable rule-based score. Stage 2 (optional) asks the AI to re-rank the top candidates and
explain each one; the two scores are blended so the AI refines the ranking instead of replacing it.
"""
from __future__ import annotations

import math
import re
from concurrent.futures import ThreadPoolExecutor

from sqlalchemy import select, true
from sqlalchemy.orm import Session, joinedload

from app.models import Application, Invitation, Lab, Position, StudentProfile, User
from app.schemas.ai import (
    MatchPositionsOut,
    MatchProfessorsOut,
    MatchReason,
    MatchStudentsOut,
    Persona,
    PersonaOut,
    PositionMatch,
    ProfessorMatch,
    StudentCandidate,
)
from app.schemas.discover import ProfessorCard
from app.services import ai_tasks, matching
from app.services.llm import llm
from app.services.openalex import OpenAlexError, openalex
from app.services.plans import quota_info
from app.services.text import snippet, split_list

AI_WEIGHT = 0.6  # how much the AI's holistic score counts once it has looked at a candidate
AI_POOL = 12  # candidates sent to the AI reviewer


def _blend(rule: int, ai: int | None) -> int:
    if ai is None:
        return rule
    return int(round((1 - AI_WEIGHT) * rule + AI_WEIGHT * max(0, min(100, ai))))


def _ai_reasons(texts: list[str]) -> list[MatchReason]:
    return [MatchReason(code="ai", text=t) for t in texts if t and t.strip()]


# --------------------------------------------------------------------------- student → positions


def _student_facts(p: StudentProfile) -> dict:
    return {
        "major": p.major, "year": p.year, "skills": p.skills, "interests": snippet(p.interests, 500),
        "experience": snippet(p.experience, 700), "about": snippet(p.bio, 300),
        "hours_available_per_week": p.availability_hours, "work_style": p.work_style,
    }


def positions_for_student(db: Session, user: User, lang: str, limit: int) -> MatchPositionsOut:
    profile = db.get(StudentProfile, user.id) or StudentProfile(user_id=user.id)
    positions = db.scalars(
        select(Position)
        .join(Lab, Lab.id == Position.lab_id)
        .join(User, User.id == Lab.owner_id)
        .options(joinedload(Position.lab).joinedload(Lab.owner))
        .where(Position.status == "open", User.verified == true())
    ).all()
    strength = matching.profile_strength(profile)
    scored = matching.score_positions(profile, list(positions))
    top = scored[: max(limit, AI_POOL)]

    reviewed = None
    if llm.enabled and top:
        candidates = [
            {
                "id": f"p{pos.id}", "title": pos.title, "lab": pos.lab.name, "keywords": pos.keywords,
                "required_skills": pos.required_skills, "hours_per_week": pos.hours_per_week, "term": pos.term,
                "about": snippet(pos.description, 450), "lab_style": pos.lab.work_style,
                "rule_based_score": sc.score,
            }
            for pos, sc in top[:AI_POOL]
        ]
        reviewed = ai_tasks.rerank("student_position", _student_facts(profile), candidates, lang)

    items: list[PositionMatch] = []
    for pos, sc in top:
        r = reviewed.get(f"p{pos.id}") if reviewed else None
        items.append(
            PositionMatch(
                position=pos,
                score=_blend(sc.score, r.score if r else None),
                breakdown=sc.breakdown,
                reasons=_ai_reasons(r.reasons) if r and r.reasons else sc.reasons,
                gaps=_ai_reasons(r.gaps) if r and r.gaps else sc.gaps,
                tip=r.tip if r else None,
            )
        )
    items.sort(key=lambda m: -m.score)
    return MatchPositionsOut(
        items=items[:limit], ai_used=bool(reviewed), strength=strength, quota=quota_info(db, user, "match_positions")
    )


# --------------------------------------------------------------------------- student → professors


def heuristic_keywords(p: StudentProfile, extra: str | None) -> list[str]:
    """Topic phrases to search when no AI is available: the student's own interests first."""
    out: list[str] = []

    def add(item: str) -> None:
        item = re.sub(r"\s+", " ", item.strip().lower())
        words = item.split()
        if 1 <= len(words) <= 4 and item not in out and re.search(r"[a-z]", item):
            out.append(item)

    for chunk in (extra, p.interests, p.major):
        for part in re.split(r"[,;\n]+|\band\b", chunk or ""):
            add(part)
    return out[:5]


def professors_for_student(
    db: Session, user: User, lang: str, query: str | None, institution_id: str | None, limit: int
) -> MatchProfessorsOut:
    profile = db.get(StudentProfile, user.id) or StudentProfile(user_id=user.id)
    strength = matching.profile_strength(profile)
    keywords = ai_tasks.student_search_keywords(_student_facts(profile), query) if llm.enabled else None
    ai_used = bool(keywords)
    keywords = keywords or heuristic_keywords(profile, query)
    keywords = keywords[:4]
    if not keywords:
        return MatchProfessorsOut(items=[], keywords_used=[], ai_used=False, strength=strength,
                                  quota=quota_info(db, user, "match_professors"))

    def run(kw: str) -> list[ProfessorCard]:
        try:
            return openalex.authors_for_topic(kw, institution_id=institution_id, max_authors=30)
        except OpenAlexError:
            return []

    with ThreadPoolExecutor(max_workers=4) as pool:
        per_keyword = list(pool.map(run, keywords))

    weights = [1 / (1 + 0.35 * i) for i in range(len(keywords))]
    merged: dict[str, dict] = {}
    for kw, w, cards in zip(keywords, weights, per_keyword):
        for c in cards:
            slot = merged.setdefault(c.id, {"card": c, "kws": [], "weight": 0.0, "works": 0})
            slot["kws"].append(kw)
            slot["weight"] += w
            slot["works"] += c.works_in_topic or 0

    total_w = sum(weights) or 1.0
    matches: list[ProfessorMatch] = []
    for slot in merged.values():
        c: ProfessorCard = slot["card"]
        coverage = slot["weight"] / total_w
        volume = min(1.0, slot["works"] / 20)
        activity = min(1.0, c.recent_works / 15)
        standing = min(1.0, math.log10(1 + c.h_index) / math.log10(61))
        score = int(round(100 * (0.5 * coverage + 0.2 * volume + 0.2 * activity + 0.1 * standing)))
        reasons = [MatchReason(code="published_on_topics", items=slot["kws"])]
        if c.recent_works >= 3:
            reasons.append(MatchReason(code="active_recently", items=[str(c.recent_works)]))
        gaps = [MatchReason(code="partial_topic_overlap", items=[k for k in keywords if k not in slot["kws"]][:3])] \
            if coverage < 0.6 else []
        matches.append(ProfessorMatch(professor=c, score=score, reasons=reasons, gaps=gaps,
                                      matched_keywords=slot["kws"]))
    matches.sort(key=lambda m: -m.score)
    top = matches[: max(limit, 10)]

    reviewed = None
    if llm.enabled and top:
        candidates = [
            {"id": m.professor.id, "institution": m.professor.institution.name if m.professor.institution else None,
             "research_topics": m.professor.topics, "matched_keywords": m.matched_keywords,
             "papers_last_3_years": m.professor.recent_works, "h_index": m.professor.h_index,
             "rule_based_score": m.score}
            for m in top[:AI_POOL]
        ]
        reviewed = ai_tasks.rerank("student_professor", _student_facts(profile) | {"searching_for": keywords},
                                   candidates, lang)
    if reviewed:
        for m in top:
            r = reviewed.get(m.professor.id)
            if r:
                m.score = _blend(m.score, r.score)
                m.reasons = _ai_reasons(r.reasons) or m.reasons
                m.gaps = _ai_reasons(r.gaps) or m.gaps
                m.tip = r.tip
        top.sort(key=lambda m: -m.score)

    # tag researchers who also run a lab here
    ids = [m.professor.id for m in top[:limit]]
    if ids:
        for lab in db.scalars(select(Lab).where(Lab.openalex_author_id.in_(ids))).all():
            for m in top:
                if m.professor.id == lab.openalex_author_id:
                    m.professor.on_platform_lab_id = lab.id
    return MatchProfessorsOut(
        items=top[:limit], keywords_used=keywords, ai_used=ai_used or bool(reviewed), strength=strength,
        quota=quota_info(db, user, "match_professors"),
    )


# --------------------------------------------------------------------------- professor → persona


def _position_context(pos: Position, lab: Lab) -> dict:
    return {
        "position": {
            "title": pos.title, "description": snippet(pos.description, 1200),
            "requirements": snippet(pos.requirements, 600), "required_skills": pos.required_skills,
            "keywords": pos.keywords, "hours_per_week": pos.hours_per_week, "term": pos.term,
            "location": pos.location_type,
        },
        "lab": {"name": lab.name, "about": snippet(lab.bio, 700), "keywords": lab.keywords,
                "culture": snippet(lab.culture, 500), "team_size": lab.team_size, "work_style": lab.work_style},
    }


def build_persona(db: Session, user: User, position_id: int | None, text: str | None, lang: str) -> PersonaOut:
    lab = db.scalar(select(Lab).where(Lab.owner_id == user.id))
    pos = None
    if position_id and lab:
        pos = db.scalar(select(Position).where(Position.id == position_id, Position.lab_id == lab.id))
    if pos and lab:
        context = _position_context(pos, lab)
    elif lab:
        context = {"lab": {"name": lab.name, "about": snippet(lab.bio, 700), "keywords": lab.keywords,
                           "culture": snippet(lab.culture, 500), "work_style": lab.work_style}}
    else:
        context = {}
    ai = ai_tasks.derive_persona(context, text, lang) if llm.enabled and (context or text) else None
    if ai:
        return PersonaOut(persona=ai, ai_used=True)
    if pos and lab:
        return PersonaOut(persona=matching.persona_from_position(pos, lab, text), ai_used=False)
    kws = split_list(text)
    return PersonaOut(persona=Persona(headline=(text or "")[:80], summary=(text or "")[:240], must_have=kws[:6],
                                      keywords=kws[:8]), ai_used=False)


# --------------------------------------------------------------------------- professor → students


def students_for_persona(
    db: Session, user: User, position_id: int | None, persona: Persona, lang: str, limit: int
) -> MatchStudentsOut:
    lab = db.scalar(select(Lab).where(Lab.owner_id == user.id))
    pos = None
    if position_id and lab:
        pos = db.scalar(select(Position).where(Position.id == position_id, Position.lab_id == lab.id))

    pool = db.scalars(
        select(StudentProfile)
        .join(User, User.id == StudentProfile.user_id)
        .options(joinedload(StudentProfile.user))
        .where(StudentProfile.discoverable == true(), User.role == "student")
    ).all()
    applied: set[int] = set()
    invited: set[int] = set()
    if pos:
        applied = set(db.scalars(select(Application.student_id).where(Application.position_id == pos.id)).all())
        invited = set(db.scalars(select(Invitation.student_id).where(Invitation.position_id == pos.id)).all())
    pool = [s for s in pool if s.user_id not in applied]

    scored = matching.score_students(persona, pool, lab.work_style if lab else None, pos.hours_per_week if pos else None)
    top = scored[: max(limit, AI_POOL)]

    reviewed = None
    if llm.enabled and top:
        candidates = [
            {"id": f"s{s.user_id}", "major": s.major, "year": s.year, "skills": s.skills,
             "interests": snippet(s.interests, 400), "experience": snippet(s.experience, 600),
             "about": snippet(s.bio, 250), "hours_available": s.availability_hours, "work_style": s.work_style,
             "rule_based_score": sc.score}
            for s, sc in top[:AI_POOL]
        ]
        subject = {"ideal_candidate": persona.model_dump(exclude_none=True),
                   "hours_needed": pos.hours_per_week if pos else None}
        reviewed = ai_tasks.rerank("professor_student", subject, candidates, lang)

    items: list[StudentCandidate] = []
    for s, sc in top:
        r = reviewed.get(f"s{s.user_id}") if reviewed else None
        items.append(
            StudentCandidate(
                user_id=s.user_id,
                full_name=s.user.full_name,
                university=s.university,
                major=s.major,
                year=s.year,
                bio=snippet(s.bio, 300),
                skills=split_list(s.skills)[:10],
                interests=snippet(s.interests, 300),
                experience=snippet(s.experience, 400),
                availability_hours=s.availability_hours,
                work_style=s.work_style,
                github_url=s.github_url,
                website_url=s.website_url,
                score=_blend(sc.score, r.score if r else None),
                breakdown=sc.breakdown,
                reasons=_ai_reasons(r.reasons) if r and r.reasons else sc.reasons,
                gaps=_ai_reasons(r.gaps) if r and r.gaps else sc.gaps,
                tip=r.tip if r else None,
                invited=s.user_id in invited,
            )
        )
    items.sort(key=lambda c: -c.score)
    return MatchStudentsOut(persona=persona, items=items[:limit], ai_used=bool(reviewed), pool_size=len(pool))
