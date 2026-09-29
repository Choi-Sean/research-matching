"""Matching in both directions, invitations, billing, community and the AI (mocked) paths."""
from app.schemas.ai import Persona
from app.schemas.core import WorkStyle
from app.services import ai_tasks, llm as llm_module
from app.services.text import shared_terms, skills_overlap, split_list, tokens
from tests.conftest import LAB, POSITION, signup


def make_student(client, email, name, profile, discoverable=True):
    h = signup(client, email, "student", name)
    r = client.put("/students/me", headers=h, json={**profile, "discoverable": discoverable})
    assert r.status_code == 200, r.text
    return h, client.get("/auth/me", headers=h).json()["id"]


VISION = {"major": "Computer Science", "skills": "Python, PyTorch, C++", "interests": "computer vision, robotics",
          "experience": "Built an object detector for a robotics club using PyTorch and 4k labelled images.",
          "availability_hours": 10, "work_style": {"autonomy": 4, "collaboration": 4, "pace": 4, "structure": 2}}
BIO = {"major": "Biology", "skills": "R, wet lab, statistics", "interests": "genomics, cell fate",
       "experience": "Two lab rotations in cell culture and qPCR.", "availability_hours": 6,
       "work_style": {"autonomy": 1, "collaboration": 1, "pace": 1, "structure": 5}}


# --------------------------------------------------------------------------- text helpers


def test_text_helpers():
    assert split_list("Python, ML; PyTorch / NLP") == ["python", "machine learning", "pytorch", "natural language processing"]
    assert "computer_vision" in tokens("I like Computer Vision")
    assert "computer vision" in shared_terms(tokens("computer vision for robots"), tokens("a computer vision lab"))
    covered, missing = skills_overlap(["python", "linear algebra"], ["python programming"])
    assert covered == ["python"] and missing == ["linear algebra"]
    assert tokens("컴퓨터 비전") and any(len(t) == 2 for t in tokens("컴퓨터 비전"))  # CJK bigrams


# --------------------------------------------------------------------------- student → positions


def test_student_positions_ranked_and_explained(client, prof, lab_and_position):
    # a second, unrelated position
    client.post("/positions", headers=prof, json={**POSITION, "title": "Wet-lab genomics assistant",
                "description": "Culture cells and run qPCR.", "required_skills": "wet lab, qpcr",
                "keywords": "genomics", "hours_per_week": 8})
    h, _ = make_student(client, "v@mit.edu", "Vee", VISION)
    r = client.post("/match/student/positions", headers=h, json={"lang": "en", "limit": 5})
    assert r.status_code == 200, r.text
    out = r.json()
    assert out["ai_used"] is False and out["items"][0]["position"]["title"] == "Vision RA"
    top, second = out["items"][0], out["items"][1]
    assert top["score"] > second["score"] and top["score"] >= 60
    codes = {x["code"] for x in top["reasons"]}
    assert {"shared_topics", "skills_covered", "style_aligned", "hours_fit"} <= codes
    assert any(g["code"] == "missing_skills" and "linear algebra" in g["items"] for g in top["gaps"])
    assert out["strength"]["score"] >= 70
    assert out["quota"]["used"] == 1 and out["quota"]["limit"] == 3


def test_student_positions_quota(client, lab_and_position):
    h, _ = make_student(client, "q@mit.edu", "Quota", VISION)
    for _ in range(3):
        assert client.post("/match/student/positions", headers=h, json={}).status_code == 200
    blocked = client.post("/match/student/positions", headers=h, json={})
    assert blocked.status_code == 402 and blocked.json()["detail"]["feature"] == "match_positions"


def test_student_to_professors_uses_interests(client):
    h, _ = make_student(client, "p@mit.edu", "Pat", VISION)
    r = client.post("/match/student/professors", headers=h, json={"lang": "en", "limit": 5})
    assert r.status_code == 200, r.text
    out = r.json()
    assert "computer vision" in out["keywords_used"] and out["ai_used"] is False
    assert out["items"][0]["professor"]["name"] == "Elena Rivera"
    assert out["items"][0]["reasons"][0]["code"] == "published_on_topics"


# --------------------------------------------------------------------------- professor → students


