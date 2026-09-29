"""Create test accounts in whatever DATABASE_URL points at (the MSSQL database when api/.env is set up).

    .venv\\Scripts\\python seed_accounts.py                # 5 professors + 5 students
    .venv\\Scripts\\python seed_accounts.py -p 3 -s 2      # a different number

Unlike seed.py it does not need an empty database: it creates the tables if they are missing and skips any e-mail
that already exists, so it is safe to re-run.

What you get
    professors  the first N of seed.py's LABS: verified, each with a lab profile, open positions and research materials
    students    the first N of seed.py's STUDENTS: complete profiles (skills, interests, working style, availability)
The login password is the demo password defined at the top of seed.py. Everything here is fictional test data,
so delete these accounts before a public launch.
"""
import argparse
from datetime import date, timedelta

from sqlalchemy import func, select

from app import models as m
from app.db import Base, SessionLocal, engine
from seed import LABS, PW, STUDENTS, code


def _exists(db, email: str) -> bool:
    return db.scalar(select(m.User.id).where(func.lower(m.User.email) == email.lower())) is not None


def _referral_code(db) -> str:
    while True:
        c = code()
        if db.scalar(select(m.User.id).where(m.User.referral_code == c)) is None:
            return c


def main(n_professors: int, n_students: int) -> None:
    Base.metadata.create_all(engine)
    created: list[tuple[str, str]] = []
    skipped: list[str] = []
    with SessionLocal() as db:
        for i, (name, email, lab_name, uni, dept, bio, kw, culture, team, ws, pos_rows, mats) in enumerate(LABS[:n_professors]):
            if _exists(db, email):
                skipped.append(email)
                continue
            user = m.User(email=email, password_hash=PW, role="professor", full_name=name, email_verified=True,
                          verified=True, referral_code=_referral_code(db))
            db.add(user)
            db.flush()
            lab = m.Lab(owner_id=user.id, name=lab_name, university=uni, department=dept, bio=bio, keywords=kw,
                        culture=culture, team_size=team, work_style=ws, website="https://example.edu")
            db.add(lab)
            db.flush()
            for j, (title, desc, req, skills, k, comp, hours, term, loc, slots) in enumerate(pos_rows):
                db.add(m.Position(lab_id=lab.id, title=title, description=desc, requirements=req, required_skills=skills,
                                  keywords=k, compensation=comp, hours_per_week=hours, term=term, location_type=loc,
                                  slots=slots, deadline=date.today() + timedelta(days=30 + 7 * (i + j))))
            for title, kind, url in mats:
                db.add(m.Material(lab_id=lab.id, title=title, kind=kind, url=url))
            created.append(("professor", email))

        for (name, email, uni, major, year, skills, interests, exp, bio, hours, ws, disc) in STUDENTS[:n_students]:
            if _exists(db, email):
                skipped.append(email)
                continue
            user = m.User(email=email, password_hash=PW, role="student", full_name=name, email_verified=True,
                          referral_code=_referral_code(db))
            db.add(user)
            db.flush()
            db.add(m.StudentProfile(user_id=user.id, university=uni, major=major, year=year, skills=skills,
                                    interests=interests, experience=exp, bio=bio, availability_hours=hours,
                                    work_style=ws, discoverable=disc))
            created.append(("student", email))
        db.commit()

        totals = {
            "users": db.scalar(select(func.count(m.User.id))),
            "professors": db.scalar(select(func.count(m.User.id)).where(m.User.role == "professor")),
            "students": db.scalar(select(func.count(m.User.id)).where(m.User.role == "student")),
            "labs": db.scalar(select(func.count(m.Lab.id))),
            "positions": db.scalar(select(func.count(m.Position.id))),
        }

    print(f"database: {engine.dialect.name}")
    for role, email in created:
        print(f"  created  {role:10s} {email}")
    for email in skipped:
        print(f"  skipped  (already exists) {email}")
    print("totals:", totals)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("-p", "--professors", type=int, default=5)
    ap.add_argument("-s", "--students", type=int, default=5)
    args = ap.parse_args()
    main(min(args.professors, len(LABS)), min(args.students, len(STUDENTS)))
