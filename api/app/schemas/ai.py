from datetime import date

from pydantic import BaseModel, Field

from app.schemas.core import PositionOut, WorkStyle
from app.schemas.discover import ProfessorCard, QuotaInfo

# --------------------------------------------------------------------------- email checker


class EmailCheckIn(BaseModel):
    subject: str = Field(default="", max_length=300)
    body: str = Field(min_length=20, max_length=8000)
    professor_id: str | None = Field(default=None, max_length=32)
    professor_name: str | None = Field(default=None, max_length=200)
    lang: str = Field(default="en", max_length=10)  # language for AI commentary


class Flag(BaseModel):
    id: str
    code: str  # stable key the web app translates
    category: str  # tone | specificity | voice | clarity | ask | etiquette | subject
    severity: str  # high | medium | low
    quote: str | None = None
    start: int | None = None  # character offsets into body, for highlighting
    end: int | None = None
    advice: str | None = None  # free-text advice from the AI reviewer (already in the requested language)
    source: str = "rule"  # rule | ai


class Strength(BaseModel):
    code: str
    text: str | None = None


class EmailCheckOut(BaseModel):
    score: int
    grade: str  # excellent | good | needs_work | risky
    word_count: int
    flags: list[Flag]
    strengths: list[Strength]
    ai_summary: str | None = None
    sounds_generic: int | None = None  # 0-100, from the AI reviewer when available
    ai_used: bool = False
    english_checks: bool = True  # phrase rules only run on English text
    quota: QuotaInfo


class FollowUpIn(BaseModel):
    email: str = Field(min_length=20, max_length=8000)
    sent_on: date
    subject: str = Field(default="", max_length=300)
    professor_name: str | None = Field(default=None, max_length=200)
    lang: str = Field(default="en", max_length=10)


class FollowUpItem(BaseModel):
    day_offset: int
    send_on: date
    subject: str
    body: str
    note: str | None = None


class FollowUpOut(BaseModel):
    items: list[FollowUpItem]
    ai_used: bool = False
    quota: QuotaInfo


# --------------------------------------------------------------------------- matching


class MatchReason(BaseModel):
    code: str  # translated by the web app; `items` fill the placeholders
    items: list[str] = []
    text: str | None = None  # free text from the AI reviewer, if any


class ProfileStrength(BaseModel):
    score: int
    missing: list[str]


class PositionMatch(BaseModel):
    position: PositionOut
    score: int
    breakdown: dict[str, int] = {}
    reasons: list[MatchReason] = []
    gaps: list[MatchReason] = []
    tip: str | None = None


class MatchPositionsIn(BaseModel):
    lang: str = Field(default="en", max_length=10)
    limit: int = Field(default=10, ge=1, le=30)


class MatchPositionsOut(BaseModel):
    items: list[PositionMatch]
    ai_used: bool = False
    strength: ProfileStrength
    quota: QuotaInfo


class ProfessorMatch(BaseModel):
    professor: ProfessorCard
    score: int
    reasons: list[MatchReason] = []
    gaps: list[MatchReason] = []
    matched_keywords: list[str] = []
    tip: str | None = None


class MatchProfessorsIn(BaseModel):
    lang: str = Field(default="en", max_length=10)
    query: str | None = Field(default=None, max_length=500)  # optional extra direction from the student
    institution_id: str | None = Field(default=None, max_length=64)
    limit: int = Field(default=10, ge=1, le=25)


class MatchProfessorsOut(BaseModel):
    items: list[ProfessorMatch]
    keywords_used: list[str]
    ai_used: bool = False
    strength: ProfileStrength
    quota: QuotaInfo


class Persona(BaseModel):
    """The 'ideal student' a professor describes — or the AI derives from a position."""

    headline: str = ""
    summary: str = ""
    must_have: list[str] = []
    nice_to_have: list[str] = []
    traits: list[str] = []
    keywords: list[str] = []
    work_style: WorkStyle | None = None


class PersonaIn(BaseModel):
    position_id: int | None = None
    text: str | None = Field(default=None, max_length=4000)
    lang: str = Field(default="en", max_length=10)


class PersonaOut(BaseModel):
    persona: Persona
    ai_used: bool = False


class MatchStudentsIn(BaseModel):
    position_id: int | None = None
    persona: Persona
    lang: str = Field(default="en", max_length=10)
    limit: int = Field(default=10, ge=1, le=30)


class StudentCandidate(BaseModel):
    user_id: int
    full_name: str
    university: str | None = None
    major: str | None = None
    year: str | None = None
    bio: str | None = None
    skills: list[str] = []
    interests: str | None = None
    experience: str | None = None
    availability_hours: int | None = None
    work_style: dict | None = None
    github_url: str | None = None
    website_url: str | None = None
    score: int
    breakdown: dict[str, int] = {}
    reasons: list[MatchReason] = []
    gaps: list[MatchReason] = []
    tip: str | None = None
    invited: bool = False


class MatchStudentsOut(BaseModel):
    persona: Persona
    items: list[StudentCandidate]
    ai_used: bool = False
    pool_size: int = 0
    searches_left_today: int | None = None
