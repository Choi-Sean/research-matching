from datetime import date

from tests.conftest import signup

GOOD_EMAIL = """Hi Professor Rivera,

I'm a sophomore who taught myself PyTorch by replicating a depth-estimation paper from 2023. Your paper "Self-supervised depth estimation from monocular video" caught my attention because the 12% gain came without labels, and I wondered whether the approach still holds up on night-time footage?

I can commit about 10 hours a week this fall. If you aren't taking students, could you point me to someone in your group who might be?

Thank you,
Sam"""

BAD_EMAIL = """Dear Sir,

I am a highly motivated and passionate student. I found your work fascinating and groundbreaking!! I would love to learn from you. Your research aligns perfectly with my interests. I hope this email finds you well.

Sincerely,
Sam"""


def test_search_and_detail(client):
    r = client.get("/discover/professors", params={"q": "computer vision", "university": "Test"})
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 2 and data["items"][0]["name"] == "Elena Rivera" and data["institution"]["name"] == "Test University"
    by_cited = client.get("/discover/professors", params={"q": "vision", "sort": "cited"}).json()["items"]
    assert by_cited[0]["id"] == "A1001"
    by_name = client.get("/discover/professors", params={"q": "Rivera", "mode": "name"}).json()
    assert by_name["total"] == 1
    assert client.get("/discover/professors", params={"q": "x"}).status_code == 422  # too short
    assert client.get("/discover/professors/A1001").json()["recent_works_list"][0]["year"] == 2025
    assert client.get("/discover/professors/not-an-id").status_code == 404
    assert len(client.get("/discover/institutions", params={"q": "test"}).json()) == 1


def test_summary_quota_and_extractive_fallback(client, student):
    assert client.post("/discover/professors/A1001/summary", json={"lang": "en"}).status_code == 401
    r = client.post("/discover/professors/A1001/summary", headers=student, json={"lang": "en"})
    assert r.status_code == 200
    body = r.json()
    assert body["summary"]["source"] == "extractive"  # no API key in tests
    assert "depth" in body["summary"]["key_finding"].lower()
    assert body["quota"] == {"feature": "summary", "used": 1, "limit": 2, "is_pro": False}
    # opening the same professor again is free
    again = client.post("/discover/professors/A1001/summary", headers=student, json={"lang": "en"}).json()
    assert again["quota"]["used"] == 1
    assert client.post("/discover/professors/A1002/summary", headers=student, json={"lang": "en"}).json()["quota"]["used"] == 2
    third = client.post("/discover/professors/A1003/summary", headers=student, json={"lang": "en"})
    assert third.status_code == 402 and third.json()["detail"]["code"] == "quota_exceeded"


def test_contact_is_locked_until_pro(client, student):
    locked = client.get("/discover/professors/A1001/contact", headers=student).json()
    assert locked["locked"] is True and locked["candidates"] == [] and locked["hidden_count"] >= 5
    assert locked["responsiveness"] is None and locked["domain"] == "testu.edu"

    client.post("/billing/checkout", headers=student, json={"plan": "weekly"})  # dev mode activates instantly
    open_ = client.get("/discover/professors/A1001/contact", headers=student).json()
    assert open_["locked"] is False
    assert open_["candidates"][0]["address"] == "elena.rivera@testu.edu"
    assert open_["responsiveness"]["level"] == "unknown"  # not enough real reports yet — we don't invent data


def test_email_checker_rules(client, student):
    good = client.post("/tools/email-check", headers=student, json={"subject": "Question on your depth-estimation paper", "body": GOOD_EMAIL, "professor_id": "A1001"})
    assert good.status_code == 200, good.text
    g = good.json()
    codes = {f["code"] for f in g["flags"]}
    assert g["score"] >= 80 and g["grade"] in ("excellent", "good")
    assert {"specific_reference", "clear_ask", "redirect_offer"} <= {s["code"] for s in g["strengths"]}
    assert "flattery" not in codes

    # second check exceeds the single free check
    over = client.post("/tools/email-check", headers=student, json={"subject": "", "body": BAD_EMAIL})
    assert over.status_code == 402


def test_email_checker_flags_bad_email(client):
    h = signup(client, "pro@mit.edu")
    client.post("/billing/checkout", headers=h, json={"plan": "semester"})
    r = client.post("/tools/email-check", headers=h, json={"subject": "Research", "body": BAD_EMAIL}).json()
    codes = {f["code"] for f in r["flags"]}
    assert {"flattery", "generic_phrase", "bad_salutation", "exclamation", "no_clear_ask", "low_specificity", "subject_generic"} <= codes
    assert r["grade"] == "risky" and r["score"] < 50
    flattery = next(f for f in r["flags"] if f["code"] == "flattery")
    assert BAD_EMAIL[flattery["start"]:flattery["end"]].lower() == flattery["quote"].lower()
    assert r["sounds_generic"] >= 60 and r["ai_used"] is False


def test_email_checker_non_english_skips_phrase_rules(client):
    h = signup(client, "ko@mit.edu")
    body = "안녕하세요 교수님. 저는 컴퓨터 비전에 관심이 있는 학생입니다. 교수님의 연구실에서 인턴으로 일할 수 있는지 문의드립니다. " * 3
    r = client.post("/tools/email-check", headers=h, json={"subject": "문의", "body": body}).json()
    assert r["english_checks"] is False
    assert not any(f["code"] in ("flattery", "generic_phrase") for f in r["flags"])


def test_follow_up_schedule(client, student):
    r = client.post("/tools/follow-up", headers=student, json={"email": GOOD_EMAIL, "sent_on": "2026-09-25", "subject": "Depth question"})
    assert r.status_code == 200, r.text
    items = r.json()["items"]
    assert len(items) == 2 and items[0]["subject"] == "Re: Depth question"
    assert items[0]["send_on"] == "2026-10-02"  # 7 days later (a Friday)
    d2 = date.fromisoformat(items[1]["send_on"])
    assert d2.weekday() < 5 and (d2 - date(2026, 9, 25)).days >= 16
    assert "Professor Rivera" in items[0]["body"]


def test_outreach_tracker_feeds_responsiveness(client):
    pro = signup(client, "pro2@mit.edu")
    client.post("/billing/checkout", headers=pro, json={"plan": "lifetime"})
    for i in range(3):  # three students log outreach to the same researcher; two hear back
        h = signup(client, f"s{i}@mit.edu")
        e = client.post("/outreach", headers=h, json={"openalex_id": "A1001", "professor_name": "Elena Rivera", "institution": "Test University", "status": "sent"}).json()
        assert e["sent_on"] and e["follow_up_on"]  # sensible defaults
        if i < 2:
            client.patch(f"/outreach/{e['id']}", headers=h, json={"status": "replied"})
    resp = client.get("/discover/professors/A1001/contact", headers=pro).json()["responsiveness"]
    assert resp["sample_size"] == 3 and resp["level"] == "high" and resp["reply_rate"] == 0.67


def test_bookmarks(client, student):
    b = client.post("/bookmarks", headers=student, json={"kind": "professor", "ref": "A1001", "snapshot": {"name": "Elena Rivera"}})
    assert b.status_code == 201
    assert client.post("/bookmarks", headers=student, json={"kind": "professor", "ref": "A1001"}).json()["id"] == b.json()["id"]  # idempotent
    assert len(client.get("/bookmarks", headers=student, params={"kind": "professor"}).json()) == 1
    client.delete("/bookmarks/professor/A1001", headers=student)
    assert client.get("/bookmarks", headers=student).json() == []