def test_professor_talent_search_and_invitation(client, prof, lab_and_position):
    _, pos = lab_and_position
    hv, vid = make_student(client, "v@mit.edu", "Vee", VISION)
    make_student(client, "b@mit.edu", "Bio", BIO)
    make_student(client, "hidden@mit.edu", "Hidden", VISION, discoverable=False)

    persona = client.post("/match/professor/persona", headers=prof, json={"position_id": pos["id"], "lang": "en"}).json()
    assert persona["ai_used"] is False
    assert "python" in persona["persona"]["must_have"] and persona["persona"]["work_style"]["autonomy"] == 4

    r = client.post("/match/professor/students", headers=prof, json={"position_id": pos["id"], "persona": persona["persona"], "limit": 5})
    assert r.status_code == 200, r.text
    out = r.json()
    assert out["pool_size"] == 2  # the non-discoverable student is never shown
    names = [c["full_name"] for c in out["items"]]
    assert names[0] == "Vee" and "Hidden" not in names
    assert out["items"][0]["score"] > out["items"][1]["score"]
    assert "email" not in out["items"][0]  # contact only through an invitation

    inv = client.post("/invitations", headers=prof, json={"student_id": vid, "position_id": pos["id"], "message": "Your detector project is a great fit. Interested?", "match_score": out["items"][0]["score"]})
    assert inv.status_code == 201, inv.text
    dup = client.post("/invitations", headers=prof, json={"student_id": vid, "position_id": pos["id"], "message": "again"})
    assert dup.status_code == 409 and dup.json()["detail"]["code"] == "already_invited"
    assert client.post("/invitations", headers=prof, json={"student_id": vid + 999, "position_id": pos["id"], "message": "x"}).status_code == 403

    mine = client.get("/invitations/mine", headers=hv).json()
    assert len(mine) == 1 and mine[0]["status"] == "pending" and mine[0]["professor"]["full_name"] == "Prof. Ada Lovelace"
    accepted = client.post(f"/invitations/{mine[0]['id']}/respond", headers=hv, json={"action": "accept", "message": "Yes please!"})
    assert accepted.json()["status"] == "accepted"
    apps = client.get(f"/positions/{pos['id']}/applicants", headers=prof).json()
    assert apps[0]["invited"] is True and apps[0]["message"] == "Yes please!"
    assert client.post(f"/invitations/{mine[0]['id']}/respond", headers=hv, json={"action": "decline"}).status_code == 409
    # applicants no longer appear in the talent pool for that position
    again = client.post("/match/professor/students", headers=prof, json={"position_id": pos["id"], "persona": persona["persona"]}).json()
    assert "Vee" not in [c["full_name"] for c in again["items"]]


def test_talent_search_requires_verified_professor(client, student, monkeypatch):
    from app.config import settings

    assert client.post("/match/professor/students", headers=student, json={"persona": {}}).status_code == 403
    monkeypatch.setattr(settings, "auto_verify_professors", False)
    p = signup(client, "unv@mit.edu", "professor", "Unverified")
    r = client.post("/match/professor/students", headers=p, json={"persona": {}})
    assert r.status_code == 403 and r.json()["detail"]["code"] == "professor_unverified"


def test_decline_and_withdraw_invitation(client, prof, lab_and_position):
    _, pos = lab_and_position
    hv, vid = make_student(client, "v@mit.edu", "Vee", VISION)
    inv = client.post("/invitations", headers=prof, json={"student_id": vid, "position_id": pos["id"], "message": "hello"}).json()
    assert client.post(f"/invitations/{inv['id']}/respond", headers=hv, json={"action": "decline"}).json()["status"] == "declined"
    assert client.get(f"/positions/{pos['id']}/applicants", headers=prof).json() == []


# --------------------------------------------------------------------------- AI path (mocked model)


def test_ai_rerank_blends_and_replaces_reasons(client, prof, lab_and_position, monkeypatch):
    _, pos = lab_and_position
    h, _ = make_student(client, "v@mit.edu", "Vee", VISION)

    monkeypatch.setattr(llm_module.llm, "structured", lambda **kw: ai_tasks.RankOut(items=[
        ai_tasks.RankedItem(id=f"p{pos['id']}", score=100, reasons=["Your detector project maps to their vision work."],
                            gaps=["No linear algebra listed."], tip="Mention the 4k-image dataset.")]))
    monkeypatch.setattr(type(llm_module.llm), "enabled", property(lambda self: True))
    out = client.post("/match/student/positions", headers=h, json={"lang": "en"}).json()
    item = out["items"][0]
    assert out["ai_used"] is True and item["reasons"][0] == {"code": "ai", "items": [], "text": "Your detector project maps to their vision work."}
    assert item["tip"] == "Mention the 4k-image dataset."
    rule = item["breakdown"]["topic"]
    assert item["score"] > 60 and rule >= 0


