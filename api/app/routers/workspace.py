"""A student's personal workspace: saved items and the outreach tracker."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.errors import not_found
from app.models import Bookmark, OutreachEntry, User
from app.schemas.misc import BookmarkIn, BookmarkOut, OkOut, OutreachIn, OutreachOut, OutreachPatch
from app.security import current_user
from app.services.followup import next_weekday

router = APIRouter(tags=["workspace"])


# --------------------------------------------------------------------------- bookmarks


@router.get("/bookmarks", response_model=list[BookmarkOut])
def list_bookmarks(kind: str | None = None, user: User = Depends(current_user), db: Session = Depends(get_db)):
    stmt = select(Bookmark).where(Bookmark.user_id == user.id).order_by(Bookmark.created_at.desc())
    if kind:
        stmt = stmt.where(Bookmark.kind == kind)
    return db.scalars(stmt).all()


@router.post("/bookmarks", response_model=BookmarkOut, status_code=201)
def add_bookmark(body: BookmarkIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    existing = db.scalar(
        select(Bookmark).where(Bookmark.user_id == user.id, Bookmark.kind == body.kind, Bookmark.ref == body.ref)
    )
    if existing:
        return existing
    b = Bookmark(user_id=user.id, kind=body.kind, ref=body.ref, snapshot=body.snapshot)
    db.add(b)
    db.commit()
    return b


@router.delete("/bookmarks/{kind}/{ref}", response_model=OkOut)
def remove_bookmark(kind: str, ref: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    b = db.scalar(select(Bookmark).where(Bookmark.user_id == user.id, Bookmark.kind == kind, Bookmark.ref == ref))
    if b:
        db.delete(b)
        db.commit()
    return OkOut()


# --------------------------------------------------------------------------- outreach tracker


def _defaults(entry: OutreachEntry) -> None:
    """Keep dates sensible when the status moves forward."""
    today = date.today()
    if entry.status in ("sent", "replied", "meeting", "positive", "no_reply", "declined") and not entry.sent_on:
        entry.sent_on = today
    if entry.status in ("replied", "meeting", "positive", "declined") and not entry.replied_on:
        entry.replied_on = today
    if entry.status == "sent" and not entry.follow_up_on and entry.sent_on:
        entry.follow_up_on = next_weekday(entry.sent_on + timedelta(days=7))
    if entry.status in ("replied", "meeting", "positive", "declined", "no_reply"):
        entry.follow_up_on = None


@router.get("/outreach", response_model=list[OutreachOut])
def list_outreach(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(OutreachEntry).where(OutreachEntry.user_id == user.id).order_by(OutreachEntry.updated_at.desc())
    ).all()


@router.post("/outreach", response_model=OutreachOut, status_code=201)
def upsert_outreach(body: OutreachIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    entry = db.scalar(
        select(OutreachEntry).where(OutreachEntry.user_id == user.id, OutreachEntry.openalex_id == body.openalex_id)
    )
    if entry:
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(entry, k, v)
    else:
        entry = OutreachEntry(user_id=user.id, **body.model_dump())
        db.add(entry)
    _defaults(entry)
    db.commit()
    return entry


@router.patch("/outreach/{entry_id}", response_model=OutreachOut)
def patch_outreach(
    entry_id: int, body: OutreachPatch, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    entry = db.get(OutreachEntry, entry_id)
    if not entry or entry.user_id != user.id:
        raise not_found("outreach_not_found", "Entry not found.")
    data = body.model_dump(exclude_unset=True)
    if data.pop("clear_dates", False):
        entry.sent_on = entry.replied_on = entry.follow_up_on = None
    for k, v in data.items():
        setattr(entry, k, v)
    _defaults(entry)
    db.commit()
    return entry


@router.delete("/outreach/{entry_id}", response_model=OkOut)
def delete_outreach(entry_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    entry = db.get(OutreachEntry, entry_id)
    if not entry or entry.user_id != user.id:
        raise not_found("outreach_not_found", "Entry not found.")
    db.delete(entry)
    db.commit()
    return OkOut()
