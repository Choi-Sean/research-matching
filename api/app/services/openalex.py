"""Professor discovery on top of OpenAlex (open scholarly metadata: works, authors, institutions).

Only people and papers that exist in the scholarly record are ever returned — nothing here is generated.
"""
from __future__ import annotations

import math
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx

from app.config import settings
from app.schemas.discover import (
    InstitutionMini,
    InstitutionOut,
    ProfessorCard,
    ProfessorDetail,
    TopicOut,
    WorkOut,
    YearCount,
)

BASE_URL = "https://api.openalex.org"
AUTHOR_ID_RE = re.compile(r"^A\d{4,14}$")
INSTITUTION_ID_RE = re.compile(r"^I\d{3,14}$")

AUTHOR_SELECT = "id,display_name,orcid,works_count,cited_by_count,summary_stats,last_known_institutions,topics,counts_by_year"
WORK_SELECT = "id,title,publication_year,cited_by_count,doi,primary_location,abstract_inverted_index,open_access"

SECOND_LEVEL_TLDS = {
    "ac.uk", "co.uk", "org.uk", "edu.au", "ac.jp", "co.jp", "ac.kr", "co.kr", "edu.cn", "ac.cn", "edu.sg",
    "ac.nz", "edu.hk", "edu.tw", "ac.il", "edu.br", "ac.in", "edu.in", "ac.za", "edu.tr", "edu.mx", "edu.co",
    "edu.ar", "edu.pk", "edu.eg", "edu.sa", "ac.id", "edu.my", "edu.ph", "edu.vn", "edu.pl", "ac.th", "ac.ir",
}


class OpenAlexError(Exception):
    """The scholarly data source could not be reached or refused the request."""


def short_id(url_or_id: str | None) -> str:
    return (url_or_id or "").rstrip("/").rsplit("/", 1)[-1]


def clean_query(q: str) -> str:
    """OpenAlex filters use , : | as syntax — strip them from free text."""
    return re.sub(r"\s+", " ", re.sub(r'[,:|"\\]', " ", q or "")).strip()[:120]


def registrable_domain(host: str) -> str | None:
    host = (host or "").lower().strip(".")
    if not host or "." not in host:
        return None
    parts = host.split(".")
    if len(parts) >= 3 and ".".join(parts[-2:]) in SECOND_LEVEL_TLDS:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def domain_from_homepage(url: str | None) -> str | None:
    if not url:
        return None
    try:
        return registrable_domain(urlparse(url if "//" in url else f"//{url}").hostname or "")
    except ValueError:
        return None


def abstract_from_index(inv: dict | None, max_chars: int = 1400) -> str | None:
    if not inv:
        return None
    words: list[tuple[int, str]] = []
    for word, positions in inv.items():
        for p in positions:
            words.append((p, word))
    text = " ".join(w for _, w in sorted(words))
    return text[:max_chars] if text else None


class _TTLCache:
    def __init__(self, max_items: int = 512):
        self._data: dict = {}
        self._max = max_items
        self._lock = threading.Lock()

    def get(self, key):
        with self._lock:
            item = self._data.get(key)
            if not item:
                return None
            expires, value = item
            if expires < time.monotonic():
                self._data.pop(key, None)
                return None
            return value

    def set(self, key, value, ttl: float):
        with self._lock:
            if len(self._data) >= self._max:
                now = time.monotonic()
                for k in [k for k, (exp, _) in self._data.items() if exp < now]:
                    self._data.pop(k, None)
                if len(self._data) >= self._max:
                    self._data.pop(next(iter(self._data)))
            self._data[key] = (time.monotonic() + ttl, value)

    def clear(self):
        with self._lock:
            self._data.clear()


