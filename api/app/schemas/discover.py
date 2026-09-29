from datetime import date, datetime

from pydantic import BaseModel, Field


class QuotaInfo(BaseModel):
    feature: str
    used: int
    limit: int | None  # None = unlimited
    is_pro: bool


class InstitutionOut(BaseModel):
    id: str
    name: str
    country: str | None = None
    type: str | None = None
    homepage: str | None = None
    works_count: int | None = None
    domain: str | None = None


class InstitutionMini(BaseModel):
    id: str
    name: str
    country: str | None = None


class TopicOut(BaseModel):
    name: str
    count: int | None = None
    field: str | None = None


class ProfessorCard(BaseModel):
    id: str
    name: str
    institution: InstitutionMini | None = None
    h_index: int = 0
    works_count: int = 0
    cited_by_count: int = 0
    works_in_topic: int | None = None
    recent_works: int = 0  # works in the last three years
    topics: list[str] = []
    orcid: str | None = None
    on_platform_lab_id: int | None = None  # this researcher also runs a lab on Labora


class ProfessorSearchOut(BaseModel):
    items: list[ProfessorCard]
    total: int
    page: int
    page_size: int
    has_more: bool
    institution: InstitutionOut | None = None
    query: str = ""
    mode: str = "interest"


class WorkOut(BaseModel):
    id: str
    title: str
    year: int | None = None
    cited_by: int = 0
    doi_url: str | None = None
    venue: str | None = None
    is_oa: bool = False
    abstract: str | None = None


class YearCount(BaseModel):
    year: int
    works: int
    cited: int


class ProfessorDetail(ProfessorCard):
    topics_detail: list[TopicOut] = []
    affiliations: list[InstitutionMini] = []
    recent_works_list: list[WorkOut] = []
    top_works: list[WorkOut] = []
    counts_by_year: list[YearCount] = []
    openalex_url: str | None = None
    two_year_mean_citedness: float | None = None
    i10_index: int | None = None


class SummaryContent(BaseModel):
    overview: str = ""
    key_finding: str = ""
    key_finding_source: str = ""
    topics_plain: list[str] = []
    good_fit_if: list[str] = []
    conversation_starters: list[str] = []


class SummaryOut(SummaryContent):
    source: str  # ai | extractive
    lang: str
    generated_at: datetime | None = None


class SummaryRequest(BaseModel):
    lang: str = Field(default="en", max_length=10)


class SummaryResponse(BaseModel):
    summary: SummaryOut
    quota: QuotaInfo


class EmailCandidate(BaseModel):
    address: str
    pattern: str
    confidence: int  # 0-100, how common this pattern is — NOT a verification


class ResponsivenessOut(BaseModel):
    level: str  # high | medium | low | unknown
    sample_size: int = 0
    reply_rate: float | None = None
    median_reply_days: float | None = None


class ContactOut(BaseModel):
    locked: bool
    domain: str | None = None
    candidates: list[EmailCandidate] = []
    hidden_count: int = 0
    responsiveness: ResponsivenessOut | None = None
    directory_search_url: str | None = None
    on_platform_lab_id: int | None = None
    lab_response_days: float | None = None  # from real applications on Labora


class FollowUpDates(BaseModel):
    send_on: date
