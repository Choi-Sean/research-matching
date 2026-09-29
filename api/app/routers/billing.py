"""Plans, checkout (Stripe one-time payments) and referral rewards."""
import logging
import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.errors import AppError, bad_request, unprocessable
from app.models import Payment, Referral, User
from app.routers.auth import grant_bonus
from app.schemas.misc import (
    BillingMeOut,
    CheckoutIn,
    CheckoutOut,
    OkOut,
    PlanOut,
    RedeemIn,
    RedeemOut,
    UsageOut,
)
from app.security import current_user
from app.services import plans
from app.services.plans import FREE_LIMITS, PLAN_FEATURES, PLANS, REFERRAL_REWARD_DAYS

log = logging.getLogger("labora.billing")
router = APIRouter(tags=["billing"])


def checkout_mode() -> str:
    if settings.stripe_secret_key:
        return "stripe"
    return "disabled" if settings.is_production else "dev"


@router.get("/billing/plans", response_model=list[PlanOut])
def list_plans():
    out = [PlanOut(id="free", price_cents=0, duration_days=None, features=PLAN_FEATURES["free"])]
    for pid, spec in PLANS.items():
        out.append(
            PlanOut(id=pid, price_cents=spec["price_cents"], duration_days=spec["duration_days"],
                    features=PLAN_FEATURES[pid], highlighted=pid == "semester")
        )
    return out


@router.get("/billing/me", response_model=BillingMeOut)
def me(user: User = Depends(current_user), db: Session = Depends(get_db)):
    usage = [
        UsageOut(feature=f, used=plans.used_total(db, user.id, f), limit=None if user.is_pro else lim)
        for f, lim in FREE_LIMITS.items()
    ]
    redeemed = db.scalar(select(func.count()).select_from(Referral).where(Referral.referrer_id == user.id)) or 0
    return BillingMeOut(
        plan=user.plan, is_pro=user.is_pro, pro_until=user.pro_until, usage=usage, checkout_mode=checkout_mode(),
        referral_code=user.referral_code, referrals_redeemed=redeemed, referral_reward_days=REFERRAL_REWARD_DAYS,
    )


@router.post("/billing/checkout", response_model=CheckoutOut)
def checkout(body: CheckoutIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    spec = PLANS[body.plan]
    mode = checkout_mode()
    if mode == "disabled":
        raise AppError(503, "billing_disabled", "Payments aren't available yet.")

    if mode == "dev":  # local development only — activates instantly, no money moves
        db.add(Payment(user_id=user.id, plan=body.plan, amount_cents=spec["price_cents"], provider="dev",
                       provider_ref=f"dev_{uuid.uuid4().hex}", status="paid"))
        plans.activate_plan(db, user, body.plan)
        return CheckoutOut(activated=True)

    import stripe

    stripe.api_key = settings.stripe_secret_key
    base = settings.frontend_url.rstrip("/")
    loc = body.locale or "en"
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{
                "quantity": 1,
                "price_data": {
                    "currency": "usd",
                    "unit_amount": spec["price_cents"],
                    "product_data": {"name": f"Labora {body.plan.capitalize()} access"},
                },
            }],
            success_url=f"{base}/{loc}/dashboard/billing?checkout=success",
            cancel_url=f"{base}/{loc}/pricing?checkout=cancelled",
            client_reference_id=str(user.id),
            customer_email=user.email,
            metadata={"user_id": str(user.id), "plan": body.plan},
        )
    except Exception as exc:  # noqa: BLE001
        log.error("Stripe checkout failed: %s", exc)
        raise AppError(502, "upstream_unavailable", "Payment provider unavailable. Please try again.")
    db.add(Payment(user_id=user.id, plan=body.plan, amount_cents=spec["price_cents"], provider="stripe",
                   provider_ref=session.id, status="pending"))
    db.commit()
    return CheckoutOut(url=session.url)


@router.post("/billing/webhook", response_model=OkOut)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not (settings.stripe_secret_key and settings.stripe_webhook_secret):
        raise AppError(503, "billing_disabled", "Webhook not configured.")
    import stripe

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, request.headers.get("stripe-signature"), settings.stripe_webhook_secret
        )
    except Exception:  # bad payload or signature
        raise bad_request("invalid_signature", "Invalid signature.")
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        if session.get("payment_status") == "paid":
            plans.mark_paid(db, session["id"])
    return OkOut()


@router.post("/referrals/redeem", response_model=RedeemOut)
def redeem(body: RedeemIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    code = body.code.strip().upper()
    if db.scalar(select(Referral.id).where(Referral.referred_id == user.id)):
        raise unprocessable("referral_already_used", "You've already redeemed a code.")
    referrer = db.scalar(select(User).where(User.referral_code == code))
    if not referrer:
        raise unprocessable("invalid_referral_code", "That referral code doesn't exist.")
    if referrer.id == user.id:
        raise unprocessable("own_referral_code", "You can't redeem your own code.")
    db.add(Referral(referrer_id=referrer.id, referred_id=user.id, reward_days=REFERRAL_REWARD_DAYS))
    grant_bonus(referrer, REFERRAL_REWARD_DAYS)
    grant_bonus(user, REFERRAL_REWARD_DAYS)
    db.commit()
    return RedeemOut(reward_days=REFERRAL_REWARD_DAYS, pro_until=user.pro_until)
