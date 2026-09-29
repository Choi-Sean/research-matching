import os
import tempfile
from pathlib import Path

_TMP = Path(tempfile.mkdtemp()) / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP.as_posix()}"
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["ADMIN_EMAILS"] = "admin@uni.edu"
os.environ["AUTO_VERIFY_PROFESSORS"] = "true"
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["STRIPE_SECRET_KEY"] = ""
os.environ["ENVIRONMENT"] = "development"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.schemas.discover import (  # noqa: E402
    InstitutionMini,
    InstitutionOut,
    ProfessorCard,
    ProfessorDetail,
    TopicOut,
    WorkOut,
)
from app.services.openalex import openalex  # noqa: E402

PASSWORD = "password123"


@pytest.fixture()
def client():
    # The suite drops every table. Never let it near a real database (api/.env points at MSSQL).
    assert engine.dialect.name == "sqlite" and engine.url.database == _TMP.as_posix(), f"refusing to reset {engine.url!r}"
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with TestClient(app) as c:
        yield c


def signup(client: TestClient, email: str, role: str = "student", name: str | None = None, **extra) -> dict:
    r = client.post(
        "/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": name or email.split("@")[0].title(), "role": role, **extra},
    )
    assert r.status_code == 201, r.text
    tok = client.post("/auth/login", data={"username": email, "password": PASSWORD}).json()["access_token"]
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture()
def prof(client):
    return signup(client, "prof@mit.edu", "professor", "Prof. Ada Lovelace")


@pytest.fixture()
def student(client):
    return signup(client, "stu@mit.edu", "student", "Sam Student")


LAB = {"name": "Vision Lab", "university": "MIT", "department": "CS", "keywords": "computer vision,robotics",
       "bio": "We study perception.", "work_style": {"autonomy": 4, "collaboration": 4, "pace": 4, "structure": 2}}
POSITION = {
    "title": "Vision RA", "description": "Train self-supervised vision models and analyze failures.",
    "requirements": "Python and PyTorch", "required_skills": "python, pytorch, linear algebra",
    "keywords": "computer vision", "compensation": "paid", "hours_per_week": 10, "term": "fall", "slots": 2,
}


@pytest.fixture()
def lab_and_position(client, prof):
    lab = client.post("/labs", headers=prof, json=LAB)
    assert lab.status_code == 201, lab.text
    pos = client.post("/positions", headers=prof, json=POSITION)
    assert pos.status_code == 201, pos.text
    return lab.json(), pos.json()


# --------------------------------------------------------------------------- fake scholarly data

FAKE_CARDS = [
    ProfessorCard(id="A1001", name="Elena Rivera", institution=InstitutionMini(id="I100", name="Test University", country="US"),
                  h_index=40, works_count=120, cited_by_count=9000, works_in_topic=25, recent_works=30,
                  topics=["Computer Vision", "Deep Learning"], orcid="https://orcid.org/0000-0000-0000-0001"),
    ProfessorCard(id="A1002", name="Kenji Tanaka", institution=InstitutionMini(id="I100", name="Test University", country="US"),
                  h_index=22, works_count=60, cited_by_count=2500, works_in_topic=12, recent_works=14,
                  topics=["Robotics", "Reinforcement Learning"]),
]


def fake_detail(author_id: str = "A1001") -> ProfessorDetail:
    card = next((c for c in FAKE_CARDS if c.id == author_id), FAKE_CARDS[0])
    return ProfessorDetail(
        **card.model_dump(),
        topics_detail=[TopicOut(name=t, count=10, field="Computer Science") for t in card.topics],
        recent_works_list=[
            WorkOut(id="W1", title="Self-supervised depth estimation from monocular video", year=2025, cited_by=40,
                    venue="CVPR", abstract="We propose a method for depth estimation from video without labels. "
                    "It improves accuracy by 12% over prior work. Code is released."),
        ],
        top_works=[WorkOut(id="W2", title="Learning visual representations", year=2019, cited_by=2100, venue="ICML")],
        openalex_url=f"https://openalex.org/{author_id}",
    )


@pytest.fixture(autouse=True)
def fake_openalex(monkeypatch):
    inst = InstitutionOut(id="I100", name="Test University", country="US", type="education",
                          homepage="https://www.testu.edu", domain="testu.edu")
    monkeypatch.setattr(openalex, "search_institutions", lambda q, limit=8: [inst])
    monkeypatch.setattr(openalex, "get_institution", lambda i: inst)
    monkeypatch.setattr(openalex, "resolve_institution", lambda t: inst)
    monkeypatch.setattr(openalex, "authors_for_topic", lambda q, institution_id=None, **kw: [c.model_copy() for c in FAKE_CARDS])
    monkeypatch.setattr(openalex, "authors_by_name", lambda n, institution_id=None, limit=25: [FAKE_CARDS[0].model_copy()])
    monkeypatch.setattr(openalex, "get_author", lambda aid: fake_detail(aid))
    monkeypatch.setattr(openalex, "institution_domain_for_author", lambda aid: ("testu.edu", "Test University"))
    monkeypatch.setattr(openalex, "platform_stats", lambda: {"works": 326_000_000, "institutions": 140_000, "authors": 99_000_000})
