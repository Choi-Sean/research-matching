"use client";

import { AlertTriangle, Check, FileText, PenLine, Sparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Fragment, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Container, PageHeader } from "@/components/ui/layout";
import { Alert, Badge, Card, EmptyState, Progress, ScoreRing } from "@/components/ui/surface";
import { api, ApiError, type EmailCheck, type Flag } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useErrorText } from "@/lib/hooks";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { useLabels } from "@/lib/labels";

const SEV_TONE = { high: "bad", medium: "warn", low: "neutral" } as const;
const MARK_CLASS = {
  high: "bg-bad-soft text-bad-text decoration-bad",
  medium: "bg-warn-soft text-warn-text decoration-warn-text",
  low: "bg-surface-3 text-ink decoration-faint",
} as const;

export function CheckerView() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const errorText = useErrorText();
  const labels = useLabels();
  const sp = useSearchParams();
  const [context, setContext] = useState<{ id: string; name: string } | null>(
    sp.get("professor") ? { id: sp.get("professor")!, name: sp.get("name") ?? "" } : null,
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<EmailCheck | null>(null);
  const [checkedBody, setCheckedBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ text: string; quota: boolean } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const words = useMemo(() => (body.trim() ? body.trim().split(/\s+/).length : 0), [body]);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.checkEmail({
        subject,
        body,
        professor_id: context?.id,
        professor_name: context?.name || undefined,
        lang: locale,
      });
      setResult(r);
      setCheckedBody(body);
      if (window.innerWidth < 1024) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError({ text: errorText(e), quota: e instanceof ApiError && e.code === "quota_exceeded" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader title={t("tools.emailChecker.title")} description={t("tools.emailChecker.subtitle")} />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ------------------------------------------------------------- editor */}
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            {context && (
              <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-brand-soft px-4 py-2.5 text-sm text-brand-text">
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4" />
                  {t("tools.emailChecker.professorContext", { name: context.name || context.id })}
                </span>
                <button onClick={() => setContext(null)} aria-label={t("tools.emailChecker.removeContext")} className="rounded-md p-1 hover:bg-brand/10 pointer-coarse:-m-2 pointer-coarse:p-3">
                  <X className="size-4" />
                </button>
              </div>
            )}
            <div className="space-y-4">
              <Field label={t("tools.emailChecker.subject")}>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("tools.emailChecker.subjectPlaceholder")} maxLength={300} />
              </Field>
              <Field label={t("tools.emailChecker.body")}>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t("tools.emailChecker.bodyPlaceholder")}
                  className="min-h-[22rem] font-[inherit]"
                  maxLength={8000}
                />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs text-faint">
                <span className="tabular-nums">{t("tools.emailChecker.words", { count: words })}</span>
                <span>{t("tools.emailChecker.wordsHint")}</span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button variant="brand" size="lg" onClick={run} loading={loading} disabled={!user || body.trim().length < 20}>
                <PenLine /> {loading ? t("tools.emailChecker.checking") : t("tools.emailChecker.check")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSubject(t("tools.emailChecker.sampleSubject"));
                  setBody(t("tools.emailChecker.sampleBody"));
                }}
              >
                {t("tools.emailChecker.example")}
              </Button>
              {(body || subject) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setBody("");
                    setSubject("");
                    setResult(null);
                  }}
                >
                  {t("tools.emailChecker.clear")}
                </Button>
              )}
            </div>
            {!user && (
              <Alert tone="info" title={t("tools.emailChecker.signInTitle")} className="mt-5">
                {t("tools.emailChecker.signInBody")}{" "}
                <Link href="/login?next=/tools/email-checker" className="font-semibold underline">
                  {t("nav.signIn")}
                </Link>
              </Alert>
            )}
            {error &&
              (error.quota ? (
                <Alert tone="warning" title={t("tools.emailChecker.limitTitle")} className="mt-5">
                  {t("tools.emailChecker.limitBody")}{" "}
                  <Link href="/pricing" className="font-semibold underline">
                    {t("common.upgrade")}
                  </Link>
                </Alert>
              ) : (
                <Alert className="mt-5">{error.text}</Alert>
              ))}
          </Card>
          <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-faint">
            <Check className="mt-0.5 size-3.5 shrink-0 text-good" /> {t("tools.emailChecker.noRewrite")}
          </p>
        </div>

        {/* ------------------------------------------------------------- results */}
        <div ref={resultRef} className="scroll-mt-24">
          {!result ? (
            <EmptyState icon={<FileText />} title={t("tools.emailChecker.emptyTitle")} className="h-full min-h-[28rem] justify-center">
              {t("tools.emailChecker.emptyBody")}
            </EmptyState>
          ) : (
            <Results r={result} body={checkedBody} hover={hover} setHover={setHover} labels={labels} />
          )}
        </div>
      </div>
    </Container>
  );
}

