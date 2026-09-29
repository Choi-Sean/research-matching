"""Professor discovery: search, profile, plain-English summary, and contact tools."""
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, true
from sqlalchemy.orm import Session

from app.db import get_db
from app.errors import AppError, not_found, upstream
from app.models import Lab, SummaryUnlock, User
from app.ratelimit import rate_limit
from app.schemas.discover import (
    ContactOut,
    InstitutionOut,
    ProfessorCard,
    ProfessorDetail,
    ProfessorSearchOut,
    SummaryRequest,
    SummaryResponse,
)
from app.security import current_user
from app.services import emailfinder, summary as summary_service
from app.services.metrics import lab_response_days, responsiveness
from app.services.openalex import AUTHOR_ID_RE, INSTITUTION_ID_RE, OpenAlexError, openalex
from app.services.plans import ensure_quota, quota_info, record_use

router = APIRouter(prefix="/discover", tags=["discover"])
PAGE_SIZE = 12


def _upstream(exc: OpenAlexError) -> AppError:
    if str(exc) == "not_found":
        return not_found("professor_not_found", "We couldn't find that researcher.")
    return upstream("upstream_unavailable", "The scholarly database is busy — please try again in a moment.")


def _tag_platform_labs(db: Session, cards: list[ProfessorCard]) -> None:
    ids = [c.id for c in cards]
    if not ids:
        return
    rows = db.execute(
        select(Lab.id, Lab.openalex_author_id)
        .join(User, User.id == Lab.owner_id)
        .where(Lab.openalex_author_id.in_(ids), User.verified == true())
    ).all()
    by_author = {aid: lab_id for lab_id, aid in rows}
    for c in cards:
        c.on_platform_lab_id = by_author.get(c.id)


@router.get("/institutions", response_model=list[InstitutionOut], dependencies=[Depends(rate_limit("inst", 90))])
def institutions(q: str = Query(min_length=2, max_length=80)):
    try:
        return openalex.search_institutions(q)
    except OpenAlexError as exc:
        raise _upstream(exc)


@router.get("/professors", response_model=ProfessorSearchOut, dependencies=[Depends(rate_limit("search", 40))])
def search_professors(
    q: str = Query(min_length=2, max_length=120),
    mode: Literal["interest", "name"] = "interest",
    institution_id: str | None = Query(default=None, max_length=16),
    university: str | None = Query(default=None, max_length=120),
    sort: Literal["relevance", "cited", "recent"] = "relevance",
    min_h: int = Query(default=0, ge=0, le=200),
    page: int = Query(default=1, ge=1, le=20),
    db: Session = Depends(get_db),
):
    try:
        inst = None
        if institution_id and INSTITUTION_ID_RE.match(institution_id):
            inst = openalex.get_institution(institution_id)
        elif university and university.strip():
            inst = openalex.resolve_institution(university)
        inst_id = inst.id if inst else None
        cards = (
            openalex.authors_for_topic(q, institution_id=inst_id)
            if mode == "interest"
            else openalex.authors_by_name(q, institution_id=inst_id)
        )
    except OpenAlexError as exc:
        raise _upstream(exc)

    if min_h:
        cards = [c for c in cards if c.h_index >= min_h]
    if sort == "cited":
        cards = sorted(cards, key=lambda c: -c.cited_by_count)
    elif sort == "recent":
        cards = sorted(cards, key=lambda c: (-c.recent_works, -c.h_index))
    total = len(cards)
    start = (page - 1) * PAGE_SIZE
    items = cards[start : start + PAGE_SIZE]
    _tag_platform_labs(db, items)
    return ProfessorSearchOut(
        items=items, total=total, page=page, page_size=PAGE_SIZE, has_more=start + PAGE_SIZE < total,
        institution=inst, query=q, mode=mode,
    )


@router.get("/professors/{author_id}", response_model=ProfessorDetail, dependencies=[Depends(rate_limit("prof", 60))])
def professor_detail(author_id: str, db: Session = Depends(get_db)):
    if not AUTHOR_ID_RE.match(author_id):
        raise not_found("professor_not_found", "We couldn't find that researcher.")
    try:
        detail = openalex.get_author(author_id)
    except OpenAlexError as exc:
        raise _upstream(exc)
    _tag_platform_labs(db, [detail])
    return detail


@router.post("/professors/{author_id}/summary", response_model=SummaryResponse)
def professor_summary(
    author_id: str,
    body: SummaryRequest,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if not AUTHOR_ID_RE.match(author_id):
        raise not_found("professor_not_found", "We couldn't find that researcher.")
    unlocked = db.scalar(
        select(SummaryUnlock).where(SummaryUnlock.user_id == user.id, SummaryUnlock.openalex_id == author_id)
    )
    if not unlocked:
        ensure_quota(db, user, "summary")
    try:
        detail = openalex.get_author(author_id)
    except OpenAlexError as exc:
        raise _upstream(exc)
    result = summary_service.get_or_create(db, detail, body.lang)
    if not unlocked:  # revisiting a professor you've already unlocked is free
        db.add(SummaryUnlock(user_id=user.id, openalex_id=author_id))
        record_use(db, user, "summary")
    return SummaryResponse(summary=result, quota=quota_info(db, user, "summary"))


@router.get("/professors/{author_id}/contact", response_model=ContactOut)
def professor_contact(author_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not AUTHOR_ID_RE.match(author_id):
        raise not_found("professor_not_found", "We couldn't find that researcher.")
    try:
        detail = openalex.get_author(author_id)
        domain, _ = openalex.institution_domain_for_author(author_id)
    except OpenAlexError as exc:
        raise _upstream(exc)

    lab = db.scalar(
        select(Lab).join(User, User.id == Lab.owner_id).where(Lab.openalex_author_id == author_id, User.verified == true())
    )
    all_candidates = emailfinder.candidates(detail.name, domain)
    common = dict(
        domain=domain,
        directory_search_url=emailfinder.directory_search_url(detail.name, domain),
        on_platform_lab_id=lab.id if lab else None,
    )
    if not user.is_pro:
        return ContactOut(locked=True, hidden_count=len(all_candidates), **common)
    return ContactOut(
        locked=False,
        candidates=all_candidates[:5],
        responsiveness=responsiveness(db, author_id),
        lab_response_days=lab_response_days(db, lab.id) if lab else None,
        **common,
    )
