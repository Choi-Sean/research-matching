from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.errors import conflict, not_found
from app.models import Application, Lab, Position, StudentProfile, User
from app.schemas.ai import ProfileStrength
from app.schemas.core import (
    ApplicationIn,
    ApplicationOut,
    MyApplicationOut,
    StatusIn,
    StudentProfileIn,
    StudentProfileOut,
    clean_style,
)
from app.security import require_role
from app.services import matching

router = APIRouter(tags=["students"])


def _profile(db: Session, user: User) -> StudentProfile:
    prof = db.get(StudentProfile, user.id)
    if not prof:
        prof = StudentProfile(user_id=user.id)
        db.add(prof)
        db.flush()
    return prof


@router.get("/students/me", response_model=StudentProfileOut)
def get_profile(user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    prof = _profile(db, user)
    db.commit()
    return prof


@router.put("/students/me", response_model=StudentProfileOut)
def update_profile(
    body: StudentProfileIn, user: User = Depends(require_role("student")), db: Session = Depends(get_db)
):
    prof = _profile(db, user)
    data = body.model_dump()
    data["work_style"] = clean_style(data.get("work_style"))
    for k, v in data.items():
        setattr(prof, k, v)
    db.commit()
    return prof


@router.get("/students/me/strength", response_model=ProfileStrength)
def strength(user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    return matching.profile_strength(_profile(db, user))


@router.post("/positions/{position_id}/apply", response_model=ApplicationOut, status_code=201)
def apply(
    position_id: int,
    body: ApplicationIn,
    user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    pos = db.scalar(
        select(Position).options(joinedload(Position.lab).joinedload(Lab.owner)).where(Position.id == position_id)
    )
    if not pos or pos.status != "open" or not pos.lab.owner.verified:
        raise not_found("position_not_open", "This position isn't open.")
    if db.scalar(select(Application).where(Application.position_id == position_id, Application.student_id == user.id)):
        raise conflict("already_applied", "You've already applied to this position.")
    application = Application(position_id=position_id, student_id=user.id, message=body.message)
    db.add(application)
    db.commit()
    return application


@router.get("/applications/mine", response_model=list[MyApplicationOut])
def my_applications(user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    return db.scalars(
        select(Application)
        .options(joinedload(Application.position).joinedload(Position.lab).joinedload(Lab.owner))
        .where(Application.student_id == user.id)
        .order_by(Application.created_at.desc())
    ).all()


@router.post("/applications/{application_id}/withdraw", response_model=ApplicationOut)
def withdraw(application_id: int, user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    a = db.get(Application, application_id)
    if not a or a.student_id != user.id:
        raise not_found("application_not_found", "Application not found.")
    a.status = "withdrawn"
    db.commit()
    return a


@router.put("/applications/{application_id}/status", response_model=ApplicationOut)
def decide(
    application_id: int, body: StatusIn, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)
):
    a = db.scalar(
        select(Application)
        .join(Position, Position.id == Application.position_id)
        .join(Lab, Lab.id == Position.lab_id)
        .where(Application.id == application_id, Lab.owner_id == user.id)
    )
    if not a:
        raise not_found("application_not_found", "Application not found.")
    a.status = body.status
    if a.decided_at is None:
        a.decided_at = datetime.now(timezone.utc)
    db.commit()
    return a
