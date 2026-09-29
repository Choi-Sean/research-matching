"use client";

import { ArrowRight, GraduationCap, MailPlus, Sparkles, Telescope } from "lucide-react";
import { useEffect, useState } from "react";
import { Breakdown, MatchLabel, ReasonList, Tip } from "@/components/match/match-parts";
import { InstitutionCombobox } from "@/components/professor/institution-combobox";
import { SaveButton } from "@/components/professor/professor-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { Alert, Avatar, Badge, Card, Chip, EmptyState, Progress, ScoreRing } from "@/components/ui/surface";
import { api, ApiError, type Institution, type MatchPositions, type MatchProfessors, type ProfileStrength, type QuotaInfo } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useErrorText } from "@/lib/hooks";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { COMP_TONE, useLabels } from "@/lib/labels";

export default function MatchesPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const errorText = useErrorText();
  const labels = useLabels();
  const [tab, setTab] = useState("positions");
  const [positions, setPositions] = useState<MatchPositions | null>(null);
  const [professors, setProfessors] = useState<MatchProfessors | null>(null);
  const [strength, setStrength] = useState<ProfileStrength | null>(null);
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [busy, setBusy] = useState<"positions" | "professors" | null>(null);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState("");
  const [uniText, setUniText] = useState("");
  const [uni, setUni] = useState<Institution | null>(null);

  // Show the profile strength right away, without running (and charging for) a match.
  useEffect(() => {
    api.profileStrength().then(setStrength).catch(() => {});
  }, []);

  if (user && user.role !== "student") return <p className="text-muted">{t("errors.student_only")}</p>;

  const run = async (which: "positions" | "professors") => {
    setBusy(which);
    setError("");
    setQuotaBlocked(false);
    try {
      if (which === "positions") {
        const r = await api.matchPositions(locale, 10);
        setPositions(r);
        setStrength(r.strength);
      } else {
        const r = await api.matchProfessors({ lang: locale, query: direction.trim() || undefined, institution_id: uni?.id, limit: 12 });
        setProfessors(r);
        setStrength(r.strength);
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === "quota_exceeded") setQuotaBlocked(true);
      else setError(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const quota: QuotaInfo | undefined = tab === "positions" ? positions?.quota : professors?.quota;

  return (
    <>
      <PageHeader title={t("match.student.title")} description={t("match.student.subtitle")} />

      {strength && (
        <Card className="mb-6 p-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ScoreRing score={strength.score} size={56} stroke={5.5} label={t("match.student.strengthTitle")} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{t("match.student.strengthTitle")}</p>
              <p className="mt-0.5 text-sm text-muted">{t("match.student.strengthBody", { score: strength.score })}</p>
              {strength.missing.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {strength.missing.slice(0, 4).map((m) => (
                    <Chip key={m}>{t(`match.student.missing.${m}` as MessageKey)}</Chip>
                  ))}
                </div>
              )}
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/profile">{t("match.student.improve")}</Link>
            </Button>
          </div>
        </Card>
      )}

      {quotaBlocked && (
        <Alert tone="warning" title={t("match.student.limitTitle")} className="mb-6">
          {t("match.student.limitBody")}{" "}
          <Link href="/pricing" className="font-semibold underline">
            {t("common.upgrade")}
          </Link>
        </Alert>
      )}
      {error && <Alert className="mb-6">{error}</Alert>}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="positions">
            <GraduationCap /> {t("match.student.tabPositions")}
          </TabsTrigger>
          <TabsTrigger value="professors">
            <Telescope /> {t("match.student.tabProfessors")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">{positions ? "" : t("match.student.positionsFirst")}</p>
            <Button variant="brand" onClick={() => run("positions")} loading={busy === "positions"}>
              <Sparkles /> {busy === "positions" ? t("match.student.running") : positions ? t("match.student.rerun") : t("match.student.run")}
            </Button>
          </div>
          {positions && positions.items.length === 0 && (
            <EmptyState icon={<Sparkles />} title={t("match.student.noResultsTitle")}>
              {t("match.student.noResultsBody")}
            </EmptyState>
          )}
          {positions?.items.map((m) => (
            <Card key={m.position.id} className="p-6">
              <div className="flex flex-wrap items-start gap-5">
                <ScoreRing score={m.score} size={68} stroke={6} label={t("match.strong")} />
                <div className="min-w-0 flex-1">
                  <MatchLabel score={m.score} ai={positions.ai_used} />
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">
                    <Link href={`/positions/${m.position.id}`} className="hover:text-brand-text">
                      {m.position.title}
                    </Link>
                  </h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                    <Avatar name={m.position.lab.owner_name} size={20} /> {m.position.lab.name} · {m.position.lab.university}
                    <Badge tone={COMP_TONE[m.position.compensation]}>{labels.compensation(m.position.compensation)}</Badge>
                  </p>
                </div>
                <Button asChild variant="primary" size="sm">
                  <Link href={`/positions/${m.position.id}`}>
                    {t("match.student.apply")} <ArrowRight className="rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
              <div className="mt-5">
                <Breakdown data={m.breakdown} />
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <ReasonList reasons={m.reasons} gaps={m.gaps} />
                {m.tip && <div className="self-start"><Tip>{m.tip}</Tip></div>}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="professors" className="space-y-4">
          <Card className="p-5">
            <p className="mb-4 text-sm text-muted">{t("match.student.professorsIntro")}</p>
            <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_auto] md:items-end">
              <Field label={t("match.student.direction")} optional={t("common.optional")}>
                <Input value={direction} onChange={(e) => setDirection(e.target.value)} placeholder={t("match.student.directionPlaceholder")} />
              </Field>
              <Field label={t("match.student.university")} optional={t("common.optional")}>
                <InstitutionCombobox value={uniText} onChange={setUniText} onPick={setUni} placeholder={t("discover.universityAny")} />
              </Field>
              <Button variant="brand" className="h-11" onClick={() => run("professors")} loading={busy === "professors"}>
                <Sparkles /> {busy === "professors" ? t("match.student.running") : professors ? t("match.student.rerun") : t("match.student.run")}
              </Button>
            </div>
          </Card>

          {professors && (
            <p className="text-sm text-muted">{t("match.student.searchedFor", { keywords: professors.keywords_used.join(", ") || "—" })}</p>
          )}
          {professors && professors.items.length === 0 && (
            <EmptyState icon={<Telescope />} title={t("match.student.noResultsTitle")}>
              {t("match.student.emptyProfile")}
            </EmptyState>
          )}
          <div className="grid gap-4">
            {professors?.items.map((m) => (
              <Card key={m.professor.id} className="p-6">
                <div className="flex flex-wrap items-start gap-5">
                  <ScoreRing score={m.score} size={68} stroke={6} label={t("match.strong")} />
                  <div className="min-w-0 flex-1">
                    <MatchLabel score={m.score} ai={professors.ai_used} />
                    <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">
                      <Link href={`/professors/${m.professor.id}`} className="hover:text-brand-text">
                        {m.professor.name}
                      </Link>
                    </h3>
                    {m.professor.institution && <p className="mt-0.5 text-sm text-muted">{m.professor.institution.name}</p>}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {m.professor.topics.slice(0, 3).map((topic) => (
                        <Chip key={topic}>{topic}</Chip>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SaveButton p={m.professor} />
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/professors/${m.professor.id}`}>{t("match.student.viewProfessor")}</Link>
                    </Button>
                    <Button asChild variant="primary" size="sm">
                      <Link href={`/tools/email-checker?professor=${m.professor.id}&name=${encodeURIComponent(m.professor.name)}`}>
                        <MailPlus /> {t("match.student.writeEmail")}
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <ReasonList reasons={m.reasons} gaps={m.gaps} />
                  {m.tip && <div className="self-start"><Tip>{m.tip}</Tip></div>}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_auto]">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-ink">{t("match.student.howTitle")}</h3>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            {(["how1", "how2", "how3"] as const).map((k, i) => (
              <li key={k} className="flex gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-text">{i + 1}</span>
                {t(`match.student.${k}`)}
              </li>
            ))}
          </ol>
        </Card>
        {quota && (
          <p className="self-end text-xs text-faint">
            {quota.limit == null ? t("match.student.quotaPro") : t("match.student.quota", { used: quota.used, limit: quota.limit })}
          </p>
        )}
      </div>
      <div className="sr-only">
        <Progress value={strength?.score ?? 0} />
      </div>
    </>
  );
}
