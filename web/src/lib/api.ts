const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "labora_token";

// ------------------------------------------------------------------------------------------- types

export type Role = "professor" | "student";
export type Compensation = "paid" | "credit" | "volunteer";
export type Term = "fall" | "spring" | "summer" | "year_round" | "flexible";
export type LocationType = "on_site" | "remote" | "hybrid";
export type MaterialKind = "paper" | "dataset" | "poster" | "other";
export type AppStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type OutreachStatus = "saved" | "drafted" | "sent" | "replied" | "meeting" | "positive" | "no_reply" | "declined";
export type PlanId = "free" | "weekly" | "semester" | "lifetime";

export interface WorkStyle {
  autonomy?: number | null;
  collaboration?: number | null;
  pace?: number | null;
  structure?: number | null;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  email_verified: boolean;
  verified: boolean;
  is_admin: boolean;
  locale: string;
  referral_code: string;
  plan: PlanId;
  is_pro: boolean;
  pro_until: string | null;
  created_at: string;
}
export interface UserMini {
  id: number;
  full_name: string;
}

export interface LabInput {
  name: string;
  university: string;
  department: string;
  website: string | null;
  bio: string | null;
  keywords: string | null;
  culture: string | null;
  team_size: number | null;
  work_style: WorkStyle | null;
  openalex_author_id: string | null;
}
export interface Lab extends LabInput {
  id: number;
  owner_id: number;
  owner_name: string;
  owner_verified: boolean;
}

export interface PositionInput {
  title: string;
  description: string;
  requirements: string | null;
  required_skills: string | null;
  keywords: string | null;
  compensation: Compensation;
  hours_per_week: number | null;
  term: Term | null;
  location_type: LocationType | null;
  slots: number | null;
  deadline: string | null;
}
export interface Position extends PositionInput {
  id: number;
  lab_id: number;
  status: "open" | "closed";
  created_at: string;
  lab: Lab;
}
export interface MyPosition extends Position {
  applicant_count: number;
}

export interface MaterialInput {
  title: string;
  description: string | null;
  kind: MaterialKind;
  url: string;
}
export interface Material extends MaterialInput {
  id: number;
  lab_id: number;
  created_at: string;
}

export interface StudentProfile {
  user_id?: number;
  university: string | null;
  major: string | null;
  year: string | null;
  bio: string | null;
  skills: string | null;
  interests: string | null;
  experience: string | null;
  resume_url: string | null;
  website_url: string | null;
  github_url: string | null;
  availability_hours: number | null;
  work_style: WorkStyle | null;
  discoverable: boolean;
}

export interface Application {
  id: number;
  position_id: number;
  student_id: number;
  message: string;
  status: AppStatus;
  invited: boolean;
  created_at: string;
  decided_at: string | null;
}
export interface MyApplication extends Application {
  position: Position;
}
export interface Applicant extends Application {
  student: User;
  profile: StudentProfile | null;
}

export interface Invitation {
  id: number;
  position_id: number;
  message: string;
  match_score: number | null;
  status: "pending" | "accepted" | "declined" | "withdrawn";
  created_at: string;
  responded_at: string | null;
  position: Position;
  professor: UserMini;
  student: UserMini;
}

