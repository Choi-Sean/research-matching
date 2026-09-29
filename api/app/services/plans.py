"""Plans, entitlements and usage metering."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.errors import AppError, quota_exceeded
from app.models import Payment, UsageEvent, User
from app.schemas.discover import QuotaInfo

# Prices are placeholders — change them here, the web app reads them from /billing/plans.
PLANS: dict[str, dict] = {
    "weekly": {"price_cents": 700, "duration_days": 7},
    "semester": {"price_cents": 2900, "duration_days": 120},
    "lifetime": {"price_cents": 5900, "duration_days": None},
}

# Feature keys are translated by the web app (pricing.features.<key>).
PLAN_FEATURES: dict[str, list[str]] = {
    "free": ["unlimited_search", "summaries_2", "email_check_1", "ai_match_3", "outreach_tracker", "positions_board"],
    "weekly": ["everything_pro", "unlimited_summaries", "email_finder", "responsiveness", "unlimited_checks", "playbook"],
    "semester": ["everything_pro", "unlimited_summaries", "email_finder", "responsiveness", "unlimited_checks", "playbook"],
    "lifetime": ["everything_semester", "never_pay_again", "priority_features"],
}

# Lifetime allowance for free accounts. Pro accounts are unlimited (with a soft daily ceiling).
FREE_LIMITS: dict[str, int] = {
    "summary": 2,
    "email_check": 1,
    "follow_up": 1,
    "match_positions": 3,
    "match_professors": 2,
}
PRO_DAILY_CEILING = 300
REFERRAL_REWARD_DAYS = 7


def _now() -> datetime:
    return datetime.now(timezone.utc)


def used_total(db: Session, user_id: int, feature: str) -> int:
    return db.scalar(
        select(func.count()).select_from(UsageEvent).where(UsageEvent.user_id == user_id, UsageEvent.feature == feature)
    ) or 0


def used_today(db: Session, user_id: int, feature: str) -> int:
    start = _now().replace(hour=0, minute=0, second=0, microsecond=0)
    return db.scalar(
        select(func.count())
        .select_from(UsageEvent)
        .where(UsageEvent.user_id == user_id, UsageEvent.feature == feature, UsageEvent.created_at >= start)
    ) or 0


def quota_info(db: Session, user: User, feature: str) -> QuotaInfo:
    limit = None if user.is_pro else FREE_LIMITS.get(feature)
    return QuotaInfo(feature=feature, used=used_total(db, user.id, feature), limit=limit, is_pro=user.is_pro)


def ensure_quota(db: Session, user: User, feature: str) -> None:
    """Raise if the user has no allowance left. Does not consume."""
    if user.is_pro:
        if used_today(db, user.id, feature) >= PRO_DAILY_CEILING:
            raise AppError(429, "rate_limited", "Daily limit reached. Try again tomorrow.")
        return
    limit = FREE_LIMITS.get(feature)
    if limit is not None and used_total(db, user.id, feature) >= limit:
        raise quota_exceeded(feature, limit)


def record_use(db: Session, user: User, feature: str) -> QuotaInfo:
    db.add(UsageEvent(user_id=user.id, feature=feature))
    db.commit()
    return quota_info(db, user, feature)


def activate_plan(db: Session, user: User, plan: str) -> User:
    spec = PLANS[plan]
    if spec["duration_days"] is None:
        user.plan = "lifetime"
        user.plan_expires_at = None
    elif user.plan != "lifetime":
        base = user.pro_until if user.pro_until and user.pro_until > _now() else _now()
        user.plan = plan
        user.plan_expires_at = base + timedelta(days=spec["duration_days"])
    db.commit()
    return user


def mark_paid(db: Session, provider_ref: str) -> Payment | None:
    """Idempotently finish a payment (Stripe may deliver a webhook more than once)."""
    payment = db.scalar(select(Payment).where(Payment.provider_ref == provider_ref))
    if not payment or payment.status == "paid":
        return payment
    payment.status = "paid"
    user = db.get(User, payment.user_id)
    if user:
        activate_plan(db, user, payment.plan)
    db.commit()
    return payment
