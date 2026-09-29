from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.errors import conflict, not_found
from app.models import Lab, Material, Position, User
from app.schemas.core import LabIn, LabOut, MaterialIn, MaterialOut, PositionOut, clean_style
from app.security import optional_user, require_role

router = APIRouter(prefix="/labs", tags=["labs"])


def _my_lab(db: Session, user: User) -> Lab:
    lab = db.scalar(select(Lab).options(joinedload(Lab.owner)).where(Lab.owner_id == user.id))
    if not lab:
        raise not_found("lab_required", "Create your lab first.")
    return lab


def visible_lab(db: Session, lab_id: int, viewer: User | None) -> Lab:
    """Labs of unverified professors stay private until an admin verifies them."""
    lab = db.scalar(select(Lab).options(joinedload(Lab.owner)).where(Lab.id == lab_id))
    if not lab:
        raise not_found("lab_not_found", "Lab not found.")
    if not lab.owner.verified and not (viewer and (viewer.id == lab.owner_id or viewer.is_admin)):
        raise not_found("lab_not_found", "Lab not found.")
    return lab


def _apply(lab: Lab, body: LabIn) -> None:
    data = body.model_dump()
    data["work_style"] = clean_style(data.get("work_style"))
    for k, v in data.items():
        setattr(lab, k, v)


@router.post("", response_model=LabOut, status_code=201)
def create_lab(body: LabIn, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    if db.scalar(select(Lab).where(Lab.owner_id == user.id)):
        raise conflict("lab_exists", "You already have a lab.")
    lab = Lab(owner_id=user.id)
    _apply(lab, body)
    db.add(lab)
    db.commit()
    lab.owner = user
    return lab


@router.get("/mine", response_model=LabOut)
def my_lab(user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    return _my_lab(db, user)


@router.put("/mine", response_model=LabOut)
def update_lab(body: LabIn, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    lab = _my_lab(db, user)
    _apply(lab, body)
    db.commit()
    return lab


@router.post("/mine/materials", response_model=MaterialOut, status_code=201)
def add_material(body: MaterialIn, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    m = Material(lab_id=_my_lab(db, user).id, **body.model_dump())
    db.add(m)
    db.commit()
    return m


@router.delete("/mine/materials/{material_id}", status_code=204)
def delete_material(material_id: int, user: User = Depends(require_role("professor")), db: Session = Depends(get_db)):
    m = db.get(Material, material_id)
    if not m or m.lab_id != _my_lab(db, user).id:
        raise not_found("material_not_found", "Material not found.")
    db.delete(m)
    db.commit()


@router.get("/{lab_id}", response_model=LabOut)
def get_lab(lab_id: int, viewer: User | None = Depends(optional_user), db: Session = Depends(get_db)):
    return visible_lab(db, lab_id, viewer)


@router.get("/{lab_id}/materials", response_model=list[MaterialOut])
def list_materials(lab_id: int, viewer: User | None = Depends(optional_user), db: Session = Depends(get_db)):
    visible_lab(db, lab_id, viewer)
    return db.scalars(select(Material).where(Material.lab_id == lab_id).order_by(Material.created_at.desc())).all()


@router.get("/{lab_id}/positions", response_model=list[PositionOut])
def list_positions(lab_id: int, viewer: User | None = Depends(optional_user), db: Session = Depends(get_db)):
    visible_lab(db, lab_id, viewer)
    return db.scalars(
        select(Position)
        .options(joinedload(Position.lab).joinedload(Lab.owner))
        .where(Position.lab_id == lab_id, Position.status == "open")
        .order_by(Position.created_at.desc())
    ).all()
