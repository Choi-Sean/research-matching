from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select, true
from sqlalchemy.orm import Session, joinedload, selectinload

from app.db import get_db
from app.errors import conflict, not_found
from app.models import Application, Lab, Position, User
from app.schemas.core import ApplicantOut, MyPositionOut, PositionIn, PositionOut
from app.security import optional_user, require_role

router = APIRouter(prefix="/positions", tags=["positions"])

_with_lab = joinedload(Position.lab).joinedload(Lab.owner)


def _owned(db: Session, user: User, position_id: int) -> Position:
    pos = db.scalar(
        select(Position).join(Lab).options(_with_lab).where(Position.id == position_id, Lab.owner_id == user.id)
    )
    if not pos:
        raise not_found("position_not_found", "Position not found.")
    return pos


@router.get("", response_model=list[PositionOut])
def search(
    q: str | None = Query(default=None, max_length=120),
    university: str | None = Query(default=None, max_length=120),
    department: str | None = Query(default=None, max_length=120),
    compensation: str | None = None,
    location_type: str | None = None,
    term: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Position)
        .join(Lab, Lab.id == Position.lab_id)
        .join(User, User.id == Lab.owner_id)
        .options(_with_lab)
        .where(Position.status == "open", User.verified == true())
        .order_by(Position.created_at.desc(), Position.id.desc())
    )
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                Position.title.ilike(like),
                Position.description.ilike(like),
                Position.keywords.ilike(like),
                Position.required_skills.ilike(like),
                Lab.keywords.ilike(like),
                Lab.name.ilike(like),
            )
        )
    if university:
        stmt = stmt.where(Lab.university.ilike(f"%{university}%"))
    if department:
        stmt = stmt.where(Lab.department.ilike(f"%{department}%"))
    if compensation:
        stmt = stmt.where(Position.compensation == compensation)
    if location_type:
        stmt = stmt.where(Position.location_type == location_type)
    if term:
        stmt = stmt.where(Position.term == term)
    return db.scalars(stmt.limit(limit).offset(offset)).all()


@router.get("/mine", response_model=list[MyPositionOut])
def mine(user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    return db.scalars(
        select(Position)
        .join(Lab)
        .options(_with_lab, selectinload(Position.applications))
        .where(Lab.owner_id == user.id)
        .order_by(Position.created_at.desc())
    ).all()


@router.post("", response_model=PositionOut, status_code=201)
def create(body: PositionIn, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    lab = db.scalar(select(Lab).options(joinedload(Lab.owner)).where(Lab.owner_id == user.id))
    if not lab:
        raise conflict("lab_required", "Create your lab first.")
    pos = Position(lab_id=lab.id, **body.model_dump())
    db.add(pos)
    db.commit()
    pos.lab = lab
    return pos


@router.get("/{position_id}", response_model=PositionOut)
def get(position_id: int, viewer: User | None = Depends(optional_user), db: Session = Depends(get_db)):
    pos = db.scalar(select(Position).options(_with_lab).where(Position.id == position_id))
    if not pos:
        raise not_found("position_not_found", "Position not found.")
    owner = pos.lab.owner
    if not owner.verified and not (viewer and (viewer.id == owner.id or viewer.is_admin)):
        raise not_found("position_not_found", "Position not found.")
    return pos


@router.put("/{position_id}", response_model=PositionOut)
def update(
    position_id: int, body: PositionIn, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)
):
    pos = _owned(db, user, position_id)
    for k, v in body.model_dump().items():
        setattr(pos, k, v)
    db.commit()
    return pos


@router.post("/{position_id}/close", response_model=PositionOut)
def close(position_id: int, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    pos = _owned(db, user, position_id)
    pos.status = "closed"
    db.commit()
    return pos


@router.post("/{position_id}/reopen", response_model=PositionOut)
def reopen(position_id: int, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    pos = _owned(db, user, position_id)
    pos.status = "open"
    db.commit()
    return pos


@router.delete("/{position_id}", status_code=204)
def delete(position_id: int, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    pos = _owned(db, user, position_id)
    if db.scalar(select(Application.id).where(Application.position_id == pos.id).limit(1)):
        raise conflict("position_has_applications", "Close this position instead — it already has applicants.")
    from app.models import Invitation

    for inv in db.scalars(select(Invitation).where(Invitation.position_id == pos.id)).all():
        db.delete(inv)
    db.delete(pos)
    db.commit()


@router.get("/{position_id}/applicants", response_model=list[ApplicantOut])
def applicants(position_id: int, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    _owned(db, user, position_id)
    return db.scalars(
        select(Application)
        .options(joinedload(Application.student), joinedload(Application.profile))
        .where(Application.position_id == position_id)
        .order_by(Application.created_at)
    ).all()
