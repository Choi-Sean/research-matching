"""Explainable matching engine.

Scores are built from transparent signals (topic overlap, skills coverage, working-style fit, availability) so every
match can say *why*. When an AI reviewer is configured it re-ranks the top candidates and adds nuance; without it,
these scores are the result. Nothing here looks at names, schools, gender, nationality or any protected attribute.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.models import Lab, Position, StudentProfile
from app.schemas.ai import MatchReason, Persona, ProfileStrength
from app.services.text import TfIdf, cosine, shared_terms, skills_overlap, split_list, tokens

STYLE_KEYS = ("autonomy", "collaboration", "pace", "structure")


@dataclass
class Scored:
    score: int
    breakdown: dict[str, int] = field(default_factory=dict)
    reasons: list[MatchReason] = field(default_factory=list)
    gaps: list[MatchReason] = field(default_factory=list)


# --------------------------------------------------------------------------- building blocks


def _calibrate(sim: float) -> float:
    """Cosine similarity of short profiles rarely exceeds ~0.35; stretch it to a 0–1 fit."""
    return max(0.0, min(1.0, sim / 0.32))


def style_fit(a: dict | None, b: dict | None) -> tuple[float | None, list[str], list[str]]:
    """(similarity 0..1, aligned dims, clashing dims) over the dials both sides filled in."""
    if not a or not b:
        return None, [], []
    diffs: dict[str, int] = {}
    for k in STYLE_KEYS:
        if a.get(k) and b.get(k):
            diffs[k] = abs(int(a[k]) - int(b[k]))
    if not diffs:
        return None, [], []
    sim = 1 - (sum(diffs.values()) / len(diffs)) / 4
    return sim, [k for k, d in diffs.items() if d <= 1], [k for k, d in diffs.items() if d >= 3]


def _hours_fit(available: int | None, needed: int | None) -> float | None:
    if not available or not needed:
        return None
    return 1.0 if available >= needed else max(0.0, available / needed)


def _combine(parts: list[tuple[float | None, float]]) -> float:
    """Weighted mean over the components that could be computed."""
    live = [(v, w) for v, w in parts if v is not None]
    total = sum(w for _, w in live)
    return sum(v * w for v, w in live) / total if total else 0.0


def student_text(p: StudentProfile) -> str:
    return " ".join(x for x in (p.major, p.interests, p.experience, p.bio, p.skills, p.skills) if x)


def position_text(pos: Position, lab: Lab) -> str:
    return " ".join(
        x
        for x in (pos.title, pos.title, pos.description, pos.requirements, pos.required_skills, pos.keywords,
                  lab.keywords, lab.name, lab.bio)
        if x
    )


def persona_text(p: Persona) -> str:
    return " ".join([p.headline, p.summary, *p.must_have, *p.must_have, *p.nice_to_have, *p.traits,
                     *p.keywords, *p.keywords])


def _pct(x: float | None) -> int:
    return int(round((x or 0.0) * 100))


# --------------------------------------------------------------------------- student → positions


def score_positions(profile: StudentProfile, positions: list[Position]) -> list[tuple[Position, Scored]]:
    """Rank open positions for one student."""
    stoks = tokens(student_text(profile))
    ptoks = [tokens(position_text(p, p.lab)) for p in positions]
    model = TfIdf([stoks, *ptoks])
    svec = model.vector(stoks)
    haystack = student_text(profile).lower()
    have = split_list(profile.skills)

    out: list[tuple[Position, Scored]] = []
    for pos, pt in zip(positions, ptoks):
        topic = _calibrate(cosine(svec, model.vector(pt)))
        needed = split_list(pos.required_skills)
        covered: list[str] = []
        missing: list[str] = []
        skills_score: float | None = None
        if needed:
            covered, missing = skills_overlap(needed, have)
            # generous: a skill named in the student's experience text also counts
            still: list[str] = []
            for m in missing:
                if re.search(rf"(?<![a-z0-9]){re.escape(m)}(?![a-z0-9])", haystack):
                    covered.append(m)
                else:
                    still.append(m)
            missing = still
            skills_score = len(covered) / len(needed)
        sfit, aligned, clash = style_fit(profile.work_style, pos.lab.work_style)
        hfit = _hours_fit(profile.availability_hours, pos.hours_per_week)

        total = _combine([(topic, 0.45), (skills_score, 0.30), (sfit, 0.15), (hfit, 0.10)])
        sc = Scored(
            score=_pct(total),
            breakdown={k: _pct(v) for k, v in (("topic", topic), ("skills", skills_score), ("style", sfit),
                                               ("hours", hfit)) if v is not None},
        )
        shared = shared_terms(stoks, pt)
        if shared and topic >= 0.25:
            sc.reasons.append(MatchReason(code="shared_topics", items=shared[:4]))
        if covered:
            sc.reasons.append(MatchReason(code="skills_covered", items=covered[:5]))
        if aligned and sfit is not None and sfit >= 0.6:
            sc.reasons.append(MatchReason(code="style_aligned", items=aligned))
        if hfit is not None and hfit >= 1.0:
            sc.reasons.append(MatchReason(code="hours_fit"))
        if missing:
            sc.gaps.append(MatchReason(code="missing_skills", items=missing[:4]))
        if clash:
            sc.gaps.append(MatchReason(code="style_differs", items=clash))
        if hfit is not None and hfit < 1.0:
            sc.gaps.append(MatchReason(code="hours_short"))
        out.append((pos, sc))
    out.sort(key=lambda x: -x[1].score)
    return out


# --------------------------------------------------------------------------- persona → students


def score_students(
    persona: Persona,
    students: list[StudentProfile],
    lab_style: dict | None = None,
    hours_needed: int | None = None,
) -> list[tuple[StudentProfile, Scored]]:
    """Rank discoverable students against a professor's ideal-candidate description."""
    ptoks = tokens(persona_text(persona))
    stoks = [tokens(student_text(s)) for s in students]
    model = TfIdf([ptoks, *stoks])
    pvec = model.vector(ptoks)
    must = split_list(", ".join(persona.must_have))
    nice = split_list(", ".join(persona.nice_to_have))
    target_style = (persona.work_style.model_dump(exclude_none=True) if persona.work_style else None) or lab_style

    out: list[tuple[StudentProfile, Scored]] = []
    for s, st in zip(students, stoks):
        text = student_text(s).lower()
        have = split_list(s.skills)
        topic = _calibrate(cosine(pvec, model.vector(st)))

        def coverage(needed: list[str]) -> tuple[float | None, list[str], list[str]]:
            if not needed:
                return None, [], []
            cov, miss = skills_overlap(needed, have)
            extra = [m for m in miss if re.search(rf"(?<![a-z0-9]){re.escape(m)}(?![a-z0-9])", text)]
            cov += extra
            miss = [m for m in miss if m not in extra]
            return len(cov) / len(needed), cov, miss

        must_score, must_cov, must_miss = coverage(must)
        nice_score, nice_cov, _ = coverage(nice)
        sfit, aligned, clash = style_fit(s.work_style, target_style)
        hfit = _hours_fit(s.availability_hours, hours_needed)

        total = _combine([(topic, 0.35), (must_score, 0.35), (nice_score, 0.10), (sfit, 0.12), (hfit, 0.08)])
        sc = Scored(
            score=_pct(total),
            breakdown={k: _pct(v) for k, v in (("topic", topic), ("skills", must_score), ("bonus", nice_score),
                                               ("style", sfit), ("hours", hfit)) if v is not None},
        )
        shared = shared_terms(ptoks, st)
        if shared and topic >= 0.25:
            sc.reasons.append(MatchReason(code="shared_topics", items=shared[:4]))
        if must_cov:
            sc.reasons.append(MatchReason(code="skills_covered", items=must_cov[:5]))
        if nice_cov:
            sc.reasons.append(MatchReason(code="bonus_skills", items=nice_cov[:4]))
        if aligned and sfit is not None and sfit >= 0.6:
            sc.reasons.append(MatchReason(code="style_aligned", items=aligned))
        if hfit is not None and hfit >= 1.0:
            sc.reasons.append(MatchReason(code="hours_fit"))
        if must_miss:
            sc.gaps.append(MatchReason(code="missing_skills", items=must_miss[:4]))
        if clash:
            sc.gaps.append(MatchReason(code="style_differs", items=clash))
        if hfit is not None and hfit < 1.0:
            sc.gaps.append(MatchReason(code="hours_short"))
        out.append((s, sc))
    out.sort(key=lambda x: -x[1].score)
    return out


