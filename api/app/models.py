"""Database models.

Text columns use ``Unicode`` / ``UnicodeText`` (NVARCHAR on MSSQL) so content in any language is stored safely.
Columns that must be unique are never nullable — MSSQL treats NULLs as equal inside a unique index.
"""
from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Unicode,
    UnicodeText,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config import settings
from app.db import Base
from app.types import JsonText


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(dt: datetime | None) -> datetime | None:
    """SQLite returns naive datetimes; treat them as UTC."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


# --------------------------------------------------------------------------- accounts


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(Unicode(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Unicode(255))
    role: Mapped[str] = mapped_column(Unicode(20))  # professor | student
    full_name: Mapped[str] = mapped_column(Unicode(200))
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)  # professor identity verified by an admin
    locale: Mapped[str] = mapped_column(Unicode(10), default="en")
    referral_code: Mapped[str] = mapped_column(Unicode(16), unique=True)
    plan: Mapped[str] = mapped_column(Unicode(20), default="free")  # free | weekly | semester | lifetime
    plan_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    bonus_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # referral rewards
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    @property
    def is_pro(self) -> bool:
        now = _now()
        if self.plan == "lifetime":
            return True
        for until in (self.plan_expires_at, self.bonus_until):
            until = _aware(until)
            if until and until > now:
                return True
        return False

    @property
    def pro_until(self) -> datetime | None:
        candidates = [d for d in (_aware(self.plan_expires_at), _aware(self.bonus_until)) if d]
        return max(candidates) if candidates else None

    @property
    def is_admin(self) -> bool:
        return self.email.lower() in settings.admin_email_set


class Lab(Base):
    __tablename__ = "labs"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(Unicode(200))
    university: Mapped[str] = mapped_column(Unicode(200), index=True)
    department: Mapped[str] = mapped_column(Unicode(200), index=True)
    website: Mapped[str | None] = mapped_column(Unicode(500))
    bio: Mapped[str | None] = mapped_column(UnicodeText)
    keywords: Mapped[str | None] = mapped_column(Unicode(500))  # comma-separated
    culture: Mapped[str | None] = mapped_column(UnicodeText)  # "what it's like to work here"
    team_size: Mapped[int | None] = mapped_column(Integer)
    work_style: Mapped[dict | None] = mapped_column(JsonText)  # {autonomy, collaboration, pace, structure: 1..5}
    openalex_author_id: Mapped[str | None] = mapped_column(Unicode(32), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    owner: Mapped[User] = relationship()
    positions: Mapped[list["Position"]] = relationship(back_populates="lab")
    materials: Mapped[list["Material"]] = relationship(back_populates="lab")

    @property
    def owner_name(self) -> str:
        return self.owner.full_name

    @property
    def owner_verified(self) -> bool:
        return self.owner.verified


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[int] = mapped_column(primary_key=True)
    lab_id: Mapped[int] = mapped_column(ForeignKey("labs.id"), index=True)
    title: Mapped[str] = mapped_column(Unicode(300))
    description: Mapped[str] = mapped_column(UnicodeText)
    requirements: Mapped[str | None] = mapped_column(UnicodeText)
    required_skills: Mapped[str | None] = mapped_column(Unicode(500))  # comma-separated
    keywords: Mapped[str | None] = mapped_column(Unicode(500))
    compensation: Mapped[str] = mapped_column(Unicode(20))  # paid | credit | volunteer
    hours_per_week: Mapped[int | None] = mapped_column(Integer)
    term: Mapped[str | None] = mapped_column(Unicode(20))  # fall|spring|summer|year_round|flexible
    location_type: Mapped[str | None] = mapped_column(Unicode(20))  # on_site|remote|hybrid
    slots: Mapped[int | None] = mapped_column(Integer)
    deadline: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(Unicode(20), default="open", index=True)  # open | closed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    lab: Mapped[Lab] = relationship(back_populates="positions")
    applications: Mapped[list["Application"]] = relationship(back_populates="position")

    @property
    def applicant_count(self) -> int:
        return len(self.applications)


class Material(Base):
    """Research material a professor shares (paper, dataset, poster, ...)."""

    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    lab_id: Mapped[int] = mapped_column(ForeignKey("labs.id"), index=True)
    title: Mapped[str] = mapped_column(Unicode(300))
    description: Mapped[str | None] = mapped_column(UnicodeText)
    kind: Mapped[str] = mapped_column(Unicode(20))  # paper | dataset | poster | other
    url: Mapped[str] = mapped_column(Unicode(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    lab: Mapped[Lab] = relationship(back_populates="materials")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    university: Mapped[str | None] = mapped_column(Unicode(200))
    major: Mapped[str | None] = mapped_column(Unicode(200))
    year: Mapped[str | None] = mapped_column(Unicode(20))
    bio: Mapped[str | None] = mapped_column(UnicodeText)
    skills: Mapped[str | None] = mapped_column(Unicode(500))  # comma-separated
    interests: Mapped[str | None] = mapped_column(UnicodeText)
    experience: Mapped[str | None] = mapped_column(UnicodeText)  # projects, courses, past research
    resume_url: Mapped[str | None] = mapped_column(Unicode(1000))
    website_url: Mapped[str | None] = mapped_column(Unicode(500))
    github_url: Mapped[str | None] = mapped_column(Unicode(500))
    availability_hours: Mapped[int | None] = mapped_column(Integer)
    work_style: Mapped[dict | None] = mapped_column(JsonText)
    discoverable: Mapped[bool] = mapped_column(Boolean, default=False)  # visible to verified professors
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped[User] = relationship()


# --------------------------------------------------------------------------- applications & invitations


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("position_id", "student_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    position_id: Mapped[int] = mapped_column(ForeignKey("positions.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    message: Mapped[str] = mapped_column(UnicodeText)
    status: Mapped[str] = mapped_column(Unicode(20), default="pending")  # pending|accepted|rejected|withdrawn
    invited: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    position: Mapped[Position] = relationship(back_populates="applications")
    student: Mapped[User] = relationship()
    profile: Mapped["StudentProfile | None"] = relationship(
        primaryjoin="foreign(Application.student_id) == remote(StudentProfile.user_id)",
        viewonly=True,
        uselist=False,
    )


class Invitation(Base):
    """A professor asks a discoverable student to apply."""

    __tablename__ = "invitations"
    __table_args__ = (UniqueConstraint("position_id", "student_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    position_id: Mapped[int] = mapped_column(ForeignKey("positions.id"), index=True)
    professor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    message: Mapped[str] = mapped_column(UnicodeText)
    match_score: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(Unicode(20), default="pending")  # pending|accepted|declined|withdrawn
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    position: Mapped[Position] = relationship()
    professor: Mapped[User] = relationship(foreign_keys=[professor_id])
    student: Mapped[User] = relationship(foreign_keys=[student_id])


# --------------------------------------------------------------------------- student tools


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "kind", "ref"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(Unicode(20))  # professor | position | lab
    ref: Mapped[str] = mapped_column(Unicode(64))
    snapshot: Mapped[dict | None] = mapped_column(JsonText)  # enough to render the card without refetching
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class OutreachEntry(Base):
    """A student's outreach to one professor — also feeds the community responsiveness score."""

    __tablename__ = "outreach_entries"
    __table_args__ = (UniqueConstraint("user_id", "openalex_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    openalex_id: Mapped[str] = mapped_column(Unicode(32), index=True)
    professor_name: Mapped[str] = mapped_column(Unicode(200))
    institution: Mapped[str | None] = mapped_column(Unicode(200))
    # saved | drafted | sent | replied | meeting | positive | no_reply | declined
    status: Mapped[str] = mapped_column(Unicode(20), default="saved")
    sent_on: Mapped[date | None] = mapped_column(Date)
    replied_on: Mapped[date | None] = mapped_column(Date)
    follow_up_on: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(UnicodeText)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


# --------------------------------------------------------------------------- caches & metering


class ProfessorSummary(Base):
    __tablename__ = "professor_summaries"
    __table_args__ = (UniqueConstraint("openalex_id", "lang"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    openalex_id: Mapped[str] = mapped_column(Unicode(32), index=True)
    lang: Mapped[str] = mapped_column(Unicode(10))
    content: Mapped[dict] = mapped_column(JsonText)
    source: Mapped[str] = mapped_column(Unicode(20))  # ai | extractive
    model: Mapped[str | None] = mapped_column(Unicode(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class SummaryUnlock(Base):
    """A user has spent one of their summary credits on this professor (revisiting is free)."""

    __tablename__ = "summary_unlocks"
    __table_args__ = (UniqueConstraint("user_id", "openalex_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    openalex_id: Mapped[str] = mapped_column(Unicode(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class UsageEvent(Base):
    __tablename__ = "usage_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    feature: Mapped[str] = mapped_column(Unicode(40), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


# --------------------------------------------------------------------------- billing & growth


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    plan: Mapped[str] = mapped_column(Unicode(20))
    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(Unicode(8), default="usd")
    provider: Mapped[str] = mapped_column(Unicode(20))  # stripe | dev
    provider_ref: Mapped[str] = mapped_column(Unicode(120), unique=True)
    status: Mapped[str] = mapped_column(Unicode(20), default="pending")  # pending | paid
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(primary_key=True)
    referrer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    referred_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    reward_days: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


# --------------------------------------------------------------------------- community


class FeedbackPost(Base):
    __tablename__ = "feedback_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(Unicode(20))  # feature | bug | general
    title: Mapped[str] = mapped_column(Unicode(200))
    body: Mapped[str] = mapped_column(UnicodeText)
    votes: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(Unicode(20), default="open")  # open | planned | in_progress | done
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    author: Mapped[User] = relationship()


class FeedbackVote(Base):
    __tablename__ = "feedback_votes"
    __table_args__ = (UniqueConstraint("post_id", "user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("feedback_posts.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"
    __table_args__ = (UniqueConstraint("email", "feature"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(Unicode(255))
    feature: Mapped[str] = mapped_column(Unicode(40))
    locale: Mapped[str] = mapped_column(Unicode(10), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(Unicode(200))
    email: Mapped[str] = mapped_column(Unicode(255))
    message: Mapped[str] = mapped_column(UnicodeText)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
