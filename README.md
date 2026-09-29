# Labora — 연구 매칭 플랫폼

교수는 연구실 포지션과 연구 자료를 올리고, 학생은 교수를 찾아 지원합니다. 세계 학술 데이터(OpenAlex)로 교수를 탐색하고,
AI가 **학생의 역량·성향 ↔ 교수/연구실이 원하는 인재상**을 양방향으로 매칭합니다.

| 폴더 | 내용 |
| --- | --- |
| `web/` | Next.js 16 (App Router, Tailwind v4) — 라이트/다크, 16개 언어(RTL 포함) |
| `api/` | FastAPI + SQLAlchemy — MSSQL(운영) / SQLite(로컬·테스트), Railway 배포 |
| `mobile/` | Expo 스캐폴드 (아직 구현 전) |

## 빠른 시작

```bash
# 1) API  (http://localhost:8000, 문서: /docs)
cd api
python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env            # DATABASE_URL 등 채우기 (아래 "데이터베이스")
.venv/Scripts/python -m uvicorn app.main:app --reload

# 2) 웹  (http://localhost:3000)
cd web
npm install
cp .env.example .env.local
npm run dev
```

## 데이터베이스

`api/.env`의 `DATABASE_URL` 하나로 결정됩니다. 테이블은 API가 시작될 때 자동 생성됩니다(`Base.metadata.create_all`, 이미 있는 테이블은 건드리지 않음).

```
DATABASE_URL=mssql+pytds://USER:PASSWORD@HOST:1433/DBNAME     # ADO.NET 문자열을 이 형식으로 바꿉니다
DATABASE_URL=sqlite:///./dev.db                                # 로컬/오프라인
```

- 비밀번호의 특수문자는 퍼센트 인코딩합니다: `@`→`%40`, `!`→`%21`, `:`→`%3A`, `/`→`%2F`, `#`→`%23`, `%`→`%25`.
- `Encrypt=True; TrustServerCertificate=True`에 해당하는 동작이 기본입니다(TLS 협상, 인증서 미검증). 검증하려면 `?cafile=...`.
- `.env`는 git에서 제외됩니다. 비밀번호를 코드나 README에 넣지 마세요. 운영 환경(Railway)에서는 서비스 변수로 설정합니다.
- Alembic은 아직 없습니다. 컬럼을 바꾸면 기존 테이블에는 자동 반영되지 않으니, 스키마가 안정되면 마이그레이션을 도입하세요.

### 테스트 계정 / 데모 데이터

```bash
cd api
.venv/Scripts/python seed_accounts.py            # 교수 5 + 학생 5 (여러 번 실행해도 안전, 이미 있으면 건너뜀)
.venv/Scripts/python seed_accounts.py -p 3 -s 2  # 개수 지정
.venv/Scripts/python seed.py                     # 빈 DB에 전체 데모 데이터(교수 8, 학생 10, 지원·초대·피드백 포함)
```

| 역할 | 이메일 |
| --- | --- |
| 교수 (인증됨, 연구실·포지션 포함) | `prof1@mit.edu`, `prof2@stanford.edu`, `prof3@berkeley.edu`, `prof4@cmu.edu`, `prof5@umich.edu` |
| 학생 (프로필 작성됨) | `student@mit.edu`, `priya@stanford.edu`, `marcus@berkeley.edu`, `sofia@cmu.edu`, `wei@utexas.edu` |

비밀번호는 `api/seed.py` 맨 위에 적힌 데모 비밀번호입니다(개발 모드 로그인 화면의 데모 버튼이 자동으로 채워 줍니다).
**전부 가상의 테스트 데이터입니다. 실제 대학 이름이 붙은 연구실·포지션이 들어 있으니 공개 배포 전에 삭제하세요.**
관리자 화면(`/admin`)은 `ADMIN_EMAILS`에 넣은 이메일로 가입하면 열립니다(예: `admin@labora.edu`).

## 언어(i18n)

- 지원: 영어(기본), 한국어, 日本語, 简体中文, 繁體中文, Español, Français, Deutsch, Português, Italiano, Русский, العربية(RTL), हिन्दी, Tiếng Việt, Türkçe, Bahasa Indonesia.
- 16개 언어 모두 번역이 끝나 있습니다(`npm run i18n:check`가 전 언어 100%). 새 문자열을 추가하다 번역이 비면 그 키만 영어로 표시되어 화면이 깨지지 않습니다.
- 원본은 `web/messages-src/en/<네임스페이스>.json`, 번역은 `web/messages-src/<로케일>/{a..e}.json`(부분 객체, 깊은 병합)입니다.

