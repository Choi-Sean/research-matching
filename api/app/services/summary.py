"""Professor summaries: AI-written when available, extractive (English) otherwise."""
from __future__ import annotations

import re
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import ProfessorSummary
from app.schemas.discover import ProfessorDetail, SummaryContent, SummaryOut
from app.services import ai_tasks


def _first_sentences(text: str, max_chars: int = 320) -> str:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    out = ""
    for p in parts:
        if len(out) + len(p) > max_chars and out:
            break
        out = f"{out} {p}".strip()
    return out


def extractive(d: ProfessorDetail) -> SummaryContent:
    topics = [t.name for t in d.topics_detail[:4]]
    lead = ", ".join(topics[:-1]) + (" and " if len(topics) > 1 else "") + topics[-1] if topics else "several topics"
    overview = (
        f"{d.name} works on {lead}. "
        f"They have published {d.recent_works} paper{'s' if d.recent_works != 1 else ''} in the last three years "
        f"and have an h-index of {d.h_index}."
    )
    finding, source = "", ""
    for w in d.recent_works_list:
        if w.abstract:
            finding = f"{_first_sentences(w.abstract)} ({w.year})" if w.year else _first_sentences(w.abstract)
            source = w.title
            break
    starters = []
    if topics:
        starters.append(f"What first drew the group to {topics[0]}?")
    if source:
        starters.append(f"In “{source}”, what was the hardest part of the method to get right?")
    return SummaryContent(
        overview=overview,
        key_finding=finding,
        key_finding_source=source,
        topics_plain=topics,
        good_fit_if=[f"You're curious about {t}" for t in topics[:3]],
        conversation_starters=starters[:3],
    )


def get_or_create(db: Session, d: ProfessorDetail, lang: str) -> SummaryOut:
    """Cached per (researcher, language). AI output replaces an earlier extractive fallback once AI is available."""
    row = db.scalar(select(ProfessorSummary).where(ProfessorSummary.openalex_id == d.id, ProfessorSummary.lang == lang))
    from app.services.llm import llm

    if row and (row.source == "ai" or not llm.enabled):
        return SummaryOut(**row.content, source=row.source, lang=lang, generated_at=row.created_at)

    ai = ai_tasks.summarize_professor(d, lang) if llm.enabled else None
    content = ai or extractive(d)
    source = "ai" if ai else "extractive"
    if row:
        row.content, row.source, row.model = content.model_dump(), source, settings.anthropic_model if ai else None
        row.created_at = datetime.now(timezone.utc)
    else:
        row = ProfessorSummary(openalex_id=d.id, lang=lang, content=content.model_dump(), source=source,
                               model=settings.anthropic_model if ai else None)
        db.add(row)
    db.commit()
    return SummaryOut(**content.model_dump(), source=source, lang=lang, generated_at=row.created_at)
