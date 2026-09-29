from fastapi import APIRouter, Depends
from sqlalchemy import distinct, func, select, true
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Lab, Position, User
from app.services.llm import llm
from app.services.openalex import openalex

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/meta/stats")
def stats(db: Session = Depends(get_db)):
    """Live numbers for the marketing site: real platform counts plus the size of the scholarly index."""
    open_positions = (
        db.scalar(
            select(func.count())
            .select_from(Position)
            .join(Lab, Lab.id == Position.lab_id)
            .join(User, User.id == Lab.owner_id)
            .where(Position.status == "open", User.verified == true())
        )
        or 0
    )
    labs = db.scalar(select(func.count()).select_from(Lab).join(User, User.id == Lab.owner_id).where(User.verified == true())) or 0
    universities = (
        db.scalar(select(func.count(distinct(Lab.university))).join(User, User.id == Lab.owner_id).where(User.verified == true()))
        or 0
    )
    scholarly = openalex.platform_stats()
    return {
        "open_positions": open_positions,
        "labs": labs,
        "universities": universities,
        "works_indexed": scholarly["works"],
        "institutions_indexed": scholarly["institutions"],
        "researchers_indexed": scholarly["authors"],
        "ai_enabled": llm.enabled,
    }
