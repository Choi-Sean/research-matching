from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Role = Literal["professor", "student"]
Compensation = Literal["paid", "credit", "volunteer"]
Term = Literal["fall", "spring", "summer", "year_round", "flexible"]
LocationType = Literal["on_site", "remote", "hybrid"]

STYLE_KEYS = ("autonomy", "collaboration", "pace", "structure")


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class WorkStyle(BaseModel):
    """Four 1–5 dials describing how someone likes to work (or how a lab operates)."""

    autonomy: int | None = Field(default=None, ge=1, le=5)  # 1 close guidance … 5 independent
    collaboration: int | None = Field(default=None, ge=1, le=5)  # 1 solo focus … 5 team-oriented
    pace: int | None = Field(default=None, ge=1, le=5)  # 1 steady & deep … 5 fast & iterative
    structure: int | None = Field(default=None, ge=1, le=5)  # 1 exploratory … 5 well-defined tasks


def clean_style(value) -> dict | None:
    """Coerce a stored/incoming dict to a validated dict (drops unknown keys, None values)."""
    if not value:
        return None
    ws = WorkStyle.model_validate(value)
    out = {k: v for k, v in ws.model_dump().items() if v is not None}
    return out or None


# --------------------------------------------------------------------------- auth


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    role: Role
    locale: str = Field(default="en", max_length=10)
    referral_code: str | None = Field(default=None, max_length=16)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(ORM):
    id: int
    email: str
    full_name: str
    role: str
    email_verified: bool
    verified: bool
    is_admin: bool
    locale: str
    referral_code: str
    plan: str
    is_pro: bool
    pro_until: datetime | None = None
    created_at: datetime


class UserMini(ORM):
    id: int
    full_name: str


class UserUpdateIn(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    locale: str | None = Field(default=None, max_length=10)


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class DeleteAccountIn(BaseModel):
    password: str


# --------------------------------------------------------------------------- labs & positions


class LabIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    university: str = Field(min_length=1, max_length=200)
    department: str = Field(min_length=1, max_length=200)
    website: str | None = Field(default=None, max_length=500)
    bio: str | None = None
    keywords: str | None = Field(default=None, max_length=500)
    culture: str | None = None
    team_size: int | None = Field(default=None, ge=1, le=500)
    work_style: WorkStyle | None = None
    openalex_author_id: str | None = Field(default=None, max_length=32)


class LabOut(ORM):
    id: int
    owner_id: int
    owner_name: str
    owner_verified: bool
    name: str
    university: str
    department: str
    website: str | None = None
    bio: str | None = None
    keywords: str | None = None
    culture: str | None = None
    team_size: int | None = None
    work_style: dict | None = None
    openalex_author_id: str | None = None


class PositionIn(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str = Field(min_length=1)
    requirements: str | None = None
    required_skills: str | None = Field(default=None, max_length=500)
    keywords: str | None = Field(default=None, max_length=500)
    compensation: Compensation
    hours_per_week: int | None = Field(default=None, ge=1, le=60)
    term: Term | None = None
    location_type: LocationType | None = None
    slots: int | None = Field(default=None, ge=1, le=50)
    deadline: date | None = None


class PositionOut(ORM):
    id: int
    lab_id: int
    title: str
    description: str
    requirements: str | None = None
    required_skills: str | None = None
    keywords: str | None = None
    compensation: str
    hours_per_week: int | None = None
    term: str | None = None
    location_type: str | None = None
    slots: int | None = None
    deadline: date | None = None
    status: str
    created_at: datetime
    lab: LabOut


class MyPositionOut(PositionOut):
    applicant_count: int


class MaterialIn(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    kind: Literal["paper", "dataset", "poster", "other"]
    url: str = Field(min_length=1, max_length=1000)


class MaterialOut(MaterialIn, ORM):
    id: int
    lab_id: int
    created_at: datetime


# --------------------------------------------------------------------------- students


class StudentProfileIn(BaseModel):
    university: str | None = Field(default=None, max_length=200)
    major: str | None = Field(default=None, max_length=200)
    year: str | None = Field(default=None, max_length=20)
    bio: str | None = None
    skills: str | None = Field(default=None, max_length=500)
    interests: str | None = None
    experience: str | None = None
    resume_url: str | None = Field(default=None, max_length=1000)
    website_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    availability_hours: int | None = Field(default=None, ge=1, le=60)
    work_style: WorkStyle | None = None
    discoverable: bool = False

    @field_validator("*", mode="before")
    @classmethod
    def _blank_to_none(cls, v):
        return None if isinstance(v, str) and not v.strip() else v


class StudentProfileOut(ORM):
    user_id: int
    university: str | None = None
    major: str | None = None
    year: str | None = None
    bio: str | None = None
    skills: str | None = None
    interests: str | None = None
    experience: str | None = None
    resume_url: str | None = None
    website_url: str | None = None
    github_url: str | None = None
    availability_hours: int | None = None
    work_style: dict | None = None
    discoverable: bool = False


class ApplicationIn(BaseModel):
    message: str = Field(min_length=1)


class StatusIn(BaseModel):
    status: Literal["accepted", "rejected"]


class ApplicationOut(ORM):
    id: int
    position_id: int
    student_id: int
    message: str
    status: str
    invited: bool = False
    created_at: datetime
    decided_at: datetime | None = None


class MyApplicationOut(ApplicationOut):
    position: PositionOut


class ApplicantOut(ApplicationOut):
    student: UserOut
    profile: StudentProfileOut | None = None
