import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.errors import conflict, unauthorized, unprocessable, AppError
from app.models import (
    Application,
    Bookmark,
    FeedbackVote,
    Invitation,
    Lab,
    Material,
    OutreachEntry,
    Position,
    Referral,
    StudentProfile,
    SummaryUnlock,
    UsageEvent,
    User,
    Payment,
    FeedbackPost,
    _aware,
)
from app.ratelimit import rate_limit
from app.schemas.core import DeleteAccountIn, PasswordChangeIn, RegisterIn, TokenOut, UserOut, UserUpdateIn
from app.schemas.misc import OkOut
from app.security import create_token, current_user, hash_password, verify_password
from app.services.plans import REFERRAL_REWARD_DAYS

router = APIRouter(prefix="/auth", tags=["auth"])

_ACADEMIC = re.compile(r"\.(edu(\.[a-z]{2})?|ac\.[a-z]{2})$", re.IGNORECASE)
_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no 0/O/1/I/L lookalikes


def is_academic_email(email: str) -> bool:
    return bool(_ACADEMIC.search(email.split("@")[-1]))


def new_referral_code(db: Session) -> str:
    while True:
        code = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(8))
        if not db.scalar(select(User.id).where(User.referral_code == code)):
            return code


def grant_bonus(user: User, days: int) -> None:
    now = datetime.now(timezone.utc)
    current = _aware(user.bonus_until)
    user.bonus_until = (current if current and current > now else now) + timedelta(days=days)


@router.post("/register", response_model=UserOut, status_code=201, dependencies=[Depends(rate_limit("register", 10))])
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if settings.require_edu_email and not is_academic_email(email):
        raise unprocessable("email_not_academic", "Please use your university email address (for example .edu or .ac.uk).")
    if db.scalar(select(User).where(User.email == email)):
        raise conflict("email_taken", "That email is already registered.")

    referrer = None
    if body.referral_code:
        referrer = db.scalar(select(User).where(User.referral_code == body.referral_code.strip().upper()))
        if not referrer:
            raise unprocessable("invalid_referral_code", "That referral code doesn't exist.")

    user = User(
        email=email,
        password_hash=hash_password(body.password),
        role=body.role,
        full_name=body.full_name.strip(),
        locale=body.locale or "en",
        referral_code=new_referral_code(db),
        verified=body.role == "professor" and settings.auto_verify_professors,
    )
    db.add(user)
    db.flush()
    if user.role == "student":
        db.add(StudentProfile(user_id=user.id))
    if referrer:
        db.add(Referral(referrer_id=referrer.id, referred_id=user.id, reward_days=REFERRAL_REWARD_DAYS))
        grant_bonus(referrer, REFERRAL_REWARD_DAYS)
        grant_bonus(user, REFERRAL_REWARD_DAYS)
    db.commit()
    return user


@router.post("/login", response_model=TokenOut, dependencies=[Depends(rate_limit("login", 15))])
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == form.username.strip().lower()))
    if not user or not verify_password(form.password, user.password_hash):
        raise unauthorized("invalid_credentials", "Incorrect email or password.")
    return TokenOut(access_token=create_token(user.id))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(body: UserUpdateIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if body.full_name is not None:
        user.full_name = body.full_name.strip()
    if body.locale is not None:
        user.locale = body.locale
    db.commit()
    return user


@router.post("/change-password", response_model=OkOut)
def change_password(body: PasswordChangeIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, user.password_hash):
        raise unauthorized("invalid_credentials", "Your current password is incorrect.")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return OkOut()


@router.post("/delete-account", response_model=OkOut)
def delete_account(body: DeleteAccountIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Permanently removes the account and everything attached to it."""
    if not verify_password(body.password, user.password_hash):
        raise unauthorized("invalid_credentials", "Password is incorrect.")
    uid = user.id
    lab = db.scalar(select(Lab).where(Lab.owner_id == uid))
    if lab:
        pos_ids = list(db.scalars(select(Position.id).where(Position.lab_id == lab.id)).all())
        if pos_ids:
            db.execute(delete(Application).where(Application.position_id.in_(pos_ids)))
            db.execute(delete(Invitation).where(Invitation.position_id.in_(pos_ids)))
            db.execute(delete(Position).where(Position.id.in_(pos_ids)))
        db.execute(delete(Material).where(Material.lab_id == lab.id))
        db.execute(delete(Lab).where(Lab.id == lab.id))
    db.execute(delete(Application).where(Application.student_id == uid))
    db.execute(delete(Invitation).where((Invitation.student_id == uid) | (Invitation.professor_id == uid)))
    db.execute(delete(Bookmark).where(Bookmark.user_id == uid))
    db.execute(delete(OutreachEntry).where(OutreachEntry.user_id == uid))
    db.execute(delete(SummaryUnlock).where(SummaryUnlock.user_id == uid))
    db.execute(delete(UsageEvent).where(UsageEvent.user_id == uid))
    db.execute(delete(FeedbackVote).where(FeedbackVote.user_id == uid))
    post_ids = list(db.scalars(select(FeedbackPost.id).where(FeedbackPost.user_id == uid)).all())
    if post_ids:
        db.execute(delete(FeedbackVote).where(FeedbackVote.post_id.in_(post_ids)))
        db.execute(delete(FeedbackPost).where(FeedbackPost.id.in_(post_ids)))
    db.execute(delete(Referral).where((Referral.referrer_id == uid) | (Referral.referred_id == uid)))
    db.execute(delete(Payment).where(Payment.user_id == uid))
    db.execute(delete(StudentProfile).where(StudentProfile.user_id == uid))
    db.execute(delete(User).where(User.id == uid))
    db.commit()
    return OkOut()
