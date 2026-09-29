"""Aggregate, anonymous statistics derived from what users do on Labora."""
from __future__ import annotations

from datetime import datetime, timezone
from statistics import median

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Application, OutreachEntry, Position, _aware
from app.schemas.discover import ResponsivenessOut

MIN_SAMPLE = 3
_SENT_STATES = {"sent", "replied", "meeting", "positive", "no_reply", "declined"}
_REPLIED_STATES = {"replied", "meeting", "positive", "declined"}


def responsiveness(db: Session, openalex_id: str) -> ResponsivenessOut:
    """Reply rate for one researcher, from students' own outreach logs. Never exposes who reported what."""
    rows = db.scalars(select(OutreachEntry).where(OutreachEntry.openalex_id == openalex_id)).all()
    sent = [r for r in rows if r.status in _SENT_STATES]
    n = len(sent)
    if n < MIN_SAMPLE:
        return ResponsivenessOut(level="unknown", sample_size=n)
    replied = [r for r in sent if r.status in _REPLIED_STATES]
    rate = len(replied) / n
    days = [(r.replied_on - r.sent_on).days for r in replied if r.replied_on and r.sent_on and r.replied_on >= r.sent_on]
    level = "high" if rate >= 0.5 else "medium" if rate >= 0.25 else "low"
    return ResponsivenessOut(
        level=level, sample_size=n, reply_rate=round(rate, 2), median_reply_days=float(median(days)) if days else None
    )


def lab_response_days(db: Session, lab_id: int) -> float | None:
    """Median days a lab takes to answer applications (needs at least MIN_SAMPLE decided applications)."""
    rows = db.execute(
        select(Application.created_at, Application.decided_at)
        .join(Position, Position.id == Application.position_id)
        .where(Position.lab_id == lab_id, Application.decided_at.is_not(None))
    ).all()
    days = []
    for created, decided in rows:
        c, d = _aware(created), _aware(decided)
        if c and d and d >= c:
            days.append((d - c).total_seconds() / 86400)
    return round(float(median(days)), 1) if len(days) >= MIN_SAMPLE else None


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
