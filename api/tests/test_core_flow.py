from tests.conftest import LAB, POSITION, PASSWORD, signup


def test_registration_rules(client):
    bad = client.post("/auth/register", json={"email": "a@gmail.com", "password": PASSWORD, "full_name": "x", "role": "student"})
    assert bad.status_code == 422 and bad.json()["detail"]["code"] == "email_not_academic"

    ok = client.post("/auth/register", json={"email": "x@ox.ac.uk", "password": PASSWORD, "full_name": "Ox", "role": "student"})
    assert ok.status_code == 201  # .ac.uk is an academic domain too

    dup = client.post("/auth/register", json={"email": "X@ox.ac.uk", "password": PASSWORD, "full_name": "Ox", "role": "student"})
    assert dup.status_code == 409 and dup.json()["detail"]["code"] == "email_taken"

    wrong = client.post("/auth/login", data={"username": "x@ox.ac.uk", "password": "nope-nope"})
    assert wrong.status_code == 401 and wrong.json()["detail"]["code"] == "invalid_credentials"


def test_me_password_and_delete(client):
    h = signup(client, "me@mit.edu")
    me = client.get("/auth/me", headers=h).json()
    assert me["role"] == "student" and me["plan"] == "free" and me["is_pro"] is False and len(me["referral_code"]) == 8
    assert client.patch("/auth/me", headers=h, json={"locale": "ko"}).json()["locale"] == "ko"

    assert client.post("/auth/change-password", headers=h, json={"current_password": "wrong-pass", "new_password": "newpassword1"}).status_code == 401
    assert client.post("/auth/change-password", headers=h, json={"current_password": PASSWORD, "new_password": "newpassword1"}).status_code == 200
    assert client.post("/auth/login", data={"username": "me@mit.edu", "password": "newpassword1"}).status_code == 200

    assert client.post("/auth/delete-account", headers=h, json={"password": "bad-password"}).status_code == 401
    assert client.post("/auth/delete-account", headers=h, json={"password": "newpassword1"}).status_code == 200
    assert client.post("/auth/login", data={"username": "me@mit.edu", "password": "newpassword1"}).status_code == 401


def test_full_recruiting_flow(client, prof, student, lab_and_position):
    lab, pos = lab_and_position
    pid = pos["id"]

    assert client.post("/labs/mine/materials", headers=prof, json={"title": "Paper", "kind": "paper", "url": "https://arxiv.org/abs/1"}).status_code == 201
    assert len(client.get(f"/labs/{lab['id']}/materials").json()) == 1

    assert client.post(f"/positions/{pid}/apply", headers=prof, json={"message": "hi"}).status_code == 403
    assert client.post(f"/positions/{pid}/apply", headers=student, json={"message": "hi"}).status_code == 201
    dup = client.post(f"/positions/{pid}/apply", headers=student, json={"message": "hi"})
    assert dup.status_code == 409 and dup.json()["detail"]["code"] == "already_applied"

    assert len(client.get("/positions", params={"q": "vision"}).json()) == 1
    assert client.get("/positions", params={"q": "biology"}).json() == []
    assert len(client.get("/positions", params={"location_type": "remote"}).json()) == 0

    mine = client.get("/positions/mine", headers=prof).json()
    assert mine[0]["applicant_count"] == 1

    apps = client.get(f"/positions/{pid}/applicants", headers=prof).json()
    assert apps[0]["student"]["email"] == "stu@mit.edu"
    decided = client.put(f"/applications/{apps[0]['id']}/status", headers=prof, json={"status": "accepted"}).json()
    assert decided["status"] == "accepted" and decided["decided_at"]

    my_apps = client.get("/applications/mine", headers=student).json()
    assert my_apps[0]["position"]["lab"]["name"] == "Vision Lab"

    assert client.post(f"/positions/{pid}/close", headers=prof).status_code == 200
    assert client.get("/positions").json() == []


def test_unverified_professors_stay_private(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "auto_verify_professors", False)
    p = signup(client, "new@mit.edu", "professor", "Prof. New")
    lab = client.post("/labs", headers=p, json=LAB).json()
    pos = client.post("/positions", headers=p, json=POSITION).json()
    # invisible to the public and to students until an admin verifies them
    assert client.get("/positions").json() == []
    assert client.get(f"/labs/{lab['id']}").status_code == 404
    assert client.get(f"/positions/{pos['id']}").status_code == 404
    # but the owner can still see and edit their own
    assert client.get(f"/positions/{pos['id']}", headers=p).status_code == 200

    admin = signup(client, "admin@uni.edu", "professor", "Admin")
    pending = client.get("/admin/professors", headers=admin, params={"pending": True}).json()
    assert any(x["email"] == "new@mit.edu" for x in pending)
    uid = next(x["id"] for x in pending if x["email"] == "new@mit.edu")
    assert client.post(f"/admin/professors/{uid}/verify", headers=admin, json={"verified": True}).json()["verified"] is True
    assert len(client.get("/positions").json()) == 1
    assert client.get("/admin/overview", headers=p).status_code == 403
    assert client.get("/admin/overview", headers=admin).json()["professors"] >= 2


def test_student_profile_roundtrip(client, student):
    body = {"major": "CS", "skills": "Python, PyTorch", "interests": "computer vision", "availability_hours": 10,
            "work_style": {"autonomy": 4, "pace": 3}, "discoverable": True, "resume_url": ""}
    r = client.put("/students/me", headers=student, json=body)
    assert r.status_code == 200
    got = client.get("/students/me", headers=student).json()
    assert got["discoverable"] is True and got["work_style"] == {"autonomy": 4, "pace": 3} and got["resume_url"] is None
    bad = client.put("/students/me", headers=student, json={**body, "work_style": {"autonomy": 9}})
    assert bad.status_code == 422