```bash
cd web
npm run i18n:build   # messages-src → src/messages/*.json (dev/build 시 자동 실행)
npm run i18n:check   # 누락·불필요 키, {placeholder}·<태그> 불일치, 언어별 필수 복수형 검사
```

**언어 추가**: ① `src/lib/i18n/config.ts`의 `LOCALES`에 한 줄, ② `src/lib/i18n/server.ts`의 `catalogues`에 한 줄, ③ `scripts/i18n-build.mjs`의 `LOCALES`에 코드 추가,
④ `messages-src/<코드>/`에 번역 JSON 작성. 복수형은 러시아어 `_one/_few/_many/_other`, 아랍어 `_zero/_one/_two/_few/_many/_other`, 터키어·힌디어 `_one/_other`를 모두 써야 합니다.
번역은 AI 초안이므로 원어민 검수가 필요합니다. 블로그·법률·플레이북·예시 메일의 본문은 아직 영어만 있습니다.

## 모바일

웹은 휴대폰 화면(320px~)에서 쓰도록 만들어져 있습니다. 데스크톱 디자인은 그대로 두고 좁은 화면·터치 입력에서만 달라지도록 했습니다.

- **터치**: 터치 기기(`pointer: coarse`)에서는 버튼·탭·필·링크가 44px 안팎으로 커지고, 입력창은 16px라 iOS가 확대하지 않습니다.
- **레이아웃**: 다이얼로그는 폰에서 하단 시트, 대시보드 메뉴는 좌우로 밀어 넘기는 줄(현재 메뉴가 가운데로 오도록 자동 스크롤), 통계는 얇은 행,
  포지션 상세에는 하단 고정 "지원하기" 바가 붙습니다. 긴 독일어·러시아어 문장도 줄바꿈되어 화면 밖으로 밀려나지 않습니다.
- **홈 화면에 추가**: `src/app/manifest.ts`와 아이콘(`public/icons/`, `src/app/apple-icon.png`)이 있어 폰에서 앱처럼 설치됩니다. 아이콘을 바꿨다면 `node scripts/make-icons.mjs`.

```bash
cd web
node scripts/mobile-audit.mjs --set all --widths 320,390 --locales en,de,ar --drawer --details   # 가로 넘침·작은 터치 영역·16px 미만 입력창·좁은 글 칸·메뉴 서랍·콘솔 오류 점검
node scripts/mobile-states.mjs shots-states --locale ko                                 # 메뉴 서랍·필터·지원 시트·대시보드를 터치 에뮬레이션으로 캡처
```

두 스크립트는 시스템 Edge를 쓰며(웹 :3000, API :8000 필요), 로그인이 필요한 화면은 `api/seed.py`의 데모 계정으로 접속합니다.
Windows Git Bash에서 `/` 같은 경로 인자를 넘길 땐 앞에 `MSYS_NO_PATHCONV=1`을 붙이세요(안 그러면 경로가 변환됩니다).

## 검증

```bash
cd api && .venv/Scripts/python -m pytest                  # 30개 (가짜 OpenAlex + LLM 목, SQLite)
cd web && npm run typecheck && npm run lint && npm run build
cd web && npm run e2e                                      # Playwright(시스템 Edge) 시나리오, API가 시드된 SQLite로 떠 있어야 함
```

E2E는 `seed.py`의 전체 데모 데이터를 전제로 합니다. E2E를 돌릴 때는 `DATABASE_URL=sqlite:///./dev.db`로 API를 띄우세요.

## 환경 변수

`api/.env.example`, `web/.env.example` 참고. 핵심:

- `ANTHROPIC_API_KEY` — 비어 있으면 요약·이메일 점검·매칭 재정렬이 규칙 기반 폴백으로 동작합니다(모델은 `ANTHROPIC_MODEL`).
- `STRIPE_SECRET_KEY` — 비어 있으면 결제가 즉시 활성화되는 개발 모드입니다. 요금은 `api/app/services/plans.py`의 임시값입니다.
- `AUTO_VERIFY_PROFESSORS` — 개발 편의용. **운영에서는 끄고** 관리자가 교수를 인증하세요.

## 아직 없는 것

Expo 네이티브 모바일 앱(`mobile/`은 스캐폴드뿐 — 모바일 웹/PWA는 위처럼 준비됨), Alembic 마이그레이션, 이메일 인증·비밀번호 재설정, 파일 업로드 저장소(현재는 링크만), 결제 실서비스 검증.
개인정보처리방침·이용약관은 초안이므로 법률 검토가 필요합니다.
