"""Small back-office for the site owner (accounts listed in ADMIN_EMAILS)."""
from fastapi import APIRouter, Depends
from sqlalchemy import false, func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.errors import not_found
from app.models import (
    Application,
    ContactMessage,
    FeedbackPost,
    Invitation,
    Lab,
    Position,
    User,
    WaitlistEntry,
)
from app.schemas.misc import (
    AdminOverview,
    AdminProfessorOut,
    ContactOutRow,
    FeedbackOut,
    FeedbackStatusIn,
    VerifyIn,
    WaitlistOut,
)
from app.security import require_admin

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/overview", response_model=AdminOverview)
def overview(db: Session = Depends(get_db)):
    def n(model, *cond):
        stmt = select(func.count()).select_from(model)
        if cond:
            stmt = stmt.where(*cond)
        return db.scalar(stmt) or 0

    paid = db.scalar(select(func.count()).select_from(User).where(User.plan != "free")) or 0
    return AdminOverview(
        users=n(User), students=n(User, User.role == "student"), professors=n(User, User.role == "professor"),
        pending_professors=n(User, User.role == "professor", User.verified == false()),
        labs=n(Lab), open_positions=n(Position, Position.status == "open"), applications=n(Application),
        invitations=n(Invitation), feedback=n(FeedbackPost), waitlist=n(WaitlistEntry), paid_users=paid,
    )


@router.get("/professors", response_model=list[AdminProfessorOut])
def professors(pending: bool = False, db: Session = Depends(get_db)):
    stmt = (
        select(User, Lab)
        .outerjoin(Lab, Lab.owner_id == User.id)
        .where(User.role == "professor")
        .order_by(User.created_at.desc())
    )
    if pending:
        stmt = stmt.where(User.verified == false())
    return [
        AdminProfessorOut(id=u.id, full_name=u.full_name, email=u.email, verified=u.verified, created_at=u.created_at,
                          lab_name=lab.name if lab else None, university=lab.university if lab else None,
                          website=lab.website if lab else None)
        for u, lab in db.execute(stmt).all()
    ]


@router.post("/professors/{user_id}/verify", response_model=AdminProfessorOut)
def verify(user_id: int, body: VerifyIn, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user or user.role != "professor":
        raise not_found("user_not_found", "Professor not found.")
    user.verified = body.verified
    db.commit()
    lab = db.scalar(select(Lab).where(Lab.owner_id == user.id))
    return AdminProfessorOut(id=user.id, full_name=user.full_name, email=user.email, verified=user.verified,
                             created_at=user.created_at, lab_name=lab.name if lab else None,
                             university=lab.university if lab else None, website=lab.website if lab else None)


@router.patch("/feedback/{post_id}", response_model=FeedbackOut)
def set_feedback_status(post_id: int, body: FeedbackStatusIn, db: Session = Depends(get_db)):
    post = db.get(FeedbackPost, post_id)
    if not post:
        raise not_found("feedback_not_found", "Post not found.")
    post.status = body.status
    db.commit()
    return FeedbackOut(id=post.id, kind=post.kind, title=post.title, body=post.body, votes=post.votes,
                       status=post.status, created_at=post.created_at, author_name="")


@router.get("/waitlist", response_model=list[WaitlistOut])
def waitlist(db: Session = Depends(get_db)):
    rows = db.scalars(select(WaitlistEntry).order_by(WaitlistEntry.created_at.desc()).limit(500)).all()
    return [WaitlistOut(id=r.id, email=r.email, feature=r.feature, locale=r.locale, created_at=r.created_at) for r in rows]


@router.get("/contact", response_model=list[ContactOutRow])
def contact_messages(db: Session = Depends(get_db)):
    rows = db.scalars(select(ContactMessage).order_by(ContactMessage.created_at.desc()).limit(200)).all()
    return [ContactOutRow(id=r.id, name=r.name, email=r.email, message=r.message, created_at=r.created_at) for r in rows]
