"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  Lock,
  Mail,
  PenLine,
  Search,
  Sparkles,
  TriangleAlert,
  Unlock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ActivityChart } from "@/components/professor/activity-chart";
import { SaveButton } from "@/components/professor/professor-card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/form";
import { Container } from "@/components/ui/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { Alert, Avatar, Badge, Card, Chip, EmptyState, Progress, Skeleton } from "@/components/ui/surface";
import {
  api,
  ApiError,
  type OutreachEntry,
  type OutreachStatus,
  type ProfessorContact,
  type ProfessorDetail,
  type ProfessorSummary,
  type QuotaInfo,
  type Work,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useApi, useErrorText } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { useLabels } from "@/lib/labels";

const UNLOCK_KEY = "labora_unlocked_summaries";
const OUTREACH_STATUSES: OutreachStatus[] = ["saved", "drafted", "sent", "replied", "meeting", "positive", "no_reply", "declined"];

function readUnlocked(): string[] {
  try {
    return JSON.parse(localStorage.getItem(UNLOCK_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function ProfessorView({ id }: { id: string }) {
  const { t, fmt } = useI18n();
  const { user } = useAuth();
  const detail = useApi(`prof-${id}`, () => api.professor(id));
  const p = detail.data;

  if (detail.error) {
    return (
      <Container className="py-24">
        <EmptyState
          icon={<Search />}
          title={t("professor.notFoundTitle")}
          action={
            <Button asChild variant="secondary">
              <Link href="/discover">{t("professor.back")}</Link>
            </Button>
          }
        >
          {t("professor.notFoundBody")}
        </EmptyState>
      </Container>
    );
  }
  if (!p) {
    return (
      <Container className="space-y-6 py-14">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </Container>
    );
  }

  const stats: [string, string][] = [
    [t("professor.stats.hIndex"), fmt.number(p.h_index)],
    [t("professor.stats.papers"), fmt.compact(p.works_count)],
    [t("professor.stats.citations"), fmt.compact(p.cited_by_count)],
    [t("professor.stats.recent"), fmt.number(p.recent_works)],
    ...(p.i10_index != null ? ([[t("professor.stats.i10"), fmt.number(p.i10_index)]] as [string, string][]) : []),
  ];
  const years = p.counts_by_year.slice(-10);

  return (
    <Container className="py-8 sm:py-12">
      <Link href="/discover" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("professor.back")}
      </Link>

      {/* header */}
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={p.name} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="display text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">{p.name}</h1>
              {p.on_platform_lab_id && (
                <Link href={`/labs/${p.on_platform_lab_id}`} className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-3 py-1 text-xs font-medium text-good-text hover:opacity-80">
                  ● {t("professor.onLabora")} →
                </Link>
              )}
            </div>
            {p.institution && (
              <p className="mt-1.5 text-base text-muted">
                {p.institution.name}
                {p.institution.country && <span className="text-faint"> · {fmt.country(p.institution.country)}</span>}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
              {p.orcid && (
                <a href={p.orcid} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-text hover:underline">
                  {t("professor.orcid")} <ExternalLink className="size-3" />
                </a>
              )}
              {p.openalex_url && (
                <a href={p.openalex_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-text hover:underline">
                  {t("professor.openalex")} <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
          <SaveButton p={p} className="size-10 [&_svg]:size-5" />
        </div>
        <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-5">
          {stats.map(([label, value]) => (
            <div key={label} className="bg-surface px-4 py-4 text-center">
              <dd className="text-2xl font-semibold tracking-tight tabular-nums text-ink">{value}</dd>
              <dt className="mt-0.5 text-xs text-faint">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">
                <Sparkles /> {t("professor.tabs.overview")}
              </TabsTrigger>
              <TabsTrigger value="papers">
                <FileText /> {t("professor.tabs.papers")}
              </TabsTrigger>
              <TabsTrigger value="contact">
                <Mail /> {t("professor.tabs.contact")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <SummaryCard id={id} user={user} />
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-ink">{t("professor.topics")}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.topics_detail.map((tp) => (
                      <Chip key={tp.name}>
                        {tp.name}
                        {tp.count ? <span className="ms-1.5 text-faint tabular-nums">{fmt.number(tp.count)}</span> : null}
                      </Chip>
                    ))}
                  </div>
                </Card>
                {years.length > 1 && (
                  <Card className="p-6">
                    <h3 className="text-sm font-semibold text-ink">{t("professor.activity")}</h3>
                    <ActivityChart data={years} className="mt-4" />
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="papers" className="space-y-8">
              <PaperList title={t("professor.papers.recent")} works={p.recent_works_list} />
              <PaperList title={t("professor.papers.top")} works={p.top_works} />
            </TabsContent>

            <TabsContent value="contact">
              <ContactTab id={id} user={user} />
            </TabsContent>
          </Tabs>
        </div>

        <Sidebar p={p} />
      </div>
    </Container>
  );
}

/* ------------------------------------------------------------------------------------------- summary */

function SummaryCard({ id, user }: { id: string; user: ReturnType<typeof useAuth>["user"] }) {
  const { t, locale } = useI18n();
  const errorText = useErrorText();
  const [summary, setSummary] = useState<ProfessorSummary | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ text: string; quota: boolean } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.professorSummary(id, locale);
      setSummary(r.summary);
      setQuota(r.quota);
      try {
        localStorage.setItem(UNLOCK_KEY, JSON.stringify([...new Set([...readUnlocked(), id])].slice(-200)));
      } catch {}
    } catch (e) {
      setError({ text: errorText(e), quota: e instanceof ApiError && e.code === "quota_exceeded" });
    } finally {
      setLoading(false);
    }
  };

  // Revisiting a researcher you've already unlocked is free, so load it automatically.
  useEffect(() => {
    if (!user || !readUnlocked().includes(id)) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, id, locale]);

  if (!user) {
    return (
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none space-y-3 opacity-60 blur-[3px] select-none">
          <div className="h-4 w-1/3 rounded bg-surface-3" />
          <div className="h-3 w-full rounded bg-surface-3" />
          <div className="h-3 w-11/12 rounded bg-surface-3" />
          <div className="h-16 w-full rounded-xl bg-accent-soft" />
        </div>
        <div className="absolute inset-0 grid place-items-center bg-surface/60 p-6 text-center backdrop-blur-[1px]">
          <div className="max-w-sm">
            <span className="mx-auto grid size-10 place-items-center rounded-xl bg-brand-soft text-brand-text">
              <Sparkles className="size-5" />
            </span>
            <h3 className="mt-3 text-base font-semibold text-ink">{t("professor.summary.signInTitle")}</h3>
            <p className="mt-1.5 text-sm text-muted">{t("professor.summary.signInBody")}</p>
            <Button asChild className="mt-4">
              <Link href={`/login?next=/professors/${id}`}>{t("nav.signIn")}</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="bg-gradient-to-br from-brand-soft/60 via-surface to-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-md">
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
              <Sparkles className="size-5 text-accent" /> {t("professor.summary.title")}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{loading ? t("professor.summary.loading") : t("professor.summary.ctaBody")}</p>
          </div>
          <Button variant="brand" size="lg" onClick={load} loading={loading}>
            {t("professor.summary.cta")}
          </Button>
        </div>
        {error &&
          (error.quota ? (
            <Alert tone="warning" title={t("professor.summary.limitTitle")} className="mt-5">
              {t("professor.summary.limitBody")}{" "}
              <Link href="/pricing" className="font-semibold underline">
                {t("professor.summary.upgrade")}
              </Link>
            </Alert>
          ) : (
            <Alert className="mt-5">{error.text}</Alert>
          ))}
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <Sparkles className="size-5 text-accent" /> {t("professor.summary.title")}
        </h3>
        <Badge tone={summary.source === "ai" ? "accent" : "neutral"}>
          {summary.source === "ai" ? t("professor.summary.aiBadge") : t("professor.summary.extractiveBadge")}
        </Badge>
      </div>

      <div className="space-y-6">
        {summary.overview && (
          <section>
            <h4 className="text-xs font-semibold tracking-wider text-faint uppercase">{t("professor.summary.overview")}</h4>
            <p className="mt-2 text-base leading-relaxed text-ink/90">{summary.overview}</p>
          </section>
        )}
        {summary.key_finding && (
          <section className="rounded-2xl border border-accent/30 bg-accent-soft/60 p-5">
            <h4 className="text-xs font-semibold tracking-wider text-accent-text uppercase">{t("professor.summary.keyFinding")}</h4>
            <p className="mt-2 leading-relaxed text-ink/90">{summary.key_finding}</p>
            {summary.key_finding_source && (
              <p className="mt-2 text-xs text-muted">{t("professor.summary.fromPaper", { title: summary.key_finding_source })}</p>
            )}
          </section>
        )}
        {summary.topics_plain.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold tracking-wider text-faint uppercase">{t("professor.summary.topics")}</h4>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {summary.topics_plain.map((x) => (
                <Chip key={x}>{x}</Chip>
              ))}
            </ul>
          </section>
        )}
        {summary.good_fit_if.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold tracking-wider text-faint uppercase">{t("professor.summary.goodFit")}</h4>
            <ul className="mt-2.5 space-y-2">
              {summary.good_fit_if.map((x) => (
                <li key={x} className="flex gap-2.5 text-[0.9375rem] text-ink/90">
                  <Check className="mt-1 size-4 shrink-0 text-good" /> {x}
                </li>
              ))}
            </ul>
          </section>
        )}
        {summary.conversation_starters.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold tracking-wider text-faint uppercase">{t("professor.summary.starters")}</h4>
            <ul className="mt-2.5 space-y-2">
              {summary.conversation_starters.map((x) => (
                <li key={x} className="flex gap-2.5 text-[0.9375rem] text-ink/90">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" /> {x}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-faint">{t("professor.summary.startersHint")}</p>
          </section>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-faint">
        <span>{summary.source === "ai" ? t("professor.summary.aiNote") : t("professor.summary.extractiveNote")}</span>
        {quota && (
          <span>
            {quota.limit == null ? t("professor.summary.quotaPro") : t("professor.summary.quota", { used: quota.used, limit: quota.limit })}
          </span>
        )}
      </div>
    </Card>
  );
}

/* --------------------------------------------------------------------------------------------- papers */

function PaperList({ title, works }: { title: string; works: Work[] }) {
  const { t, fmt } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      {works.length === 0 ? (
        <p className="text-sm text-muted">{t("professor.papers.empty")}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          {works.map((w) => (
            <li key={w.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium leading-snug text-ink">{w.title}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {w.year && <span className="tabular-nums">{w.year}</span>}
                    {w.venue && <span className="truncate">{w.venue}</span>}
                    <span>{t("professor.papers.cited", { n: fmt.number(w.cited_by) })}</span>
                    {w.is_oa && <Badge tone="good">{t("professor.papers.openAccess")}</Badge>}
                  </p>
                </div>
                {w.doi_url && (
                  <a
                    href={w.doi_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("professor.papers.viewPaper")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
              {w.abstract && (
                <>
                  <button
                    onClick={() => setOpenId(openId === w.id ? null : w.id)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-text hover:underline"
                    aria-expanded={openId === w.id}
                  >
                    {t("professor.papers.abstract")}
                    <ChevronDown className={cn("size-3.5 transition-transform", openId === w.id && "rotate-180")} />
                  </button>
                  {openId === w.id && <p className="mt-2 text-sm leading-relaxed text-muted">{w.abstract}</p>}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------------------------- contact */

function ContactTab({ id, user }: { id: string; user: ReturnType<typeof useAuth>["user"] }) {
  const { t, fmt } = useI18n();
  const errorText = useErrorText();
  const contact = useApi(user ? `contact-${id}-${user.is_pro}` : null, () => api.professorContact(id));
  const c = contact.data;

  if (!user) {
    return (
      <EmptyState
        icon={<Lock />}
        title={t("professor.contact.lockedTitle")}
        action={
          <Button asChild>
            <Link href={`/login?next=/professors/${id}`}>{t("nav.signIn")}</Link>
          </Button>
        }
      >
        {t("professor.contact.lockedBody")}
      </EmptyState>
    );
  }
  if (contact.error) return <Alert>{errorText(contact.error)}</Alert>;
  if (!c) return <Skeleton className="h-64 w-full" />;

  if (c.locked) return <LockedContact c={c} />;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Unlock className="size-4 text-good" /> {t("professor.contact.title")}
          </h3>
          {c.domain && <Badge dir="ltr">@{c.domain}</Badge>}
        </div>
        <Alert tone="warning" className="mt-4">
          {t("professor.contact.guessNote")}
        </Alert>
        {c.candidates.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t("professor.contact.noDomain")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
            {c.candidates.map((cand, i) => (
              <li key={cand.address} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink" dir="ltr">
                  {cand.address}
                </span>
                {i === 0 && <Badge tone="brand">{t("professor.contact.mostCommon")}</Badge>}
                <span className="text-xs text-faint" dir="ltr">
                  {t("professor.contact.pattern", { pattern: cand.pattern })}
                </span>
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label={t("professor.contact.copy")}
                  onClick={async () => {
                    await navigator.clipboard.writeText(cand.address);
                    toast.success(t("professor.contact.copied"));
                  }}
                >
                  <Copy />
                </Button>
                <Button asChild variant="ghost" size="iconSm" aria-label={t("professor.contact.compose")}>
                  <a href={`mailto:${cand.address}`}>
                    <Mail />
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        )}
        {c.directory_search_url && (
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <a href={c.directory_search_url} target="_blank" rel="noopener noreferrer">
              <Search /> {t("professor.contact.directory")}
            </a>
          </Button>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-ink">{t("professor.contact.responsiveness")}</h3>
        {c.responsiveness && (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <Badge
                tone={
                  c.responsiveness.level === "high" ? "good" : c.responsiveness.level === "medium" ? "warn" : c.responsiveness.level === "low" ? "bad" : "neutral"
                }
              >
                {t(`professor.contact.resp.${c.responsiveness.level}`)}
              </Badge>
            </div>
            {c.responsiveness.level === "unknown" ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">{t("professor.contact.respUnknown")}</p>
            ) : (
              <>
                <Progress value={(c.responsiveness.reply_rate ?? 0) * 100} className="mt-4" />
                <p className="mt-3 text-sm text-muted">
                  {t("professor.contact.respBody", {
                    n: c.responsiveness.sample_size,
                    rate: fmt.percent(c.responsiveness.reply_rate ?? 0),
                    days: c.responsiveness.median_reply_days != null ? t("professor.contact.respDays", { days: Math.round(c.responsiveness.median_reply_days) }) : "",
                  })}
                </p>
              </>
            )}
          </div>
        )}
        {c.lab_response_days != null && (
          <p className="mt-4 rounded-xl bg-good-soft px-4 py-3 text-sm text-good-text">
            {t("professor.contact.labDays", { days: c.lab_response_days })}
          </p>
        )}
        <Button asChild variant="soft" size="sm" className="mt-4">
          <Link href="/dashboard/outreach">{t("professor.contact.logOutreach")}</Link>
        </Button>
      </Card>
    </div>
  );
}

function LockedContact({ c }: { c: ProfessorContact }) {
  const { t } = useI18n();
  return (
    <Card className="relative overflow-hidden p-6">
      <div aria-hidden className="space-y-3 opacity-70 blur-[5px] select-none">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-line p-4">
            <span className="font-mono text-sm">{"•".repeat(9 + i)}@{c.domain ? "•".repeat(6) + ".edu" : "••••••.edu"}</span>
            <span className="text-xs">pattern</span>
          </div>
        ))}
        <div className="h-12 rounded-xl bg-surface-3" />
      </div>
      <div className="absolute inset-0 grid place-items-center bg-surface/70 p-6 text-center backdrop-blur-[2px]">
        <div className="max-w-sm">
          <span className="mx-auto grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-text">
            <Lock className="size-5" />
          </span>
          <h3 className="mt-3 text-base font-semibold text-ink">{t("professor.contact.lockedTitle")}</h3>
          <p className="mt-1.5 text-sm text-muted">{t("professor.contact.lockedBody")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button asChild variant="brand">
              <Link href="/pricing">{t("professor.contact.seePlans")}</Link>
            </Button>
            {c.directory_search_url && (
              <Button asChild variant="secondary">
                <a href={c.directory_search_url} target="_blank" rel="noopener noreferrer">
                  <Search /> {t("professor.contact.directory")}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------------------------------- sidebar */

function Sidebar({ p }: { p: ProfessorDetail }) {
  const { t } = useI18n();
  const labels = useLabels();
  const { user } = useAuth();
  const errorText = useErrorText();
  const outreach = useApi(user?.role === "student" ? "outreach-all" : null, () => api.outreach());
  const [busy, setBusy] = useState(false);
  const entry: OutreachEntry | undefined = outreach.data?.find((e) => e.openalex_id === p.id);

  const start = async () => {
    setBusy(true);
    try {
      const created = await api.saveOutreach({ openalex_id: p.id, professor_name: p.name, institution: p.institution?.name ?? null, status: "saved" });
      outreach.setData((prev) => [created, ...(prev ?? [])]);
      toast.success(t("professor.sidebar.tracked"));
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const setStatus = async (status: OutreachStatus) => {
    if (!entry) return;
    try {
      const updated = await api.patchOutreach(entry.id, { status });
      outreach.setData((prev) => (prev ?? []).map((e) => (e.id === updated.id ? updated : e)));
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <Card className="p-6">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand-text">
          <PenLine className="size-5" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-ink">{t("professor.sidebar.writeTitle")}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("professor.sidebar.writeBody")}</p>
        <Button asChild variant="primary" className="mt-4 w-full">
          <Link href={`/tools/email-checker?professor=${p.id}&name=${encodeURIComponent(p.name)}`}>{t("professor.sidebar.writeCta")}</Link>
        </Button>
      </Card>

      {user?.role === "student" && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-ink">{t("professor.sidebar.trackTitle")}</h3>
          {entry ? (
            <div className="mt-3 space-y-3">
              <label className="block text-xs font-medium text-faint" htmlFor="track-status">
                {t("professor.sidebar.status")}
              </label>
              <NativeSelect id="track-status" value={entry.status} onChange={(e) => setStatus(e.target.value as OutreachStatus)}>
                {OUTREACH_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {labels.outreach(s)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : (
            <>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("professor.sidebar.trackBody")}</p>
              <Button variant="secondary" className="mt-4 w-full" onClick={start} loading={busy}>
                {t("professor.sidebar.trackStart")}
              </Button>
            </>
          )}
        </Card>
      )}
      <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-faint">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
        {t("discover.disclaimer")}
      </p>
    </aside>
  );
}
