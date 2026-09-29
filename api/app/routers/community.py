"""Feedback board, contact form and waitlist."""
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.errors import not_found
from app.models import ContactMessage, FeedbackPost, FeedbackVote, User, WaitlistEntry
from app.ratelimit import rate_limit
from app.schemas.misc import ContactIn, FeedbackIn, FeedbackOut, OkOut, WaitlistIn
from app.security import current_user, optional_user

router = APIRouter(tags=["community"])


def _out(p: FeedbackPost, voted: set[int], viewer: User | None) -> FeedbackOut:
    return FeedbackOut(
        id=p.id, kind=p.kind, title=p.title, body=p.body, votes=p.votes, status=p.status, created_at=p.created_at,
        author_name=p.author.full_name.split()[0] if p.author.full_name else "—",
        voted=p.id in voted, mine=bool(viewer and viewer.id == p.user_id),
    )


@router.get("/feedback", response_model=list[FeedbackOut])
def list_feedback(
    sort: Literal["votes", "new"] = "votes",
    kind: Literal["feature", "bug", "general"] | None = None,
    limit: int = Query(default=100, ge=1, le=200),
    viewer: User | None = Depends(optional_user),
    db: Session = Depends(get_db),
):
    stmt = select(FeedbackPost).options(joinedload(FeedbackPost.author))
    if kind:
        stmt = stmt.where(FeedbackPost.kind == kind)
    stmt = stmt.order_by(*( (FeedbackPost.votes.desc(), FeedbackPost.created_at.desc()) if sort == "votes"
                            else (FeedbackPost.created_at.desc(),) )).limit(limit)
    posts = db.scalars(stmt).all()
    voted: set[int] = set()
    if viewer and posts:
        voted = set(db.scalars(select(FeedbackVote.post_id).where(
            FeedbackVote.user_id == viewer.id, FeedbackVote.post_id.in_([p.id for p in posts]))).all())
    return [_out(p, voted, viewer) for p in posts]


@router.post("/feedback", response_model=FeedbackOut, status_code=201, dependencies=[Depends(rate_limit("feedback", 10))])
def create_feedback(body: FeedbackIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    post = FeedbackPost(user_id=user.id, kind=body.kind, title=body.title.strip(), body=body.body.strip(), votes=1)
    db.add(post)
    db.flush()
    db.add(FeedbackVote(post_id=post.id, user_id=user.id))  # authors back their own idea
    db.commit()
    post.author = user
    return _out(post, {post.id}, user)


@router.post("/feedback/{post_id}/vote", response_model=FeedbackOut)
def toggle_vote(post_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    post = db.scalar(select(FeedbackPost).options(joinedload(FeedbackPost.author)).where(FeedbackPost.id == post_id))
    if not post:
        raise not_found("feedback_not_found", "Post not found.")
    vote = db.scalar(select(FeedbackVote).where(FeedbackVote.post_id == post_id, FeedbackVote.user_id == user.id))
    if vote:
        db.delete(vote)
        post.votes = max(0, post.votes - 1)
        voted: set[int] = set()
    else:
        db.add(FeedbackVote(post_id=post_id, user_id=user.id))
        post.votes += 1
        voted = {post_id}
    db.commit()
    return _out(post, voted, user)


@router.post("/contact", response_model=OkOut, dependencies=[Depends(rate_limit("contact", 5, 300))])
def contact(body: ContactIn, db: Session = Depends(get_db)):
    db.add(ContactMessage(name=body.name.strip(), email=body.email.lower(), message=body.message.strip()))
    db.commit()
    return OkOut()


@router.post("/waitlist", response_model=OkOut, dependencies=[Depends(rate_limit("waitlist", 8, 300))])
def waitlist(body: WaitlistIn, db: Session = Depends(get_db)):
    try:
        db.add(WaitlistEntry(email=body.email.lower(), feature=body.feature, locale=body.locale))
        db.commit()
    except IntegrityError:  # already on the list — same friendly answer, no information leak
        db.rollback()
    return OkOut()
