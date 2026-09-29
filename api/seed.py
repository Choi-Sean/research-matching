"""Demo data for local development. Idempotent: skips if users already exist.

Run:   .venv\\Scripts\\python seed.py
Logins (password: password123)
    professors  prof1@mit.edu … prof8@gatech.edu
    students    student@mit.edu (Jamie), priya@stanford.edu, marcus@berkeley.edu, …
    admin       admin@labora.edu   (add it to ADMIN_EMAILS in .env)

Everything here is fictional. Nothing in this file describes a real person or a real outcome.
"""
import secrets
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app import models as m
from app.db import Base, SessionLocal, engine
from app.security import hash_password

PW = hash_password("password123")
_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def code() -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(8))


def style(a, c, p, s):
    return {"autonomy": a, "collaboration": c, "pace": p, "structure": s}


# name, email, lab, university, department, bio, keywords, culture, team, style, positions, materials
LABS = [
    ("Prof. Elena Vasquez", "prof1@mit.edu", "Vision & Learning Lab", "MIT", "Computer Science",
     "We build perception systems that learn from few labels, with applications in robotics and medical imaging.",
     "computer vision,deep learning,robotics",
     "Weekly reading group, fortnightly 1:1s. Undergraduates own a small experiment end to end and present at group meeting.",
     9, style(4, 4, 4, 2),
     [("Undergraduate RA: Self-supervised Vision",
       "Help train and evaluate self-supervised models on large image corpora. You will run experiments, analyze failure cases, and co-author a workshop paper.",
       "Python and PyTorch. Prior ML coursework preferred.", "python,pytorch,linear algebra",
       "computer vision,pytorch", "paid", 10, "fall", "hybrid", 2),
      ("Summer Research: Robotic Grasping",
       "Join a small team building learned grasping policies on a real robot arm.",
       "Comfortable on Linux. C++ or Python.", "python,c++,linux", "robotics,reinforcement learning", "paid", 20,
       "summer", "on_site", 1)],
     [("Self-supervised Learning at Scale", "paper", "https://example.com/papers/ssl-scale"),
      ("Lab Dataset: Cluttered Grasps v2", "dataset", "https://example.com/datasets/grasps-v2")]),
    ("Prof. Marcus Lee", "prof2@stanford.edu", "Computational Genomics Group", "Stanford University", "Biology",
     "Statistical methods for single-cell data to understand how cells make fate decisions.",
     "genomics,bioinformatics,statistics",
     "Highly collaborative wet/dry teams. Structured onboarding with a graduate-student mentor for every undergraduate.",
     14, style(2, 5, 3, 4),
     [("Undergraduate Researcher: Single-cell Analysis",
       "Analyze single-cell RNA-seq datasets and help build a reproducible pipeline.",
       "R or Python and introductory statistics. No wet-lab experience needed.", "r,python,statistics",
       "bioinformatics,scrna-seq", "credit", 8, "spring", "hybrid", 2)],
     [("Fate mapping with optimal transport", "paper", "https://example.com/papers/fate-ot")]),
    ("Prof. Aisha Rahman", "prof3@berkeley.edu", "Human-AI Interaction Lab", "UC Berkeley", "EECS",
     "How people understand, trust, and collaborate with AI systems.",
     "hci,ai,user study",
     "Small, discussion-driven lab. Students shape their own study designs and run them with support.",
     7, style(4, 4, 3, 2),
     [("Research Assistant: LLM Interface Studies",
       "Design and run user studies on how people use AI assistants for writing and coding.",
       "Interest in HCI or psychology. React experience is a plus.", "user research,react,statistics",
       "hci,llm,user study", "paid", 12, "fall", "hybrid", 2),
      ("Volunteer: Qualitative Coding",
       "Code interview transcripts and help synthesize themes.", "Careful reader, about 5 hours a week.",
       "qualitative coding", "qualitative,hci", "volunteer", 5, "flexible", "remote", 3)],
     [("Trust calibration in AI-assisted decisions", "paper", "https://example.com/papers/trust")]),
    ("Prof. David Chen", "prof4@cmu.edu", "Language Technologies Lab", "Carnegie Mellon University", "Computer Science",
     "Multilingual NLP and evaluation of large language models.",
     "nlp,llm,multilingual",
     "Independent, fast-moving projects. We value students who read papers and bring their own ideas.",
     12, style(5, 3, 5, 2),
     [("Undergraduate RA: Multilingual Benchmarks",
       "Curate benchmarks for low-resource languages and evaluate open models.",
       "Python. Fluency in a second language is a plus.", "python,nlp",
       "nlp,benchmarks,multilingual", "paid", 10, "year_round", "remote", 2)],
     [("A benchmark for low-resource QA", "dataset", "https://example.com/datasets/lrqa")]),
    ("Prof. Sofia Martinez", "prof5@umich.edu", "Sustainable Materials Lab", "University of Michigan",
     "Materials Science", "Designing recyclable polymers and battery materials.", "materials,polymers,batteries",
     "Hands-on bench work with strict safety training. Clear protocols and close supervision.",
     11, style(2, 4, 2, 5),
     [("Lab Assistant: Polymer Synthesis",
       "Synthesize and characterize new polymer candidates under graduate-student supervision.",
       "Chem 210 or equivalent. Safety training provided.", "chemistry,lab safety",
       "chemistry,polymers", "credit", 10, "fall", "on_site", 2)], []),
    ("Prof. James O'Brien", "prof6@utexas.edu", "Quantum Information Group", "UT Austin", "Physics",
     "Error correction and algorithms for near-term quantum devices.", "quantum,physics,algorithms",
     "Theory-leaning group with weekly whiteboard sessions. Newcomers start with a reproducibility project.",
     8, style(3, 3, 3, 3),
     [("Undergraduate Researcher: Quantum Error Correction",
       "Simulate surface-code decoders and benchmark them.", "Linear algebra and Python. QM coursework preferred.",
       "python,linear algebra,numpy", "quantum,simulation", "paid", 10, "fall", "hybrid", 1)],
     [("Decoders for the surface code", "poster", "https://example.com/posters/decoders")]),
    ("Prof. Priya Nair", "prof7@jhu.edu", "Neuroimaging & Cognition Lab", "Johns Hopkins University", "Neuroscience",
     "Mapping how large-scale brain networks support memory and attention.", "neuroscience,fmri,cognition",
     "Structured, protocol-driven lab with clear roles and steady weekly cadence.",
     10, style(2, 4, 2, 5),
     [("Research Assistant: fMRI Data Processing",
       "Preprocess fMRI data, run QC, and assist with participant sessions.",
       "Python or MATLAB. Reliable and detail-oriented.", "python,matlab,fmri", "fmri,neuroscience", "paid", 12,
       "fall", "on_site", 2),
      ("Volunteer: Participant Recruitment", "Help recruit and schedule study participants.", "Great communicator.",
       "communication", "neuroscience", "volunteer", 4, "flexible", "on_site", 2)], []),
    ("Prof. Tom Becker", "prof8@gatech.edu", "Climate Systems Lab", "Georgia Tech", "Environmental Engineering",
     "Data-driven models of urban heat and flood risk.", "climate,geospatial,data science",
     "Applied, data-heavy projects. Flexible hours; students set weekly goals with the PI.",
     6, style(4, 3, 4, 3),
     [("Undergraduate RA: Urban Heat Modeling",
       "Build geospatial models of urban heat islands with satellite data.", "Python (pandas). GIS is a plus.",
       "python,pandas,gis", "climate,geospatial", "credit", 8, "spring", "hybrid", 2)],
     [("Urban heat exposure across 50 cities", "paper", "https://example.com/papers/heat")]),
]

