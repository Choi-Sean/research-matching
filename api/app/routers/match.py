"""AI matching — in both directions."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.errors import AppError
from app.models import User
from app.ratelimit import rate_limit
from app.schemas.ai import (
    MatchPositionsIn,
    MatchPositionsOut,
    MatchProfessorsIn,
    MatchProfessorsOut,
    MatchStudentsIn,
    MatchStudentsOut,
    PersonaIn,
    PersonaOut,
)
from app.security import require_role, require_verified_professor
from app.services import match_service
from app.services.plans import ensure_quota, record_use, used_today
from app.models import UsageEvent

router = APIRouter(prefix="/match", tags=["match"])


@router.post("/student/positions", response_model=MatchPositionsOut, dependencies=[Depends(rate_limit("match", 20))])
def student_positions(
    body: MatchPositionsIn, user: User = Depends(require_role("student")), db: Session = Depends(get_db)
):
    ensure_quota(db, user, "match_positions")
    out = match_service.positions_for_student(db, user, body.lang, body.limit)
    out.quota = record_use(db, user, "match_positions")
    return out


@router.post("/student/professors", response_model=MatchProfessorsOut, dependencies=[Depends(rate_limit("match", 20))])
def student_professors(
    body: MatchProfessorsIn, user: User = Depends(require_role("student")), db: Session = Depends(get_db)
):
    ensure_quota(db, user, "match_professors")
    out = match_service.professors_for_student(db, user, body.lang, body.query, body.institution_id, body.limit)
    out.quota = record_use(db, user, "match_professors")
    return out


@router.post("/professor/persona", response_model=PersonaOut, dependencies=[Depends(rate_limit("persona", 15))])
def professor_persona(
    body: PersonaIn, user: User = Depends(require_verified_professor), db: Session = Depends(get_db)
):
    return match_service.build_persona(db, user, body.position_id, body.text, body.lang)


@router.post("/professor/students", response_model=MatchStudentsOut, dependencies=[Depends(rate_limit("talent", 20))])
def professor_students(
    body: MatchStudentsIn, user: User = Depends(require_verified_professor), db: Session = Depends(get_db)
):
    done = used_today(db, user.id, "talent_search")
    if done >= settings.talent_searches_per_day:
        raise AppError(429, "rate_limited", "Daily talent-search limit reached. Try again tomorrow.")
    out = match_service.students_for_persona(db, user, body.position_id, body.persona, body.lang, body.limit)
    db.add(UsageEvent(user_id=user.id, feature="talent_search"))
    db.commit()
    out.searches_left_today = max(0, settings.talent_searches_per_day - done - 1)
    return out
