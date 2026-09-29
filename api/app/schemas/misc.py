from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.core import ORM, PositionOut, UserMini

# --------------------------------------------------------------------------- invitations


class InvitationIn(BaseModel):
    student_id: int
    position_id: int
    message: str = Field(min_length=1, max_length=4000)
    match_score: int | None = Field(default=None, ge=0, le=100)


class InvitationRespondIn(BaseModel):
    action: Literal["accept", "decline"]
    message: str | None = Field(default=None, max_length=4000)


class InvitationOut(ORM):
    id: int
    position_id: int
    message: str
    match_score: int | None = None
    status: str
    created_at: datetime
    responded_at: datetime | None = None
    position: PositionOut
    professor: UserMini
    student: UserMini


# --------------------------------------------------------------------------- bookmarks & outreach


class BookmarkIn(BaseModel):
    kind: Literal["professor", "position", "lab"]
    ref: str = Field(min_length=1, max_length=64)
    snapshot: dict | None = None


class BookmarkOut(ORM):
    id: int
    kind: str
    ref: str
    snapshot: dict | None = None
    created_at: datetime


OutreachStatus = Literal["saved", "drafted", "sent", "replied", "meeting", "positive", "no_reply", "declined"]


class OutreachIn(BaseModel):
    openalex_id: str = Field(min_length=1, max_length=32)
    professor_name: str = Field(min_length=1, max_length=200)
    institution: str | None = Field(default=None, max_length=200)
    status: OutreachStatus = "saved"
    sent_on: date | None = None
    replied_on: date | None = None
    follow_up_on: date | None = None
    notes: str | None = None


class OutreachPatch(BaseModel):
    status: OutreachStatus | None = None
    sent_on: date | None = None
    replied_on: date | None = None
    follow_up_on: date | None = None
    notes: str | None = None
    clear_dates: bool = False


class OutreachOut(ORM):
    id: int
    openalex_id: str
    professor_name: str
    institution: str | None = None
    status: str
    sent_on: date | None = None
    replied_on: date | None = None
    follow_up_on: date | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


# --------------------------------------------------------------------------- billing


class PlanOut(BaseModel):
    id: str
    price_cents: int
    currency: str = "usd"
    duration_days: int | None = None  # None = does not expire
    features: list[str]
    highlighted: bool = False


class UsageOut(BaseModel):
    feature: str
    used: int
    limit: int | None


class BillingMeOut(BaseModel):
    plan: str
    is_pro: bool
    pro_until: datetime | None = None
    usage: list[UsageOut]
    checkout_mode: str  # stripe | dev | disabled
    referral_code: str
    referrals_redeemed: int
    referral_reward_days: int


class CheckoutIn(BaseModel):
    plan: Literal["weekly", "semester", "lifetime"]
    locale: str = Field(default="en", max_length=10)


class CheckoutOut(BaseModel):
    url: str | None = None  # Stripe-hosted checkout page
    activated: bool = False  # dev mode activates immediately


class RedeemIn(BaseModel):
    code: str = Field(min_length=3, max_length=16)


class RedeemOut(BaseModel):
    reward_days: int
    pro_until: datetime | None = None


# --------------------------------------------------------------------------- community


FeedbackKind = Literal["feature", "bug", "general"]


class FeedbackIn(BaseModel):
    kind: FeedbackKind
    title: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=3, max_length=4000)


class FeedbackOut(BaseModel):
    id: int
    kind: str
    title: str
    body: str
    votes: int
    status: str
    created_at: datetime
    author_name: str
    voted: bool = False
    mine: bool = False


class FeedbackStatusIn(BaseModel):
    status: Literal["open", "planned", "in_progress", "done"]


class WaitlistIn(BaseModel):
    email: EmailStr
    feature: str = Field(default="guaranteed_response", max_length=40)
    locale: str = Field(default="en", max_length=10)


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    message: str = Field(min_length=5, max_length=5000)


class OkOut(BaseModel):
    ok: bool = True


# --------------------------------------------------------------------------- admin


class AdminOverview(BaseModel):
    users: int
    students: int
    professors: int
    pending_professors: int
    labs: int
    open_positions: int
    applications: int
    invitations: int
    feedback: int
    waitlist: int
    paid_users: int


class AdminProfessorOut(BaseModel):
    id: int
    full_name: str
    email: str
    verified: bool
    created_at: datetime
    lab_name: str | None = None
    university: str | None = None
    website: str | None = None


class VerifyIn(BaseModel):
    verified: bool = True


class WaitlistOut(BaseModel):
    id: int
    email: str
    feature: str
    locale: str
    created_at: datetime


class ContactOutRow(BaseModel):
    id: int
    name: str
    email: str
    message: str
    created_at: datetime