# name, email, university, major, year, skills, interests, experience, bio, hours, style, discoverable
STUDENTS = [
    ("Jamie Park", "student@mit.edu", "MIT", "Computer Science", "Sophomore", "Python, PyTorch, C++",
     "computer vision, robotics, self-supervised learning",
     "Built an object detector for the campus robotics club (PyTorch, ~4k labelled images). TA for intro programming.",
     "Looking for my first research experience in ML and robotics.", 10, style(4, 3, 4, 2), True),
    ("Priya Desai", "priya@stanford.edu", "Stanford University", "Biology", "Junior", "R, Python, statistics, wet lab",
     "genomics, single-cell biology, cell fate",
     "Two lab rotations (cell culture, qPCR). Analyzed a public scRNA-seq dataset for a class project in R.",
     "Curious how computation can explain development.", 8, style(2, 5, 3, 4), True),
    ("Marcus Johnson", "marcus@berkeley.edu", "UC Berkeley", "Psychology", "Senior", "SPSS, R, user research, React",
     "human-computer interaction, trust in AI, user studies",
     "Ran three usability studies for a campus app (n=40 total). Built the study dashboard in React.",
     "Interested in how people decide when to rely on AI.", 12, style(4, 4, 3, 2), True),
    ("Sofia Rossi", "sofia@cmu.edu", "Carnegie Mellon University", "Linguistics & CS", "Junior",
     "Python, NLP, spaCy, Italian, Spanish", "multilingual NLP, low-resource languages, machine translation",
     "Built a POS tagger for a low-resource dialect as a course project; contributed to an open-source tokenizer.",
     "Bilingual (Italian/English), learning Spanish.", 10, style(5, 3, 5, 2), True),
    ("Wei Chen", "wei@utexas.edu", "UT Austin", "Physics", "Sophomore", "Python, NumPy, linear algebra, Qiskit",
     "quantum computing, error correction, simulation",
     "Implemented Grover's algorithm in Qiskit and a small stabilizer-code simulator for a self-study project.",
     "Enjoys theory but wants to see it run.", 10, style(3, 3, 3, 3), True),
    ("Amara Okafor", "amara@jhu.edu", "Johns Hopkins University", "Neuroscience", "Junior",
     "MATLAB, Python, fMRI preprocessing, FSL", "memory, attention, brain networks",
     "Lab assistant preprocessing fMRI for a memory study; completed graduate course in neuroimaging methods.",
     "Detail-oriented and reliable.", 12, style(2, 4, 2, 5), False),
    ("Lucas Martin", "lucas@gatech.edu", "Georgia Tech", "Environmental Engineering", "Senior",
     "GIS, Python, pandas, remote sensing", "urban heat, climate adaptation, geospatial analysis",
     "Senior design project mapping heat exposure with Landsat data; internship with a city sustainability office.",
     "Wants applied climate research.", 8, style(4, 3, 4, 3), True),
    ("Hannah Kim", "hannah@umich.edu", "University of Michigan", "Materials Science", "Sophomore",
     "chemistry, lab safety, polymer basics", "sustainable polymers, batteries",
     "General chemistry lab TA; completed lab safety certification.", "Loves hands-on work.", 10,
     style(2, 4, 2, 5), False),
    ("Diego Alvarez", "diego@mit.edu", "MIT", "Computer Science & Math", "Junior",
     "Python, PyTorch, algorithms, linear algebra", "computer vision, medical imaging, representation learning",
     "Reproduced a self-supervised pretraining paper on a small dataset; research seminar in medical image analysis.",
     "Enjoys turning papers into working code.", 12, style(4, 3, 4, 2), True),
    ("Nora Ahmed", "nora@stanford.edu", "Stanford University", "Cognitive Science", "Junior",
     "R, Python, EEG, statistics", "neural dynamics, cognition, attention",
     "Analyzed EEG data from a public dataset (alpha-band power); statistics for psychology sequence.",
     "Fascinated by how attention shows up in brain signals.", 9, style(3, 4, 3, 4), True),
]