function Results({
  r,
  body,
  hover,
  setHover,
  labels,
}: {
  r: EmailCheck;
  body: string;
  hover: string | null;
  setHover: (id: string | null) => void;
  labels: ReturnType<typeof useLabels>;
}) {
  const { t, has } = useI18n();
  const gradeTone = r.grade === "excellent" || r.grade === "good" ? "good" : r.grade === "needs_work" ? "warn" : "bad";
  const key = (code: string, part: "title" | "tip") =>
    has(`tools.emailChecker.flags.${code}.${part}`) ? (`tools.emailChecker.flags.${code}.${part}` as MessageKey) : null;

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex items-center gap-5">
          <ScoreRing score={r.score} size={92} stroke={8} label={t("tools.emailChecker.score")} />
          <div className="min-w-0 flex-1">
            <Badge tone={gradeTone}>{labels.grade(r.grade)}</Badge>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t(`tools.emailChecker.gradeDesc.${r.grade}` as MessageKey)}</p>
          </div>
        </div>
        {r.sounds_generic != null && (
          <div className="mt-5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-ink">{t("tools.emailChecker.soundsGeneric")}</span>
              <span className="tabular-nums text-muted">{r.sounds_generic}%</span>
            </div>
            <Progress value={r.sounds_generic} className="mt-1.5" />
            <p className="mt-1.5 text-xs text-faint">{t("tools.emailChecker.soundsGenericHint")}</p>
          </div>
        )}
        {r.ai_summary && (
          <div className="mt-5 rounded-xl bg-brand-soft/60 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-text">
              <Sparkles className="size-3.5 text-accent" /> {t("tools.emailChecker.aiSummary")}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/90">{r.ai_summary}</p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge>{r.ai_used ? t("tools.emailChecker.aiUsed") : t("tools.emailChecker.rulesOnly")}</Badge>
          <Badge>{t("tools.emailChecker.words", { count: r.word_count })}</Badge>
          <QuotaNote r={r} />
        </div>
        {!r.english_checks && <Alert tone="info" className="mt-4">{t("tools.emailChecker.englishOnly")}</Alert>}
      </Card>

      {/* highlighted email */}
      <Card className="p-6">
        <h3 className="mb-3 text-sm font-semibold text-ink">{t("tools.emailChecker.highlights")}</h3>
        <div className="max-h-72 overflow-y-auto rounded-xl bg-surface-2/70 p-4 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-ink/90">
          <Highlighted body={body} flags={r.flags} hover={hover} />
        </div>
      </Card>

      {/* flags */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-ink">{t("tools.emailChecker.issues")}</h3>
        {r.flags.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-good-text">
            <Check className="size-4" /> {t("tools.emailChecker.noIssues")}
          </p>
        ) : (
          <ul className="space-y-3">
            {r.flags.map((f) => {
              const title = key(f.code, "title");
              const tip = key(f.code, "tip");
              return (
                <li
                  key={f.id}
                  onMouseEnter={() => setHover(f.id)}
                  onMouseLeave={() => setHover(null)}
                  className={cn("rounded-xl border p-4 transition-colors", hover === f.id ? "border-brand/40 bg-brand-soft/30" : "border-line")}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={SEV_TONE[f.severity]}>
                      <AlertTriangle /> {t(`tools.emailChecker.severity.${f.severity}` as MessageKey)}
                    </Badge>
                    <span className="text-sm font-semibold text-ink">{title ? t(title) : t("tools.emailChecker.flags.ai_note.title")}</span>
                    <span className="ms-auto text-xs text-faint">{t(`tools.emailChecker.categories.${f.category}` as MessageKey)}</span>
                  </div>
                  {f.quote && (
                    <p className="mt-2.5 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted italic" dir="auto">
                      “{f.quote}”
                    </p>
                  )}
                  {f.advice ? (
                    <p className="mt-2.5 text-sm leading-relaxed text-ink/90">{f.advice}</p>
                  ) : (
                    tip && <p className="mt-2.5 text-sm leading-relaxed text-muted">{t(tip)}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {r.strengths.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-ink">{t("tools.emailChecker.strengths")}</h3>
          <ul className="space-y-2.5">
            {r.strengths.map((s, i) => (
              <li key={`${s.code}-${i}`} className="flex gap-2.5 text-sm text-ink/90">
                <Check className="mt-0.5 size-4 shrink-0 text-good" />
                {s.text ?? (has(`tools.emailChecker.strengthLabels.${s.code}`) ? t(`tools.emailChecker.strengthLabels.${s.code}` as MessageKey) : s.code)}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function QuotaNote({ r }: { r: EmailCheck }) {
  const { t } = useI18n();
  return (
    <span className="ms-auto text-xs text-faint">
      {r.quota.limit == null ? t("tools.emailChecker.quotaPro") : t("tools.emailChecker.quota", { used: r.quota.used, limit: r.quota.limit })}
    </span>
  );
}

function Highlighted({ body, flags, hover }: { body: string; flags: Flag[]; hover: string | null }) {
  const spans = flags
    .filter((f) => f.start != null && f.end != null && f.end > f.start)
    .sort((a, b) => a.start! - b.start!);
  const out: React.ReactNode[] = [];
  let cursor = 0;
  for (const f of spans) {
    if (f.start! < cursor) continue; // skip overlaps
    if (f.start! > cursor) out.push(<Fragment key={`t${cursor}`}>{body.slice(cursor, f.start!)}</Fragment>);
    out.push(
      <mark
        key={f.id}
        className={cn(
          "rounded px-0.5 underline decoration-wavy decoration-1 underline-offset-2 transition-shadow",
          MARK_CLASS[f.severity],
          hover === f.id && "ring-2 ring-brand",
        )}
      >
        {body.slice(f.start!, f.end!)}
      </mark>,
    );
    cursor = f.end!;
  }
  out.push(<Fragment key="tail">{body.slice(cursor)}</Fragment>);
  return <>{out}</>;
}