def test_ai_failure_falls_back_to_rules(client, lab_and_position, monkeypatch):
    h, _ = make_student(client, "v@mit.edu", "Vee", VISION)
    monkeypatch.setattr(type(llm_module.llm), "enabled", property(lambda self: True))
    monkeypatch.setattr(llm_module.llm, "structured", lambda **kw: None)  # model refused / errored
    out = client.post("/match/student/positions", headers=h, json={}).json()
    assert out["ai_used"] is False and out["items"][0]["reasons"][0]["code"] != "ai"


def test_ai_persona_and_email_review(client, prof, lab_and_position, monkeypatch):
    _, pos = lab_and_position
    monkeypatch.setattr(type(llm_module.llm), "enabled", property(lambda self: True))

    def fake(**kw):
        schema = kw["schema"]
        if schema is ai_tasks.PersonaDraft:
            return ai_tasks.PersonaDraft(headline="A self-directed vision builder", summary="Loves shipping experiments.",
                                         must_have=["python", "pytorch"], nice_to_have=["cuda"], traits=["curious"],
                                         keywords=["computer vision"], autonomy=5, collaboration=None, pace=4, structure=2)
        if schema is ai_tasks.EmailAIReview:
            return ai_tasks.EmailAIReview(summary="Solid but generic opening.", strengths=["Clear ask"],
                                          issues=[ai_tasks.AIIssue(category="voice", severity="medium", quote="Hi Professor", advice="Name the professor.")],
                                          sounds_generic=70, voice_notes="Reads like a template.")
        return None

    monkeypatch.setattr(llm_module.llm, "structured", fake)
    persona = client.post("/match/professor/persona", headers=prof, json={"position_id": pos["id"], "lang": "en"}).json()
    assert persona["ai_used"] is True and persona["persona"]["work_style"] == {"autonomy": 5, "collaboration": None, "pace": 4, "structure": 2}

    h = signup(client, "e@mit.edu")
    r = client.post("/tools/email-check", headers=h, json={"subject": "Question about depth estimation", "body": "Hi Professor Rivera, I read your 2025 paper on depth estimation and built a small replication. Could we talk this fall about joining?\n\nBest, Sam"}).json()
    assert r["ai_used"] is True and r["ai_summary"] == "Solid but generic opening." and r["sounds_generic"] == 70
    assert any(f["source"] == "ai" and f["advice"] == "Name the professor." for f in r["flags"])
    assert any(s["code"] == "ai" and s["text"] == "Clear ask" for s in r["strengths"])


# --------------------------------------------------------------------------- billing, referrals, community


def test_plans_and_referrals(client):
    plans = client.get("/billing/plans").json()
    assert [p["id"] for p in plans] == ["free", "weekly", "semester", "lifetime"]
    assert next(p for p in plans if p["id"] == "semester")["highlighted"] is True

    a = signup(client, "a@mit.edu")
    code_a = client.get("/auth/me", headers=a).json()["referral_code"]
    own = client.post("/referrals/redeem", headers=a, json={"code": code_a})
    assert own.status_code == 422 and own.json()["detail"]["code"] == "own_referral_code"

    b = signup(client, "b@mit.edu")
    r = client.post("/referrals/redeem", headers=b, json={"code": code_a.lower()})
    assert r.status_code == 200 and r.json()["reward_days"] == 7
    assert client.post("/referrals/redeem", headers=b, json={"code": code_a}).status_code == 422  # only once
    assert client.get("/auth/me", headers=b).json()["is_pro"] is True   # reward is real access
    assert client.get("/auth/me", headers=a).json()["is_pro"] is True
    me_a = client.get("/billing/me", headers=a).json()
    assert me_a["referrals_redeemed"] == 1 and me_a["checkout_mode"] == "dev"

    c = client.post("/auth/register", json={"email": "c@mit.edu", "password": "password123", "full_name": "C", "role": "student", "referral_code": code_a})
    assert c.status_code == 201
    bad = client.post("/auth/register", json={"email": "d@mit.edu", "password": "password123", "full_name": "D", "role": "student", "referral_code": "ZZZZZZZZ"})
    assert bad.status_code == 422


