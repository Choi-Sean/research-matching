"""Best-guess institutional email patterns.

These are *guesses from a naming convention*, never verified addresses — the web app labels them that way and
links to a faculty-directory search so students can confirm before sending.
"""
from __future__ import annotations

import re
import unicodedata
from urllib.parse import quote_plus

from app.schemas.discover import EmailCandidate

_SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "phd", "md", "dr", "prof", "professor", "mr", "ms", "mrs"}


def _ascii(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def name_parts(display_name: str) -> tuple[str, str] | None:
    parts = [re.sub(r"[^a-z\-]", "", _ascii(p).lower()) for p in re.split(r"[\s.]+", display_name)]
    parts = [p.strip("-") for p in parts if p and p not in _SUFFIXES]
    parts = [p for p in parts if p]
    if len(parts) < 2:
        return None
    return parts[0], parts[-1]


# (pattern label, builder, prior popularity 0-100)
_PATTERNS = [
    ("first.last", lambda f, l: f"{f}.{l}", 36),
    ("flast", lambda f, l: f"{f[0]}{l}", 22),
    ("first", lambda f, l: f, 12),
    ("firstlast", lambda f, l: f"{f}{l}", 9),
    ("first_last", lambda f, l: f"{f}_{l}", 6),
    ("f.last", lambda f, l: f"{f[0]}.{l}", 6),
    ("last", lambda f, l: l, 5),
    ("firstl", lambda f, l: f"{f}{l[0]}", 4),
]


def candidates(display_name: str, domain: str | None) -> list[EmailCandidate]:
    parts = name_parts(display_name)
    if not parts or not domain:
        return []
    f, l = parts
    out: list[EmailCandidate] = []
    seen: set[str] = set()
    for label, build, prior in _PATTERNS:
        local = build(f, l)
        if local in seen or not local:
            continue
        seen.add(local)
        out.append(EmailCandidate(address=f"{local}@{domain}", pattern=label, confidence=prior))
    return out


def directory_search_url(display_name: str, domain: str | None) -> str | None:
    if not domain:
        return None
    return "https://www.google.com/search?q=" + quote_plus(f'"{display_name}" site:{domain}')
