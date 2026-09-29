"""Rule-based reviewer for cold emails to professors.

It never rewrites the email — it points at specific phrases and explains why they tend to backfire, because
professors reply to a student's own voice. The web app translates each ``code``; the AI reviewer (when configured)
adds free-text advice on top of these flags.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.schemas.ai import Flag, Strength

SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}

_ENGLISH_HINTS = re.compile(r"\b(the|and|to|of|my|your|i|in|for|with|is|am|would|be)\b", re.IGNORECASE)

# (code, category, severity, penalty, pattern)
_PHRASE_RULES: list[tuple[str, str, str, int, re.Pattern]] = [
    (
        "flattery", "tone", "medium", 9,
        re.compile(
            r"\b(ground[- ]?breaking|fascinating|amazing|incredible|inspir(?:ing|ational)|brilliant|revolutionary|"
            r"world[- ]renowned|renowned|legendary|visionary|remarkable|extraordinary|esteemed|prestigious|"
            r"huge fan|big fan|admire your|(?:great|huge) honou?r|dream (?:lab|professor|advisor|mentor))\b",
            re.IGNORECASE,
        ),
    ),
    (
        "generic_phrase", "voice", "medium", 6,
        re.compile(
            r"\b(highly motivated|self[- ]motivated|hard[- ]?working|passionate (?:about|for)|passion for|"
            r"align(?:s|ed)? (?:perfectly|well|closely) with|align(?:s|ed)? with my (?:interests|goals)|"
            r"would love to learn from you|opportunity to (?:work|learn) (?:under|with|from)|"
            r"i am writing to (?:inquire|express|enquire)|hope this (?:email|message) finds you well|"
            r"quick learner|team player|detail[- ]oriented|eager to (?:learn|contribute)|"
            r"(?:my|a) keen interest)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "ai_sounding", "voice", "low", 5,
        re.compile(
            r"\b(delve[sd]?|tapestry|testament to|in the realm of|at the intersection of|cutting[- ]edge|"
            r"leverag(?:e|ing)|i am thrilled|multifaceted|resonat(?:e|es|ed) (?:deeply )?with|underscor(?:e|es|ed)|"
            r"pivotal|landscape of|seamless(?:ly)?|embark(?:ed)? on|unwavering|hone my|profound(?:ly)?)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "bad_salutation", "etiquette", "high", 14,
        re.compile(r"(?:dear|hello|hi|respected)\s+sir(?:\s*/?\s*madam)?|to whom it may concern|dear madam", re.IGNORECASE),
    ),
    ("informal", "etiquette", "low", 4, re.compile(r"\b(pls|plz|asap|u r|thx|gonna|wanna|btw)\b", re.IGNORECASE)),
]

_EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
_ASK = re.compile(
    r"(would it be possible|would you|could i|could we|may i|do you (?:have|take|plan|accept)|are you (?:taking|accepting|"
    r"looking)|is there (?:any|an|a) (?:opportunity|opening|chance|room|way|position)|i(?:'d| would) (?:love|like) to "
    r"(?:join|contribute|help|volunteer|discuss|meet|talk|chat)|volunteer|open to|happy to (?:help|meet|chat|talk)|"
    r"a (?:short |quick )?(?:call|chat|meeting)|\?)",
    re.IGNORECASE,
)
_REDIRECT = re.compile(
    r"(not (?:currently )?(?:taking|accepting|looking)|no (?:room|openings?|space)|anyone else|someone (?:else )?in "
    r"(?:your|the) (?:group|lab|department)|recommend (?:anyone|someone)|point me to)", re.IGNORECASE
)
_OWN_WORK = re.compile(
    r"(i(?:'ve| have) (?:built|worked|analy[sz]ed|written|developed|implemented|been working|completed|taken|taught myself|"
    r"trained|run|ran|replicated)|i (?:built|wrote|analy[sz]ed|developed|implemented|replicated|trained)|my "
    r"(?:project|thesis|code|github|portfolio|coursework)|side project|taught myself|(?:course|class) (?:in|on))",
    re.IGNORECASE,
)
_AVAIL = re.compile(
    r"(this (?:summer|fall|spring|winter|semester|quarter)|next (?:summer|fall|spring|semester)|hours? (?:a|per) week|"
    r"hrs?/week|available (?:to|for|from|during)|i can (?:commit|dedicate))", re.IGNORECASE
)
_PAPER_REF = re.compile(
    r"(your (?:recent |latest |new )?(?:paper|article|study|preprint|publication|talk|lecture|course|work on|research on|"
    r"lab'?s? work on)|(?:20[0-2]\d|19[89]\d)\b|\b\d+(?:\.\d+)?\s?%|[\"“”][^\"“”]{12,}[\"“”]|et al\.?)",
    re.IGNORECASE,
)
_SIGNOFF = re.compile(r"(thank|best|regards|sincerely|cheers|respectfully|warmly|take care)", re.IGNORECASE)
_GENERIC_SUBJECTS = {"research", "research opportunity", "inquiry", "question", "hello", "hi", "urgent", "internship",
                     "research inquiry", "opportunity", "application", "request", "help", "interested in your lab"}


@dataclass
class RuleResult:
    score: int
    grade: str
    word_count: int
    flags: list[Flag] = field(default_factory=list)
    strengths: list[Strength] = field(default_factory=list)
    sounds_generic: int = 0
    english: bool = True


def looks_english(text: str) -> bool:
    letters = sum(c.isalpha() for c in text)
    if not letters:
        return True
    ascii_letters = sum(c.isascii() and c.isalpha() for c in text)
    hits = len(_ENGLISH_HINTS.findall(text))
    return ascii_letters / letters > 0.85 and hits >= 3


def _words(text: str) -> int:
    latin = len(re.findall(r"[A-Za-z0-9'’\-]+", text))
    cjk = len(re.findall(r"[぀-ヿ㐀-鿿가-힯]", text))
    return latin + cjk // 2


def grade_for(score: int) -> str:
    return "excellent" if score >= 85 else "good" if score >= 70 else "needs_work" if score >= 50 else "risky"


def _title_referenced(body_l: str, titles: list[str]) -> bool:
    for t in titles:
        words = [w for w in re.findall(r"[a-z0-9]{4,}", t.lower())]
        if len(words) >= 3 and sum(w in body_l for w in words) / len(words) >= 0.6:
            return True
    return False


def analyze(
    subject: str,
    body: str,
    professor_name: str | None = None,
    paper_titles: list[str] | None = None,
    topics: list[str] | None = None,
) -> RuleResult:
    body = body.replace("\r\n", "\n")
    english = looks_english(body)
    wc = _words(body)
    flags: list[Flag] = []
    strengths: list[Strength] = []
    penalty = 0
    bonus = 0
    seen: set[tuple[str, int]] = set()

    def add(code: str, category: str, severity: str, m: re.Match | None = None, pen: int = 0) -> None:
        nonlocal penalty
        start = m.start() if m else None
        key = (code, start if start is not None else -1)
        if key in seen:
            return
        seen.add(key)
        flags.append(
            Flag(id=f"{code}-{start if start is not None else 0}", code=code, category=category, severity=severity,
                 quote=m.group(0) if m else None, start=start, end=m.end() if m else None)
        )
        penalty += pen

    body_l = body.lower()

    # ---- phrase rules (English only) ------------------------------------------------------
    if english:
        caps = {"flattery": 27, "generic_phrase": 24, "ai_sounding": 15, "bad_salutation": 14, "informal": 8}
        spent: dict[str, int] = {}
        for code, cat, sev, pen, rx in _PHRASE_RULES:
            matches = list(rx.finditer(body))
            for m in matches:
                pen_eff = min(pen, max(0, caps[code] - spent.get(code, 0)))
                spent[code] = spent.get(code, 0) + pen_eff
                severity = "high" if (code == "flattery" and len(matches) >= 3) else sev
                add(code, cat, severity, m, pen_eff)

        first_line = next((ln for ln in body.split("\n") if ln.strip()), "")
        if re.match(r"^\s*(dear|hi|hello)\s+(professor|prof\.?|dr\.?)\s*[,!:]?\s*$", first_line, re.IGNORECASE):
            m = re.match(r"^\s*(?:dear|hi|hello)\s+(?:professor|prof\.?|dr\.?)", first_line, re.IGNORECASE)
            add("missing_name", "etiquette", "medium", m, 6)
        elif re.match(r"^\s*(dear|hi|hello)\s+(professor|prof\.?|dr\.?)\s+\w+", first_line, re.IGNORECASE):
            strengths.append(Strength(code="personal_greeting"))
            bonus += 2
        if professor_name:
            last = re.sub(r"[^a-z\-' ]", "", professor_name.lower().replace(".", " ")).split()
            if last and last[-1] not in body_l:
                add("name_not_mentioned", "etiquette", "low", None, 3)

        # ---- specificity ------------------------------------------------------------------
        generic_ref = bool(_PAPER_REF.search(body))
        if paper_titles or topics:  # we know who the professor is — check the email is really about *their* work
            topic_words = {w for t in (topics or []) for w in re.findall(r"[a-z]{5,}", t.lower())}
            topical = sum(w in body_l for w in topic_words) >= 2
            if _title_referenced(body_l, paper_titles or []) or (topical and generic_ref):
                strengths.append(Strength(code="specific_reference"))
                bonus += 8
            else:
                add("no_specific_reference", "specificity", "high", None, 14)
        elif generic_ref:
            strengths.append(Strength(code="specific_reference"))
            bonus += 8
        else:
            add("low_specificity", "specificity", "medium", None, 12)

        # ---- own work, ask, availability ---------------------------------------------------
        if _OWN_WORK.search(body):
            strengths.append(Strength(code="shows_own_work"))
            bonus += 6
        elif wc >= 40:
            add("no_own_work", "specificity", "low", None, 4)
        if _ASK.search(body):
            strengths.append(Strength(code="clear_ask"))
            bonus += 5
        else:
            add("no_clear_ask", "ask", "high", None, 14)
        if _REDIRECT.search(body):
            strengths.append(Strength(code="redirect_offer"))
            bonus += 3
        if _AVAIL.search(body):
            strengths.append(Strength(code="states_availability"))
            bonus += 3
        tail = "\n".join(body.strip().split("\n")[-4:])
        if not _SIGNOFF.search(tail):
            add("no_signoff", "etiquette", "low", None, 3)

    # ---- language-independent structure -------------------------------------------------------
    excl = list(re.finditer(r"!", body))
    if len(excl) >= 2:
        add("exclamation", "tone", "low", excl[1], 4)
    for m in _EMOJI.finditer(body):
        add("emoji", "tone", "medium", m, 6)
        break
    shouting = [m for m in re.finditer(r"\b[A-Z]{6,}\b", body)]
    if len(shouting) >= 1:
        add("all_caps", "tone", "low", shouting[0], 4)

    if wc < 45:
        add("too_short", "clarity", "medium", None, 10)
    elif wc > 300:
        add("too_long", "clarity", "high", None, 16)
    elif wc > 220:
        add("too_long", "clarity", "medium", None, 9)
    else:
        if 60 <= wc <= 180:
            strengths.append(Strength(code="concise"))
            bonus += 3
    if wc > 120 and "\n\n" not in body.strip():
        add("wall_of_text", "clarity", "low", None, 4)

    # ---- subject line -----------------------------------------------------------------------------
    subj = (subject or "").strip()
    if not subj:
        add("no_subject", "subject", "low", None, 2)
    else:
        if subj.lower().strip(" .!") in _GENERIC_SUBJECTS:
            add("subject_generic", "subject", "medium", None, 5)
        elif len(subj) < 8:
            add("subject_short", "subject", "low", None, 3)
        elif len(subj) > 90:
            add("subject_long", "subject", "low", None, 3)
        if subj.isupper() and len(subj) > 6 or "urgent" in subj.lower():
            add("subject_shouty", "subject", "medium", None, 5)

    score = max(0, min(100, 78 - penalty + bonus))
    generic_hits = sum(1 for f in flags if f.code in ("generic_phrase", "flattery", "ai_sounding"))
    sounds_generic = min(100, generic_hits * 14 + (30 if any(f.code in ("low_specificity", "no_specific_reference")
                                                              for f in flags) else 0) + (10 if wc < 45 else 0))
    flags.sort(key=lambda f: (SEVERITY_ORDER[f.severity], f.start if f.start is not None else 10**6))
    return RuleResult(score=score, grade=grade_for(score), word_count=wc, flags=flags, strengths=strengths,
                      sounds_generic=sounds_generic, english=english)
