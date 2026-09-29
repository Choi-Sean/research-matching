"""A verified professor invites a discoverable student to apply; the student accepts or declines."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.errors import conflict, forbidden, not_found
from app.models import Application, Invitation, Lab, Position, StudentProfile, User
from app.schemas.core import ApplicationOut
from app.schemas.misc import InvitationIn, InvitationOut, InvitationRespondIn
from app.security import require_role, require_verified_professor

router = APIRouter(prefix="/invitations", tags=["invitations"])

_load = (
    joinedload(Invitation.position).joinedload(Position.lab).joinedload(Lab.owner),
    joinedload(Invitation.professor),
    joinedload(Invitation.student),
)


@router.post("", response_model=InvitationOut, status_code=201)
def invite(body: InvitationIn, user: User = Depends(require_verified_professor), db: Session = Depends(get_db)):
    pos = db.scalar(
        select(Position).join(Lab, Lab.id == Position.lab_id).where(Position.id == body.position_id, Lab.owner_id == user.id)
    )
    if not pos or pos.status != "open":
        raise not_found("position_not_open", "Choose one of your open positions.")
    student = db.get(User, body.student_id)
    profile = db.get(StudentProfile, body.student_id)
    if not student or student.role != "student" or not profile or not profile.discoverable:
        raise forbidden("student_not_discoverable", "This student isn't accepting invitations.")
    if db.scalar(select(Application.id).where(Application.position_id == pos.id, Application.student_id == student.id)):
        raise conflict("already_applied", "This student has already applied.")
    if db.scalar(select(Invitation.id).where(Invitation.position_id == pos.id, Invitation.student_id == student.id)):
        raise conflict("already_invited", "You've already invited this student to this position.")
    inv = Invitation(position_id=pos.id, professor_id=user.id, student_id=student.id, message=body.message,
                     match_score=body.match_score)
    db.add(inv)
    db.commit()
    return db.scalar(select(Invitation).options(*_load).where(Invitation.id == inv.id))


@router.get("/sent", response_model=list[InvitationOut])
def sent(user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    return db.scalars(
        select(Invitation).options(*_load).where(Invitation.professor_id == user.id).order_by(Invitation.created_at.desc())
    ).all()


@router.get("/mine", response_model=list[InvitationOut])
def mine(user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    return db.scalars(
        select(Invitation).options(*_load).where(Invitation.student_id == user.id).order_by(Invitation.created_at.desc())
    ).all()


@router.post("/{invitation_id}/respond", response_model=InvitationOut)
def respond(
    invitation_id: int,
    body: InvitationRespondIn,
    user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    inv = db.scalar(select(Invitation).options(*_load).where(Invitation.id == invitation_id, Invitation.student_id == user.id))
    if not inv:
        raise not_found("invitation_not_found", "Invitation not found.")
    if inv.status != "pending":
        raise conflict("invitation_closed", "This invitation is no longer open.")
    inv.responded_at = datetime.now(timezone.utc)
    if body.action == "decline":
        inv.status = "declined"
    else:
        inv.status = "accepted"
        if inv.position.status == "open" and not db.scalar(
            select(Application.id).where(Application.position_id == inv.position_id, Application.student_id == user.id)
        ):
            db.add(
                Application(position_id=inv.position_id, student_id=user.id, invited=True,
                            message=(body.message or "").strip() or "I'd love to take you up on your invitation.")
            )
    db.commit()
    return inv


@router.post("/{invitation_id}/withdraw", response_model=InvitationOut)
def withdraw(invitation_id: int, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    inv = db.scalar(select(Invitation).options(*_load).where(Invitation.id == invitation_id, Invitation.professor_id == user.id))
    if not inv:
        raise not_found("invitation_not_found", "Invitation not found.")
    if inv.status != "pending":
        raise conflict("invitation_closed", "This invitation is no longer open.")
    inv.status = "withdrawn"
    db.commit()
    return inv