def main() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalar(select(m.User).limit(1)):
            print("Database already has users; skipping seed.")
            return

        # ---- admin
        db.add(m.User(email="admin@labora.edu", password_hash=PW, role="professor", full_name="Labora Admin",
                      email_verified=True, verified=True, referral_code=code()))

        # ---- professors, labs, positions, materials
        positions: list[m.Position] = []
        for i, (name, email, lab_name, uni, dept, bio, kw, culture, team, ws, pos_rows, mats) in enumerate(LABS):
            u = m.User(email=email, password_hash=PW, role="professor", full_name=name, email_verified=True,
                       verified=True, referral_code=code())
            db.add(u)
            db.flush()
            lab = m.Lab(owner_id=u.id, name=lab_name, university=uni, department=dept, bio=bio, keywords=kw,
                        culture=culture, team_size=team, work_style=ws, website="https://example.edu")
            db.add(lab)
            db.flush()
            for j, (t, d, req, skills, k, comp, hrs, term, loc, slots) in enumerate(pos_rows):
                p = m.Position(lab_id=lab.id, title=t, description=d, requirements=req, required_skills=skills,
                               keywords=k, compensation=comp, hours_per_week=hrs, term=term, location_type=loc,
                               slots=slots, deadline=date.today() + timedelta(days=14 + 7 * (i + j)))
                db.add(p)
                positions.append(p)
            for t, kind, url in mats:
                db.add(m.Material(lab_id=lab.id, title=t, kind=kind, url=url))
        db.flush()

        # ---- students
        students: dict[str, m.User] = {}
        for (name, email, uni, major, year, skills, interests, exp, bio, hours, ws, disc) in STUDENTS:
            s = m.User(email=email, password_hash=PW, role="student", full_name=name, email_verified=True,
                       referral_code=code())
            db.add(s)
            db.flush()
            db.add(m.StudentProfile(user_id=s.id, university=uni, major=major, year=year, skills=skills,
                                    interests=interests, experience=exp, bio=bio, availability_hours=hours,
                                    work_style=ws, discoverable=disc))
            students[email] = s
        db.flush()

        by_title = {p.title: p for p in positions}
        now = datetime.now(timezone.utc)

        def apply(email: str, title: str, message: str, status: str = "pending", days_ago: int = 3, decided: int | None = None):
            db.add(m.Application(position_id=by_title[title].id, student_id=students[email].id, message=message,
                                 status=status, created_at=now - timedelta(days=days_ago),
                                 decided_at=(now - timedelta(days=days_ago - decided)) if decided is not None else None))

        apply("student@mit.edu", "Undergraduate RA: Self-supervised Vision",
              "I built an object detector for our robotics club and would love to learn how self-supervised methods reduce labelling. I can commit 10 hours a week this fall.")
        apply("marcus@berkeley.edu", "Research Assistant: LLM Interface Studies",
              "I ran three usability studies last year and I'm curious how people calibrate trust in AI answers.",
              days_ago=5, status="accepted", decided=2)
        apply("sofia@cmu.edu", "Undergraduate RA: Multilingual Benchmarks",
              "I built a POS tagger for a low-resource dialect and speak Italian and Spanish.", days_ago=6,
              status="rejected", decided=3)
        apply("priya@stanford.edu", "Undergraduate Researcher: Single-cell Analysis",
              "I analyzed a public scRNA-seq dataset in R and want to go deeper on fate decisions.", days_ago=4,
              status="accepted", decided=1)
        apply("nora@stanford.edu", "Undergraduate Researcher: Single-cell Analysis",
              "My EEG analysis coursework gave me a statistics foundation I'd like to apply to biology.",
              days_ago=2, status="rejected", decided=1)

        # ---- one pending invitation (Vision lab → Diego)
        vision = by_title["Undergraduate RA: Self-supervised Vision"]
        prof = db.scalar(select(m.User).where(m.User.email == "prof1@mit.edu"))
        db.add(m.Invitation(position_id=vision.id, professor_id=prof.id, student_id=students["diego@mit.edu"].id,
                            message="Your reproduction of a self-supervised paper is exactly the kind of work we do. Would you like to apply?",
                            match_score=91))

        # ---- a few feedback posts so the board isn't empty in development
        for i, (kind, title, body) in enumerate([
            ("feature", "Export my outreach tracker to CSV", "I'd like to back up my professor list and reply dates."),
            ("feature", "Dark mode for the email checker", "Editing emails late at night is easier on the eyes."),
            ("bug", "Filter chips overlap on small phones", "Seen on a 320px-wide screen in the positions list."),
        ]):
            author = list(students.values())[i]
            post = m.FeedbackPost(user_id=author.id, kind=kind, title=title, body=body, votes=2 - i // 2)
            db.add(post)
        db.commit()
        print("Seeded demo data.")


if __name__ == "__main__":
    main()