class OpenAlexClient:
    def __init__(self, transport: httpx.BaseTransport | None = None):
        mailto = settings.openalex_mailto
        ua = f"Labora/1.0 (mailto:{mailto})" if mailto else "Labora/1.0"
        self._http = httpx.Client(
            base_url=BASE_URL,
            timeout=httpx.Timeout(20.0, connect=6.0),
            headers={"User-Agent": ua},
            transport=transport,
        )
        self.cache = _TTLCache()

    # ------------------------------------------------------------------ transport

    def _get(self, path: str, params: dict | None = None, ttl: float = 600) -> dict:
        params = dict(params or {})
        if settings.openalex_mailto:
            params.setdefault("mailto", settings.openalex_mailto)
        if settings.openalex_api_key:
            params.setdefault("api_key", settings.openalex_api_key)
        key = (path, tuple(sorted((k, str(v)) for k, v in params.items() if k not in ("mailto", "api_key"))))
        cached = self.cache.get(key)
        if cached is not None:
            return cached
        try:
            resp = self._http.get(path, params=params)
        except httpx.HTTPError as exc:
            raise OpenAlexError(f"network: {exc}") from exc
        if resp.status_code == 429:
            raise OpenAlexError("rate_limited")
        if resp.status_code == 404:
            raise OpenAlexError("not_found")
        if resp.status_code >= 400:
            raise OpenAlexError(f"http_{resp.status_code}")
        data = resp.json()
        self.cache.set(key, data, ttl)
        return data

    # ------------------------------------------------------------------ institutions

    def search_institutions(self, q: str, limit: int = 8) -> list[InstitutionOut]:
        q = clean_query(q)
        if len(q) < 2:
            return []
        select = "id,display_name,country_code,type,homepage_url,works_count"
        data = self._get(
            "/institutions",
            {"search": q, "filter": "type:education", "per-page": limit, "select": select},
            ttl=86400,
        )
        rows = data.get("results", [])
        if not rows:  # research institutes, hospitals, etc.
            rows = self._get("/institutions", {"search": q, "per-page": limit, "select": select}, ttl=86400).get(
                "results", []
            )
        return [self._institution(r) for r in rows]

    def get_institution(self, inst_id: str) -> InstitutionOut | None:
        if not INSTITUTION_ID_RE.match(inst_id):
            return None
        try:
            r = self._get(
                f"/institutions/{inst_id}",
                {"select": "id,display_name,country_code,type,homepage_url,works_count"},
                ttl=86400,
            )
        except OpenAlexError:
            return None
        return self._institution(r)

    @staticmethod
    def _institution(r: dict) -> InstitutionOut:
        return InstitutionOut(
            id=short_id(r.get("id")),
            name=r.get("display_name") or "",
            country=r.get("country_code"),
            type=r.get("type"),
            homepage=r.get("homepage_url"),
            works_count=r.get("works_count"),
            domain=domain_from_homepage(r.get("homepage_url")),
        )

    def resolve_institution(self, text: str) -> InstitutionOut | None:
        found = self.search_institutions(text, limit=1)
        return found[0] if found else None

    # ------------------------------------------------------------------ professors

    def _author_cards(self, ids: list[str]) -> dict[str, dict]:
        """Fetch raw author records for many ids (chunked)."""
        out: dict[str, dict] = {}
        chunks = [ids[i : i + 50] for i in range(0, len(ids), 50)]

        def fetch(chunk: list[str]) -> list[dict]:
            data = self._get(
                "/authors",
                {"filter": "openalex:" + "|".join(chunk), "per-page": len(chunk), "select": AUTHOR_SELECT},
                ttl=3600,
            )
            return data.get("results", [])

        with ThreadPoolExecutor(max_workers=4) as pool:
            for rows in pool.map(fetch, chunks):
                for row in rows:
                    out[short_id(row.get("id"))] = row
        return out

    @staticmethod
    def _card(row: dict, works_in_topic: int | None = None) -> ProfessorCard:
        stats = row.get("summary_stats") or {}
        insts = row.get("last_known_institutions") or []
        inst = insts[0] if insts else None
        this_year = datetime.now(timezone.utc).year
        recent = sum(c.get("works_count", 0) for c in row.get("counts_by_year", []) if c.get("year", 0) >= this_year - 2)
        topics = [t.get("display_name") for t in (row.get("topics") or [])[:4] if t.get("display_name")]
        return ProfessorCard(
            id=short_id(row.get("id")),
            name=row.get("display_name") or "",
            institution=InstitutionMini(
                id=short_id(inst.get("id")), name=inst.get("display_name") or "", country=inst.get("country_code")
            )
            if inst
            else None,
            h_index=int(stats.get("h_index") or 0),
            works_count=int(row.get("works_count") or 0),
            cited_by_count=int(row.get("cited_by_count") or 0),
            works_in_topic=works_in_topic,
            recent_works=recent,
            topics=topics,
            orcid=row.get("orcid"),
        )

    @staticmethod
    def _in_institution(row: dict, inst_id: str) -> bool:
        for inst in row.get("last_known_institutions") or []:
            if inst_id in {short_id(x) for x in (inst.get("lineage") or [])} or short_id(inst.get("id")) == inst_id:
                return True
        return False

    def authors_for_topic(
        self,
        query: str,
        institution_id: str | None = None,
        since_year: int | None = None,
        max_authors: int = 60,
        min_works: int = 3,
    ) -> list[ProfessorCard]:
        """Researchers actively publishing on ``query`` (optionally at one institution), best match first."""
        q = clean_query(query)
        if not q:
            return []
        since_year = since_year or datetime.now(timezone.utc).year - 5
        counts: dict[str, int] = {}

        def run(search: str) -> None:
            flt = f"title_and_abstract.search:{search},from_publication_date:{since_year}-01-01"
            if institution_id:
                flt += f",authorships.institutions.lineage:{institution_id}"
            data = self._get(
                "/works", {"filter": flt, "group_by": "authorships.author.id", "per-page": 120}, ttl=900
            )
            for g in data.get("group_by", []):
                aid = short_id(g.get("key"))
                if aid and aid != "null":
                    counts[aid] = max(counts.get(aid, 0), int(g.get("count", 0)))

        run(f'"{q}"' if " " in q else q)
        if len(counts) < 15 and " " in q:  # phrase was too strict — loosen to all-words-anywhere
            run(q)
        if not counts:
            return []

        top_ids = [a for a, _ in sorted(counts.items(), key=lambda kv: -kv[1])[: max_authors + 40]]
        rows = self._author_cards(top_ids)
        inst = self.get_institution(institution_id) if institution_id else None
        cards: list[ProfessorCard] = []
        for aid in top_ids:
            row = rows.get(aid)
            if not row or int(row.get("works_count") or 0) < min_works:
                continue
            if institution_id and not self._in_institution(row, institution_id):
                continue  # published there once, works elsewhere now
            card = self._card(row, works_in_topic=counts[aid])
            if inst:  # show the university that was searched, not a sub-institute or a second affiliation
                card.institution = InstitutionMini(id=inst.id, name=inst.name, country=inst.country)
            cards.append(card)
        cards.sort(key=lambda c: -(c.works_in_topic or 0) * (1 + 0.25 * math.log10(1 + c.h_index)))
        return cards[:max_authors]

    def authors_by_name(self, name: str, institution_id: str | None = None, limit: int = 25) -> list[ProfessorCard]:
        q = clean_query(name)
        if len(q) < 2:
            return []
        params: dict = {"search": q, "per-page": limit, "select": AUTHOR_SELECT}
        if institution_id:
            params["filter"] = f"last_known_institutions.lineage:{institution_id}"
        rows = self._get("/authors", params, ttl=600).get("results", [])
        return [self._card(r) for r in rows if int(r.get("works_count") or 0) >= 1]

    # ------------------------------------------------------------------ one professor

    def _works(self, author_id: str, sort: str, limit: int, since_year: int | None = None) -> list[WorkOut]:
        flt = f"author.id:{author_id}"
        if since_year:
            flt += f",from_publication_date:{since_year}-01-01"
        data = self._get(
            "/works", {"filter": flt, "sort": sort, "per-page": limit, "select": WORK_SELECT}, ttl=3600
        )
        works: list[WorkOut] = []
        for w in data.get("results", []):
            loc = w.get("primary_location") or {}
            src = loc.get("source") or {}
            title = w.get("title")
            if not title:
                continue
            works.append(
                WorkOut(
                    id=short_id(w.get("id")),
                    title=title,
                    year=w.get("publication_year"),
                    cited_by=int(w.get("cited_by_count") or 0),
                    doi_url=w.get("doi") or loc.get("landing_page_url"),
                    venue=src.get("display_name"),
                    is_oa=bool((w.get("open_access") or {}).get("is_oa")),
                    abstract=abstract_from_index(w.get("abstract_inverted_index")),
                )
            )
        return works

    def get_author(self, author_id: str) -> ProfessorDetail:
        if not AUTHOR_ID_RE.match(author_id):
            raise OpenAlexError("not_found")
        with ThreadPoolExecutor(max_workers=3) as pool:
            f_author = pool.submit(self._get, f"/authors/{author_id}", {"select": AUTHOR_SELECT}, 3600)
            f_recent = pool.submit(self._works, author_id, "publication_date:desc", 8)
            f_top = pool.submit(self._works, author_id, "cited_by_count:desc", 5)
            row = f_author.result()
            recent, top = f_recent.result(), f_top.result()
        card = self._card(row)
        stats = row.get("summary_stats") or {}
        return ProfessorDetail(
            **card.model_dump(),
            topics_detail=[
                TopicOut(
                    name=t.get("display_name", ""),
                    count=t.get("count"),
                    field=((t.get("field") or {}).get("display_name")),
                )
                for t in (row.get("topics") or [])[:8]
            ],
            affiliations=[
                InstitutionMini(id=short_id(i.get("id")), name=i.get("display_name") or "", country=i.get("country_code"))
                for i in (row.get("last_known_institutions") or [])
            ],
            recent_works_list=recent,
            top_works=top,
            counts_by_year=[
                YearCount(year=c["year"], works=int(c.get("works_count", 0)), cited=int(c.get("cited_by_count", 0)))
                for c in sorted(row.get("counts_by_year", []), key=lambda c: c["year"])
            ],
            openalex_url=f"https://openalex.org/{author_id}",
            two_year_mean_citedness=stats.get("2yr_mean_citedness"),
            i10_index=stats.get("i10_index"),
        )

    def institution_domain_for_author(self, author_id: str) -> tuple[str | None, str | None]:
        """(domain, institution name) for the author's current primary institution."""
        try:
            row = self._get(f"/authors/{author_id}", {"select": "last_known_institutions"}, ttl=3600)
        except OpenAlexError:
            return None, None
        insts = row.get("last_known_institutions") or []
        if not insts:
            return None, None
        inst = self.get_institution(short_id(insts[0].get("id")))
        return (inst.domain if inst else None), (inst.name if inst else insts[0].get("display_name"))

    # ------------------------------------------------------------------ platform stats

    def platform_stats(self) -> dict[str, int | None]:
        def count(path: str) -> int | None:
            try:
                return int(self._get(path, {"per-page": 1, "select": "id"}, ttl=86400)["meta"]["count"])
            except Exception:
                return None

        with ThreadPoolExecutor(max_workers=3) as pool:
            w, i, a = pool.map(count, ["/works", "/institutions", "/authors"])
        return {"works": w, "institutions": i, "authors": a}


openalex = OpenAlexClient()
