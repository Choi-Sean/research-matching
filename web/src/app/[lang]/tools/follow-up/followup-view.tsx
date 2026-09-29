"use client";

import { CalendarPlus, CalendarClock, Copy, Lightbulb, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Container, PageHeader } from "@/components/ui/layout";
import { Alert, Badge, Card, EmptyState } from "@/components/ui/surface";
import { api, ApiError, type FollowUp } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useErrorText } from "@/lib/hooks";
import { downloadReminder } from "@/lib/ics";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function FollowUpView() {
  const { t, locale, fmt } = useI18n();
  const { user } = useAuth();
  const errorText = useErrorText();
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [sentOn, setSentOn] = useState(today());
  const [name, setName] = useState("");
  const [result, setResult] = useState<FollowUp | null>(null);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ text: string; quota: boolean } | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.followUp({ email, sent_on: sentOn, subject, professor_name: name || undefined, lang: locale });
      setResult(r);
      setDrafts(r.items.map((i) => i.body));
    } catch (e) {
      setError({ text: errorText(e), quota: e instanceof ApiError && e.code === "quota_exceeded" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader title={t("tools.followUp.title")} description={t("tools.followUp.subtitle")} />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="space-y-4">
              <Field label={t("tools.followUp.email")}>
                <Textarea value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("tools.followUp.emailPlaceholder")} className="min-h-64" maxLength={8000} />
              </Field>
              <Field label={t("tools.followUp.subject")} optional={t("common.optional")}>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={300} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("tools.followUp.sentOn")}>
                  <Input type="date" value={sentOn} onChange={(e) => setSentOn(e.target.value)} max={today()} />
                </Field>
                <Field label={t("tools.followUp.professorName")} optional={t("common.optional")}>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("tools.followUp.professorPlaceholder")} />
                </Field>
              </div>
            </div>
            <Button variant="brand" size="lg" className="mt-5" onClick={run} loading={loading} disabled={!user || email.trim().length < 20 || !sentOn}>
              <CalendarClock /> {loading ? t("tools.followUp.generating") : t("tools.followUp.generate")}
            </Button>
            {!user && (
              <Alert tone="info" title={t("tools.followUp.signInTitle")} className="mt-5">
                <Link href="/login?next=/tools/follow-up" className="font-semibold underline">
                  {t("nav.signIn")}
                </Link>
              </Alert>
            )}
            {error &&
              (error.quota ? (
                <Alert tone="warning" title={t("tools.followUp.limitTitle")} className="mt-5">
                  <Link href="/pricing" className="font-semibold underline">
                    {t("common.upgrade")}
                  </Link>
                </Alert>
              ) : (
                <Alert className="mt-5">{error.text}</Alert>
              ))}
          </Card>
          <Card className="p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Lightbulb className="size-4 text-accent" /> {t("tools.followUp.tipsTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {(["tip1", "tip2", "tip3"] as const).map((k) => (
                <li key={k} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {t(`tools.followUp.${k}`)}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div>
          {!result ? (
            <EmptyState icon={<CalendarClock />} title={t("tools.followUp.emptyTitle")} className="h-full min-h-[24rem] justify-center">
              {t("tools.followUp.emptyBody")}
            </EmptyState>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-ink">{t("tools.followUp.timeline")}</h2>
                <Badge tone={result.ai_used ? "accent" : "neutral"}>
                  {result.ai_used && <Sparkles />} {result.ai_used ? t("tools.followUp.aiUsed") : t("tools.followUp.templated")}
                </Badge>
              </div>
              <ol className="relative space-y-4 ps-6 before:absolute before:start-[0.6rem] before:top-3 before:bottom-3 before:w-px before:bg-line-2">
                {result.items.map((it, i) => (
                  <li key={it.day_offset} className="relative">
                    <span className="absolute -start-6 top-5 grid size-5 place-items-center rounded-full border-2 border-brand bg-canvas text-[0.625rem] font-bold text-brand-text">{i + 1}</span>
                    <Card className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{t("tools.followUp.step", { n: i + 1 })}</p>
                        <Badge tone="brand">{t("tools.followUp.sendOn", { date: fmt.date(it.send_on, { weekday: "short", month: "short", day: "numeric" }) })}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-faint">{t("tools.followUp.daysAfter", { days: it.day_offset })}</p>
                      <p className="mt-3 text-sm font-medium text-ink" dir="auto">
                        {it.subject}
                      </p>
                      <Textarea
                        value={drafts[i] ?? it.body}
                        onChange={(e) => setDrafts((d) => d.map((x, j) => (j === i ? e.target.value : x)))}
                        className="mt-2 min-h-44 text-sm"
                        dir="auto"
                      />
                      {it.note && <p className="mt-2 text-xs text-muted">{it.note}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            await navigator.clipboard.writeText(`${it.subject}\n\n${drafts[i] ?? it.body}`);
                            toast.success(t("tools.followUp.copied"));
                          }}
                        >
                          <Copy /> {t("tools.followUp.copy")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            downloadReminder({ title: `${t("tools.followUp.step", { n: i + 1 })} — ${name || it.subject}`, date: it.send_on, notes: it.subject, filename: `followup-${i + 1}` })
                          }
                        >
                          <CalendarPlus /> {t("tools.followUp.addToCalendar")}
                        </Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
              <p className="px-1 text-xs text-faint">{t("tools.followUp.editHint")}</p>
              <p className="px-1 text-xs text-faint">
                {result.quota.limit == null ? t("tools.emailChecker.quotaPro") : t("tools.followUp.quota", { used: result.quota.used, limit: result.quota.limit })}
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
