"""Follow-up timeline for a cold email that got no reply (rule-based; the AI version personalises the wording)."""
from __future__ import annotations

import re
from datetime import date, timedelta

from app.schemas.ai import FollowUpItem

# Calendar days after the original send. Long enough to be polite, short enough to still be on their radar.
OFFSETS = (7, 16)


def next_weekday(d: date) -> date:
    while d.weekday() >= 5:  # Sat/Sun → Monday
        d += timedelta(days=1)
    return d


def schedule(sent_on: date) -> list[tuple[int, date]]:
    return [(off, next_weekday(sent_on + timedelta(days=off))) for off in OFFSETS]


def _greeting_name(email: str, professor_name: str | None) -> str:
    m = re.search(r"(?i:dear|hi|hello)\s+(?i:professor|prof\.?|dr\.?)\s+([A-Z][\w'’\-]+)", email)
    if m:
        return f"Professor {m.group(1)}"
    if professor_name:
        last = re.sub(r"[^\w'’\- ]", "", professor_name).split()
        if last:
            return f"Professor {last[-1]}"
    return "Professor"


def _topic(email: str) -> str | None:
    m = re.search(
        r"your (?:recent |latest |new )?(?:paper|work|research|study|article|preprint|lab'?s? work)\s+(?:on|about|in)\s+"
        r"([^.,;:!?\n]{6,80})",
        email,
        re.IGNORECASE,
    )
    return m.group(1).strip() if m else None


def build(email: str, sent_on: date, subject: str = "", professor_name: str | None = None) -> list[FollowUpItem]:
    name = _greeting_name(email, professor_name)
    topic = _topic(email)
    re_subject = subject.strip()
    re_subject = re_subject if re_subject.lower().startswith("re:") else f"Re: {re_subject}" if re_subject else "Following up"
    sent_txt = f"{sent_on.strftime('%B')} {sent_on.day}"
    interest = f" I'm still very interested in your work on {topic}." if topic else " I'm still very interested in your research."

    first = (
        f"Hi {name},\n\n"
        f"I wanted to follow up on the note I sent on {sent_txt}, in case it got buried.{interest} "
        f"If you're not taking on students right now, I'd be grateful if you could point me to someone in your group "
        f"or department who might be.\n\n"
        f"Thank you for your time,\n[Your name]"
    )
    second = (
        f"Hi {name},\n\n"
        f"One last note from me — I know how busy the term is, so no pressure at all. If the timing isn't right, "
        f"I'd be glad to reach out again next semester, and I'd appreciate any suggestion for who else I might contact."
        f"{' I have been continuing to read about ' + topic + '.' if topic else ''}\n\n"
        f"Thank you again,\n[Your name]"
    )
    (o1, d1), (o2, d2) = schedule(sent_on)
    return [
        FollowUpItem(day_offset=o1, send_on=d1, subject=re_subject, body=first),
        FollowUpItem(day_offset=o2, send_on=d2, subject=re_subject, body=second),
    ]