# --------------------------------------------------------------------------- persona fallback


def persona_from_position(pos: Position, lab: Lab, extra_text: str | None = None) -> Persona:
    """Rule-based ideal-candidate profile when no AI is available."""
    must = split_list(pos.required_skills)
    kws = split_list(pos.keywords) or split_list(lab.keywords)
    nice = [k for k in split_list(lab.keywords) if k not in must and k not in kws][:6]
    if extra_text:
        for t in split_list(extra_text):
            if t not in must and len(t) < 40:
                must.append(t)
    style = lab.work_style
    from app.schemas.core import WorkStyle

    return Persona(
        headline=pos.title,
        summary=(pos.description or "")[:240],
        must_have=must[:6],
        nice_to_have=nice[:6],
        traits=[],
        keywords=(kws + [k for k in must if k not in kws])[:8],
        work_style=WorkStyle.model_validate(style) if style else None,
    )


# --------------------------------------------------------------------------- profile completeness


def profile_strength(p: StudentProfile) -> ProfileStrength:
    checks = [
        ("skills", bool(split_list(p.skills)), 20),
        ("interests", bool(p.interests and len(p.interests) > 15), 20),
        ("experience", bool(p.experience and len(p.experience) > 30), 20),
        ("bio", bool(p.bio and len(p.bio) > 30), 10),
        ("major", bool(p.major), 10),
        ("availability", bool(p.availability_hours), 10),
        ("work_style", bool(p.work_style), 10),
    ]
    return ProfileStrength(
        score=sum(w for _, ok, w in checks if ok),
        missing=[name for name, ok, _ in checks if not ok],
    )
