"""Cold-email tools: reviewer and follow-up planner."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.ratelimit import rate_limit
from app.schemas.ai import (
    EmailCheckIn,
    EmailCheckOut,
    Flag,
    FollowUpIn,
    FollowUpItem,
    FollowUpOut,
    Strength,
)
from app.security import current_user
from app.services import ai_tasks, emailcheck, followup
from app.services.llm import llm
from app.services.openalex import OpenAlexError, openalex
from app.services.plans import ensure_quota, record_use

router = APIRouter(prefix="/tools", tags=["tools"])

_CATEGORIES = {"tone", "specificity", "voice", "clarity", "ask", "etiquette", "subject"}
_SEVERITIES = {"high", "medium", "low"}
_AI_PENALTY = {"high": 6, "medium": 3, "low": 1}


def _professor_context(professor_id: str | None) -> tuple[str | None, list[str], list[str], dict | None]:
    if not professor_id:
        return None, [], [], None
    try:
        d = openalex.get_author(professor_id)
    except OpenAlexError:
        return None, [], [], None
    titles = [w.title for w in (d.recent_works_list + d.top_works)]
    topics = [t.name for t in d.topics_detail]
    ctx = {"name": d.name, "institution": d.institution.name if d.institution else None, "topics": topics[:6],
           "recent_paper_titles": [w.title for w in d.recent_works_list[:5]]}
    return d.name, titles, topics, ctx


@router.post("/email-check", response_model=EmailCheckOut, dependencies=[Depends(rate_limit("echeck", 20))])
def email_check(body: EmailCheckIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    ensure_quota(db, user, "email_check")
    name, titles, topics, ctx = _professor_context(body.professor_id)
    rules = emailcheck.analyze(body.subject, body.body, body.professor_name or name, titles, topics)

    flags: list[Flag] = list(rules.flags)
    strengths: list[Strength] = list(rules.strengths)
    score = rules.score
    ai_summary = None
    sounds_generic: int | None = rules.sounds_generic
    ai_used = False

    review = ai_tasks.review_email(
        body.subject, body.body, body.lang, ctx, [f.code for f in rules.flags]
    ) if llm.enabled else None
    if review:
        ai_used = True
        ai_summary = review.summary
        sounds_generic = max(0, min(100, int(review.sounds_generic)))
        strengths += [Strength(code="ai", text=s) for s in review.strengths[:4] if s.strip()]
        penalty = 0
        for i, issue in enumerate(review.issues[:6]):
            cat = issue.category if issue.category in _CATEGORIES else "clarity"
            sev = issue.severity if issue.severity in _SEVERITIES else "low"
            quote = issue.quote.strip()
            start = body.body.find(quote) if quote else -1
            if start >= 0 and any(f.start is not None and f.start <= start < (f.end or f.start) for f in rules.flags):
                continue  # a rule already highlighted this exact phrase
            flags.append(
                Flag(id=f"ai-{i}", code="ai_note", category=cat, severity=sev, quote=quote or None,
                     start=start if start >= 0 else None, end=start + len(quote) if start >= 0 else None,
                     advice=issue.advice, source="ai")
            )
            penalty += _AI_PENALTY[sev]
        score = max(0, score - min(15, penalty) - (5 if sounds_generic > 60 else 0))
        flags.sort(key=lambda f: (emailcheck.SEVERITY_ORDER[f.severity], f.start if f.start is not None else 10**6))

    quota = record_use(db, user, "email_check")
    return EmailCheckOut(
        score=score, grade=emailcheck.grade_for(score), word_count=rules.word_count, flags=flags,
        strengths=strengths, ai_summary=ai_summary, sounds_generic=sounds_generic, ai_used=ai_used,
        english_checks=rules.english, quota=quota,
    )


@router.post("/follow-up", response_model=FollowUpOut, dependencies=[Depends(rate_limit("followup", 20))])
def follow_up(body: FollowUpIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    ensure_quota(db, user, "follow_up")
    items = followup.build(body.email, body.sent_on, body.subject, body.professor_name)
    drafts = (
        ai_tasks.write_followups(body.email, body.subject, body.sent_on, body.professor_name, body.lang,
                                 [i.send_on for i in items])
        if llm.enabled else None
    )
    if drafts:
        items = [
            FollowUpItem(day_offset=it.day_offset, send_on=it.send_on, subject=d.subject or it.subject, body=d.body,
                         note=d.note or None)
            for it, d in zip(items, drafts.drafts)
        ]
    quota = record_use(db, user, "follow_up")
    return FollowUpOut(items=items, ai_used=bool(drafts), quota=quota)