// ---- discovery
export interface QuotaInfo {
  feature: string;
  used: number;
  limit: number | null;
  is_pro: boolean;
}
export interface InstitutionMini {
  id: string;
  name: string;
  country: string | null;
}
export interface Institution extends InstitutionMini {
  type: string | null;
  homepage: string | null;
  works_count: number | null;
  domain: string | null;
}
export interface ProfessorCard {
  id: string;
  name: string;
  institution: InstitutionMini | null;
  h_index: number;
  works_count: number;
  cited_by_count: number;
  works_in_topic: number | null;
  recent_works: number;
  topics: string[];
  orcid: string | null;
  on_platform_lab_id: number | null;
}
export interface ProfessorSearch {
  items: ProfessorCard[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  institution: Institution | null;
  query: string;
  mode: string;
}
export interface Work {
  id: string;
  title: string;
  year: number | null;
  cited_by: number;
  doi_url: string | null;
  venue: string | null;
  is_oa: boolean;
  abstract: string | null;
}
export interface ProfessorDetail extends ProfessorCard {
  topics_detail: { name: string; count: number | null; field: string | null }[];
  affiliations: InstitutionMini[];
  recent_works_list: Work[];
  top_works: Work[];
  counts_by_year: { year: number; works: number; cited: number }[];
  openalex_url: string | null;
  two_year_mean_citedness: number | null;
  i10_index: number | null;
}
export interface ProfessorSummary {
  overview: string;
  key_finding: string;
  key_finding_source: string;
  topics_plain: string[];
  good_fit_if: string[];
  conversation_starters: string[];
  source: "ai" | "extractive";
  lang: string;
}
export interface Responsiveness {
  level: "high" | "medium" | "low" | "unknown";
  sample_size: number;
  reply_rate: number | null;
  median_reply_days: number | null;
}
export interface ProfessorContact {
  locked: boolean;
  domain: string | null;
  candidates: { address: string; pattern: string; confidence: number }[];
  hidden_count: number;
  responsiveness: Responsiveness | null;
  directory_search_url: string | null;
  on_platform_lab_id: number | null;
  lab_response_days: number | null;
}

// ---- tools
export interface Flag {
  id: string;
  code: string;
  category: string;
  severity: "high" | "medium" | "low";
  quote: string | null;
  start: number | null;
  end: number | null;
  advice: string | null;
  source: "rule" | "ai";
}
export interface EmailCheck {
  score: number;
  grade: "excellent" | "good" | "needs_work" | "risky";
  word_count: number;
  flags: Flag[];
  strengths: { code: string; text: string | null }[];
  ai_summary: string | null;
  sounds_generic: number | null;
  ai_used: boolean;
  english_checks: boolean;
  quota: QuotaInfo;
}
export interface FollowUp {
  items: { day_offset: number; send_on: string; subject: string; body: string; note: string | null }[];
  ai_used: boolean;
  quota: QuotaInfo;
}

// ---- matching
export interface MatchReason {
  code: string;
  items: string[];
  text: string | null;
}
export interface ProfileStrength {
  score: number;
  missing: string[];
}
export interface PositionMatch {
  position: Position;
  score: number;
  breakdown: Record<string, number>;
  reasons: MatchReason[];
  gaps: MatchReason[];
  tip: string | null;
}
export interface MatchPositions {
  items: PositionMatch[];
  ai_used: boolean;
  strength: ProfileStrength;
  quota: QuotaInfo;
}
export interface ProfessorMatch {
  professor: ProfessorCard;
  score: number;
  reasons: MatchReason[];
  gaps: MatchReason[];
  matched_keywords: string[];
  tip: string | null;
}
export interface MatchProfessors {
  items: ProfessorMatch[];
  keywords_used: string[];
  ai_used: boolean;
  strength: ProfileStrength;
  quota: QuotaInfo;
}
export interface Persona {
  headline: string;
  summary: string;
  must_have: string[];
  nice_to_have: string[];
  traits: string[];
  keywords: string[];
  work_style: WorkStyle | null;
}
export interface StudentCandidate {
  user_id: number;
  full_name: string;
  university: string | null;
  major: string | null;
  year: string | null;
  bio: string | null;
  skills: string[];
  interests: string | null;
  experience: string | null;
  availability_hours: number | null;
  work_style: WorkStyle | null;
  github_url: string | null;
  website_url: string | null;
  score: number;
  breakdown: Record<string, number>;
  reasons: MatchReason[];
  gaps: MatchReason[];
  tip: string | null;
  invited: boolean;
}
export interface MatchStudents {
  persona: Persona;
  items: StudentCandidate[];
  ai_used: boolean;
  pool_size: number;
  searches_left_today: number | null;
}

// ---- workspace, billing, community
export interface Bookmark {
  id: number;
  kind: "professor" | "position" | "lab";
  ref: string;
  snapshot: Record<string, unknown> | null;
  created_at: string;
}
export interface OutreachEntry {
  id: number;
  openalex_id: string;
  professor_name: string;
  institution: string | null;
  status: OutreachStatus;
  sent_on: string | null;
  replied_on: string | null;
  follow_up_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface Plan {
  id: PlanId;
  price_cents: number;
  currency: string;
  duration_days: number | null;
  features: string[];
  highlighted: boolean;
}
export interface Billing {
  plan: PlanId;
  is_pro: boolean;
  pro_until: string | null;
  usage: { feature: string; used: number; limit: number | null }[];
  checkout_mode: "stripe" | "dev" | "disabled";
  referral_code: string;
  referrals_redeemed: number;
  referral_reward_days: number;
}
export interface FeedbackPost {
  id: number;
  kind: "feature" | "bug" | "general";
  title: string;
  body: string;
  votes: number;
  status: "open" | "planned" | "in_progress" | "done";
  created_at: string;
  author_name: string;
  voted: boolean;
  mine: boolean;
}
export interface SiteStats {
  open_positions: number;
  labs: number;
  universities: number;
  works_indexed: number | null;
  institutions_indexed: number | null;
  researchers_indexed: number | null;
  ai_enabled: boolean;
}
export interface AdminOverview {
  users: number;
  students: number;
  professors: number;
  pending_professors: number;
  labs: number;
  open_positions: number;
  applications: number;
  invitations: number;
  feedback: number;
  waitlist: number;
  paid_users: number;
}
export interface AdminProfessor {
  id: number;
  full_name: string;
  email: string;
  verified: boolean;
  created_at: string;
  lab_name: string | null;
  university: string | null;
  website: string | null;
}

export interface PositionQuery {
  q?: string;
  university?: string;
  department?: string;
  compensation?: string;
  location_type?: string;
  term?: string;
  limit?: number;
  offset?: number;
}

// ------------------------------------------------------------------------------------------- transport

export class ApiError extends Error {
  constructor(
    public status: number,
    /** Stable machine code from the API (translated in the UI); "network" / "unknown" are client-side. */
    public code: string,
    message: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => window.localStorage.setItem(TOKEN_KEY, t),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};

function parseError(status: number, data: unknown): ApiError {
  const detail = (data as { detail?: unknown } | null)?.detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail) && "code" in detail) {
    const { code, message, ...extra } = detail as { code: string; message?: string } & Record<string, unknown>;
    return new ApiError(status, code, message ?? code, extra);
  }
  if (Array.isArray(detail)) {
    const msg = detail
      .map((d: { loc?: unknown[]; msg?: string }) => {
        const field = Array.isArray(d.loc) ? String(d.loc[d.loc.length - 1]) : "";
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .join(", ");
    return new ApiError(status, "validation", msg);
  }
  return new ApiError(status, typeof detail === "string" ? "unknown" : "unknown", typeof detail === "string" ? detail : "Request failed");
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; form?: Record<string, string>; signal?: AbortSignal } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(opts.form);
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method: opts.method ?? "GET", headers, body, signal: opts.signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError(0, "network", "Can't reach the server.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw parseError(res.status, data);
  return data as T;
}

function qs(params: object): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const post = <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ?? {} });

export const api = {
  stats: () => request<SiteStats>("/meta/stats"),

  // auth
  register: (b: { email: string; password: string; full_name: string; role: Role; locale?: string; referral_code?: string }) =>
    post<User>("/auth/register", b),
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", { method: "POST", form: { username: email, password } }),
  me: () => request<User>("/auth/me"),
  updateMe: (b: { full_name?: string; locale?: string }) => request<User>("/auth/me", { method: "PATCH", body: b }),
  changePassword: (current_password: string, new_password: string) =>
    post<{ ok: boolean }>("/auth/change-password", { current_password, new_password }),
  deleteAccount: (password: string) => post<{ ok: boolean }>("/auth/delete-account", { password }),

  // positions & labs
  positions: (q: PositionQuery = {}) => request<Position[]>(`/positions${qs(q)}`),
  position: (id: number | string) => request<Position>(`/positions/${id}`),
  myPositions: () => request<MyPosition[]>("/positions/mine"),
  createPosition: (b: PositionInput) => post<Position>("/positions", b),
  updatePosition: (id: number | string, b: PositionInput) => request<Position>(`/positions/${id}`, { method: "PUT", body: b }),
  closePosition: (id: number) => post<Position>(`/positions/${id}/close`),
  reopenPosition: (id: number) => post<Position>(`/positions/${id}/reopen`),
  deletePosition: (id: number) => request<void>(`/positions/${id}`, { method: "DELETE" }),
  applicants: (id: number | string) => request<Applicant[]>(`/positions/${id}/applicants`),
  lab: (id: number | string) => request<Lab>(`/labs/${id}`),
  labMaterials: (id: number | string) => request<Material[]>(`/labs/${id}/materials`),
  labPositions: (id: number | string) => request<Position[]>(`/labs/${id}/positions`),
  myLab: () => request<Lab>("/labs/mine"),
  createLab: (b: LabInput) => post<Lab>("/labs", b),
  updateLab: (b: LabInput) => request<Lab>("/labs/mine", { method: "PUT", body: b }),
  addMaterial: (b: MaterialInput) => post<Material>("/labs/mine/materials", b),
  deleteMaterial: (id: number) => request<void>(`/labs/mine/materials/${id}`, { method: "DELETE" }),

  // students & applications
  studentProfile: () => request<StudentProfile>("/students/me"),
  updateStudentProfile: (b: StudentProfile) => request<StudentProfile>("/students/me", { method: "PUT", body: b }),
  profileStrength: () => request<ProfileStrength>("/students/me/strength"),
  apply: (positionId: number, message: string) => post<Application>(`/positions/${positionId}/apply`, { message }),
  myApplications: () => request<MyApplication[]>("/applications/mine"),
  withdraw: (id: number) => post<Application>(`/applications/${id}/withdraw`),
  decide: (id: number, status: "accepted" | "rejected") =>
    request<Application>(`/applications/${id}/status`, { method: "PUT", body: { status } }),

  // discovery
  institutions: (q: string, signal?: AbortSignal) => request<Institution[]>(`/discover/institutions${qs({ q })}`, { signal }),
  searchProfessors: (p: { q: string; mode?: string; institution_id?: string; university?: string; sort?: string; min_h?: number; page?: number }, signal?: AbortSignal) =>
    request<ProfessorSearch>(`/discover/professors${qs(p)}`, { signal }),
  professor: (id: string) => request<ProfessorDetail>(`/discover/professors/${id}`),
  professorSummary: (id: string, lang: string) =>
    post<{ summary: ProfessorSummary; quota: QuotaInfo }>(`/discover/professors/${id}/summary`, { lang }),
  professorContact: (id: string) => request<ProfessorContact>(`/discover/professors/${id}/contact`),

  // tools
  checkEmail: (b: { subject: string; body: string; professor_id?: string; professor_name?: string; lang: string }) =>
    post<EmailCheck>("/tools/email-check", b),
  followUp: (b: { email: string; sent_on: string; subject?: string; professor_name?: string; lang: string }) =>
    post<FollowUp>("/tools/follow-up", b),

  // matching
  matchPositions: (lang: string, limit = 10) => post<MatchPositions>("/match/student/positions", { lang, limit }),
  matchProfessors: (b: { lang: string; query?: string; institution_id?: string; limit?: number }) =>
    post<MatchProfessors>("/match/student/professors", b),
  buildPersona: (b: { position_id?: number | null; text?: string; lang: string }) =>
    post<{ persona: Persona; ai_used: boolean }>("/match/professor/persona", b),
  matchStudents: (b: { position_id?: number | null; persona: Persona; lang: string; limit?: number }) =>
    post<MatchStudents>("/match/professor/students", b),

  // invitations
  invite: (b: { student_id: number; position_id: number; message: string; match_score?: number }) =>
    post<Invitation>("/invitations", b),
  sentInvitations: () => request<Invitation[]>("/invitations/sent"),
  myInvitations: () => request<Invitation[]>("/invitations/mine"),
  respondInvitation: (id: number, action: "accept" | "decline", message?: string) =>
    post<Invitation>(`/invitations/${id}/respond`, { action, message }),
  withdrawInvitation: (id: number) => post<Invitation>(`/invitations/${id}/withdraw`),

  // workspace
  bookmarks: (kind?: string) => request<Bookmark[]>(`/bookmarks${qs({ kind })}`),
  addBookmark: (b: { kind: string; ref: string; snapshot?: Record<string, unknown> }) => post<Bookmark>("/bookmarks", b),
  removeBookmark: (kind: string, ref: string) => request<{ ok: boolean }>(`/bookmarks/${kind}/${encodeURIComponent(ref)}`, { method: "DELETE" }),
  outreach: () => request<OutreachEntry[]>("/outreach"),
  saveOutreach: (b: { openalex_id: string; professor_name: string; institution?: string | null; status?: OutreachStatus }) =>
    post<OutreachEntry>("/outreach", b),
  patchOutreach: (id: number, b: Partial<Pick<OutreachEntry, "status" | "sent_on" | "replied_on" | "follow_up_on" | "notes">>) =>
    request<OutreachEntry>(`/outreach/${id}`, { method: "PATCH", body: b }),
  deleteOutreach: (id: number) => request<{ ok: boolean }>(`/outreach/${id}`, { method: "DELETE" }),

  // billing & referrals
  plans: () => request<Plan[]>("/billing/plans"),
  billing: () => request<Billing>("/billing/me"),
  checkout: (plan: string, locale: string) => post<{ url: string | null; activated: boolean }>("/billing/checkout", { plan, locale }),
  redeem: (code: string) => post<{ reward_days: number; pro_until: string | null }>("/referrals/redeem", { code }),

  // community
  feedback: (p: { sort?: string; kind?: string } = {}) => request<FeedbackPost[]>(`/feedback${qs(p)}`),
  postFeedback: (b: { kind: string; title: string; body: string }) => post<FeedbackPost>("/feedback", b),
  voteFeedback: (id: number) => post<FeedbackPost>(`/feedback/${id}/vote`),
  contact: (b: { name: string; email: string; message: string }) => post<{ ok: boolean }>("/contact", b),
  joinWaitlist: (email: string, locale: string, feature = "guaranteed_response") =>
    post<{ ok: boolean }>("/waitlist", { email, locale, feature }),

  // admin
  adminOverview: () => request<AdminOverview>("/admin/overview"),
  adminProfessors: (pending = false) => request<AdminProfessor[]>(`/admin/professors${qs({ pending: pending || undefined })}`),
  adminVerify: (id: number, verified: boolean) => post<AdminProfessor>(`/admin/professors/${id}/verify`, { verified }),
  adminWaitlist: () => request<{ id: number; email: string; feature: string; locale: string; created_at: string }[]>("/admin/waitlist"),
  adminContact: () => request<{ id: number; name: string; email: string; message: string; created_at: string }[]>("/admin/contact"),
  adminFeedbackStatus: (id: number, status: string) => request<FeedbackPost>(`/admin/feedback/${id}`, { method: "PATCH", body: { status } }),
};