def test_checkout_activates_and_stacks(client):
    h = signup(client, "buyer@mit.edu")
    assert client.post("/billing/checkout", headers=h, json={"plan": "weekly"}).json() == {"url": None, "activated": True}
    me = client.get("/auth/me", headers=h).json()
    assert me["plan"] == "weekly" and me["is_pro"] and me["pro_until"]
    client.post("/billing/checkout", headers=h, json={"plan": "lifetime"})
    assert client.get("/auth/me", headers=h).json()["plan"] == "lifetime"
    client.post("/billing/checkout", headers=h, json={"plan": "weekly"})  # never downgrades a lifetime plan
    assert client.get("/auth/me", headers=h).json()["plan"] == "lifetime"


def test_feedback_board_and_forms(client, student):
    assert client.post("/feedback", json={"kind": "feature", "title": "Hello", "body": "World"}).status_code == 401
    post = client.post("/feedback", headers=student, json={"kind": "feature", "title": "Export to CSV", "body": "Please add it"}).json()
    assert post["votes"] == 1 and post["voted"] is True and post["mine"] is True

    other = signup(client, "o@mit.edu")
    assert client.post(f"/feedback/{post['id']}/vote", headers=other).json()["votes"] == 2
    assert client.post(f"/feedback/{post['id']}/vote", headers=other).json()["votes"] == 1  # toggles off
    listed = client.get("/feedback", headers=student, params={"sort": "votes"}).json()
    assert listed[0]["title"] == "Export to CSV" and listed[0]["voted"] is True
    assert client.get("/feedback", params={"kind": "bug"}).json() == []

    assert client.post("/waitlist", json={"email": "w@x.com", "feature": "guaranteed_response"}).json() == {"ok": True}
    assert client.post("/waitlist", json={"email": "w@x.com", "feature": "guaranteed_response"}).json() == {"ok": True}  # idempotent
    assert client.post("/contact", json={"name": "Q", "email": "q@x.com", "message": "Hello there"}).json() == {"ok": True}

    admin = signup(client, "admin@uni.edu", "professor", "Admin")
    assert len(client.get("/admin/waitlist", headers=admin).json()) == 1
    assert client.get("/admin/contact", headers=admin).json()[0]["message"] == "Hello there"
    assert client.patch(f"/admin/feedback/{post['id']}", headers=admin, json={"status": "planned"}).json()["status"] == "planned"


def test_meta_stats_and_health(client, lab_and_position):
    s = client.get("/meta/stats").json()
    assert s["open_positions"] == 1 and s["labs"] == 1 and s["works_indexed"] == 326_000_000 and s["ai_enabled"] is False
    assert client.get("/health").json() == {"status": "ok"}


def test_schema_compiles_for_mssql():
    """Catch types MSSQL can't express (this can't replace a real SQL Server run, but it catches the common breaks)."""
    from sqlalchemy.dialects import mssql
    from sqlalchemy.schema import CreateTable

    from app.db import Base

    for table in Base.metadata.sorted_tables:
        str(CreateTable(table).compile(dialect=mssql.dialect()))  # raises if a type can't be expressed
    ddl = str(CreateTable(Base.metadata.tables["users"]).compile(dialect=mssql.dialect()))
    assert "NVARCHAR(255)" in ddl and "VARCHAR(255)" not in ddl.replace("NVARCHAR(255)", "")


def test_boolean_filters_are_valid_tsql():
    """`col IS 1` is not T-SQL (SQL Server has no boolean type). Compare with `== true()` / `== false()` instead."""
    import pathlib

    from sqlalchemy import false, select, true
    from sqlalchemy.dialects import mssql

    from app.models import User

    sql = str(select(User.id).where(User.verified == true(), User.email_verified == false()).compile(dialect=mssql.dialect()))
    assert "users.verified = 1" in sql and "users.email_verified = 0" in sql and " IS 1" not in sql

    offenders = [
        f"{p.name}:{i}"
        for p in pathlib.Path(__file__).parents[1].joinpath("app").rglob("*.py")
        for i, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1)
        if ".is_(True)" in line or ".is_(False)" in line
    ]
    assert not offenders, f"use `== true()` / `== false()` (MSSQL has no `IS 1`): {offenders}"
