"use client";

import { ExternalLink, Search, Send, ShieldAlert, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WorkStyleEditor } from "@/components/dashboard/work-style-editor";
import { Breakdown, MatchLabel, ReasonList, Tip } from "@/components/match/match-parts";
import { Button } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/chip-input";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/layout";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/overlay";
import { Alert, Avatar, Badge, Card, Chip, EmptyState, ScoreRing } from "@/components/ui/surface";
import { api, type MatchStudents, type Persona, type StudentCandidate } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi, useErrorText } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n/provider";
import { useLabels } from "@/lib/labels";

const EMPTY: Persona = { headline: "", summary: "", must_have: [], nice_to_have: [], traits: [], keywords: [], work_style: null };

export default function TalentPage() {
  const { t, locale } = useI18n();
  const labels = useLabels();
  const { user } = useAuth();
  const errorText = useErrorText();
  const positions = useApi(user?.role === "professor" ? "my-positions" : null, async () => {
    try {
      return await api.myPositions();
    } catch {
      return [];
    }
  });
  const site = useApi("site-stats", () => api.stats());

  const [positionId, setPositionId] = useState("");
  const [notes, setNotes] = useState("");
  const [persona, setPersona] = useState<Persona | null>(null);
  const [aiPersona, setAiPersona] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [finding, setFinding] = useState(false);
  const [results, setResults] = useState<MatchStudents | null>(null);
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState<StudentCandidate | null>(null);

  if (user && user.role !== "professor") return <p className="text-muted">{t("errors.professor_only")}</p>;
  const verified = !!user?.verified;
  const openPositions = positions.data?.filter((p) => p.status === "open") ?? [];
  const aiEnabled = site.data?.ai_enabled ?? false;

  const draft = async () => {
    setDrafting(true);
    setError("");
    try {
      const r = await api.buildPersona({ position_id: positionId ? Number(positionId) : null, text: notes.trim() || undefined, lang: locale });
      setPersona(r.persona);
      setAiPersona(r.ai_used);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setDrafting(false);
    }
  };

  const find = async () => {
    if (!persona) return;
    setFinding(true);
    setError("");
    try {
      setResults(await api.matchStudents({ position_id: positionId ? Number(positionId) : null, persona, lang: locale, limit: 12 }));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setFinding(false);
    }
  };

  const setP = (patch: Partial<Persona>) => setPersona((p) => ({ ...(p ?? EMPTY), ...patch }));

  return (
    <>
      <PageHeader title={t("match.professor.title")} description={t("match.professor.subtitle")} />
      {!verified && (
        <Alert tone="warning" title={t("match.professor.unverifiedTitle")} className="mb-6">
          {t("match.professor.unverifiedBody")}
        </Alert>
      )}
      {error && <Alert className="mb-6">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        {/* ------------------------------------------------------------ step 1–2: describe */}
        <div className="space-y-6">
          <Card className="space-y-5 p-6">
            <h2 className="text-base font-semibold text-ink">{t("match.professor.step1")}</h2>
            <Field label={t("match.professor.position")} hint={t("match.professor.step1Hint")}>
              <NativeSelect value={positionId} onChange={(e) => setPositionId(e.target.value)}>
                <option value="">{t("match.professor.noPosition")}</option>
                {openPositions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("match.professor.notes")} optional={t("common.optional")}>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("match.professor.notesPlaceholder")} className="min-h-28" maxLength={4000} />
            </Field>
            <Button variant="brand" className="w-full" onClick={draft} loading={drafting} disabled={!verified || (!positionId && notes.trim().length < 3)}>
              <Sparkles /> {drafting ? t("match.professor.drafting") : aiEnabled ? t("match.professor.draft") : t("match.professor.draftRule")}
            </Button>
            {site.data && !aiEnabled && <p className="text-xs text-faint">{t("match.ai.notEnabled")}</p>}
          </Card>

          {persona && (
            <Card className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-ink">{t("match.professor.step2")}</h2>
                <Badge tone={aiPersona ? "accent" : "neutral"}>{aiPersona && <Sparkles />} {aiPersona ? t("match.aiRefined") : t("match.explainable")}</Badge>
              </div>
              <p className="-mt-2 text-xs text-muted">{t("match.professor.personaHint")}</p>
              <Field label={t("match.professor.headline")}>
                <Input value={persona.headline} onChange={(e) => setP({ headline: e.target.value })} />
              </Field>
              <Field label={t("match.professor.summary")}>
                <Textarea value={persona.summary} onChange={(e) => setP({ summary: e.target.value })} className="min-h-20 text-sm" />
              </Field>
              <Field label={t("match.professor.mustHave")} hint={t("match.professor.addChip")}>
                <ChipInput value={persona.must_have} onChange={(v) => setP({ must_have: v })} max={8} dir="ltr" />
              </Field>
              <Field label={t("match.professor.niceToHave")} hint={t("match.professor.addChip")}>
                <ChipInput value={persona.nice_to_have} onChange={(v) => setP({ nice_to_have: v })} max={8} dir="ltr" />
              </Field>
              <Field label={t("match.professor.traits")} hint={t("match.professor.addChip")}>
                <ChipInput value={persona.traits} onChange={(v) => setP({ traits: v })} max={6} />
              </Field>
              <Field label={t("match.professor.keywords")} hint={t("match.professor.addChip")}>
                <ChipInput value={persona.keywords} onChange={(v) => setP({ keywords: v })} max={10} dir="ltr" />
              </Field>
              <div>
                <p className="mb-4 text-sm font-medium text-ink">{t("match.professor.workStyle")}</p>
                <WorkStyleEditor value={persona.work_style} onChange={(v) => setP({ work_style: v })} />
              </div>
              <Button variant="primary" size="lg" className="w-full" onClick={find} loading={finding} disabled={!verified}>
                <Search /> {finding ? t("match.professor.finding") : t("match.professor.find")}
              </Button>
            </Card>
          )}
        </div>

        {/* ------------------------------------------------------------ step 3: results */}
        <div>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-ink">{t("match.professor.step3")}</h2>
            {results && (
              <p className="text-xs text-faint">
                {t("match.professor.pool", { count: results.pool_size })}
                {results.searches_left_today != null && ` · ${t("match.professor.left", { count: results.searches_left_today })}`}
              </p>
            )}
          </div>
          {!results ? (
            <EmptyState icon={<ShieldAlert />} title={t("match.professor.step3")} className="min-h-72 justify-center">
              {t("match.professor.privacy")}
            </EmptyState>
          ) : results.items.length === 0 ? (
            <EmptyState icon={<Search />} title={t("match.professor.noStudents")}>
              {results.pool_size === 0 ? t("match.professor.poolEmpty") : t("match.professor.noStudentsBody")}
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {results.items.map((c) => (
                <Card key={c.user_id} className="p-6">
                  <div className="flex flex-wrap items-start gap-5">
                    <ScoreRing score={c.score} size={68} stroke={6} label={t("match.strong")} />
                    <div className="min-w-0 flex-1 basis-48">
                      <MatchLabel score={c.score} ai={results.ai_used} />
                      <div className="mt-2 flex items-center gap-3">
                        <Avatar name={c.full_name} size={36} />
                        <div className="min-w-0">
                          <p className="text-lg font-semibold tracking-tight text-ink">{c.full_name}</p>
                          <p className="truncate text-sm text-muted">
                            {[c.major, labels.year(c.year), c.university].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="max-sm:w-full">
                      {c.invited ? (
                        <Badge tone="good">{t("match.professor.invited")}</Badge>
                      ) : (
                        <Button variant="brand" size="sm" className="max-sm:w-full" onClick={() => setInviting(c)} disabled={openPositions.length === 0 || !verified}>
                          <UserPlus /> {t("match.professor.invite")}
                        </Button>
                      )}
                    </div>
                  </div>
                  {c.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {c.skills.map((s) => (
                        <Chip key={s}>{s}</Chip>
                      ))}
                    </div>
                  )}
                  {(c.bio || c.experience) && (
                    <p className="mt-3 text-sm leading-relaxed text-muted" dir="auto">
                      {c.experience ?? c.bio}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
                    {c.availability_hours && <span>{t("match.professor.available", { hours: c.availability_hours })}</span>}
                    {c.github_url && (
                      <a href={c.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-text hover:underline pointer-coarse:min-h-10">
                        GitHub <ExternalLink className="size-3" />
                      </a>
                    )}
                    {c.website_url && (
                      <a href={c.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-text hover:underline pointer-coarse:min-h-10">
                        Web <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  <div className="mt-5">
                    <Breakdown data={c.breakdown} />
                  </div>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <ReasonList reasons={c.reasons} gaps={c.gaps} />
                    {c.tip && (
                      <div className="self-start">
                        <Tip>{c.tip}</Tip>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              <p className="px-1 text-xs text-faint">{t("match.professor.privacy")}</p>
            </div>
          )}
          {openPositions.length === 0 && positions.data && <p className="mt-4 text-sm text-muted">{t("match.professor.createPositionFirst")}</p>}
        </div>
      </div>

      {inviting && (
        <InviteDialog
          candidate={inviting}
          positions={openPositions}
          defaultPositionId={positionId ? Number(positionId) : openPositions[0]?.id}
          onClose={() => setInviting(null)}
          onSent={(id) => {
            setResults((r) => r && { ...r, items: r.items.map((c) => (c.user_id === id ? { ...c, invited: true } : c)) });
            setInviting(null);
          }}
        />
      )}
    </>
  );
}

function InviteDialog({
  candidate,
  positions,
  defaultPositionId,
  onClose,
  onSent,
}: {
  candidate: StudentCandidate;
  positions: { id: number; title: string }[];
  defaultPositionId?: number;
  onClose: () => void;
  onSent: (studentId: number) => void;
}) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const [pid, setPid] = useState<number>(defaultPositionId ?? positions[0]?.id ?? 0);
  const title = positions.find((p) => p.id === pid)?.title ?? "";
  const first = candidate.full_name.split(" ")[0];
  const [msg, setMsg] = useState(() => t("match.professor.messageDefault", { name: first, position: title }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    setBusy(true);
    setError("");
    try {
      await api.invite({ student_id: candidate.user_id, position_id: pid, message: msg.trim(), match_score: candidate.score });
      toast.success(t("match.professor.sent"));
      onSent(candidate.user_id);
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={t("match.professor.inviteTitle", { name: candidate.full_name })} description={t("match.professor.inviteBody")} closeLabel={t("common.close")}>
        <div className="space-y-4">
          <Field label={t("match.professor.position")}>
            <NativeSelect
              value={pid}
              onChange={(e) => {
                const next = Number(e.target.value);
                const nextTitle = positions.find((p) => p.id === next)?.title ?? "";
                // keep the default message in sync until the professor edits it
                if (msg === t("match.professor.messageDefault", { name: first, position: title })) setMsg(t("match.professor.messageDefault", { name: first, position: nextTitle }));
                setPid(next);
              }}
            >
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("match.professor.message")}>
            <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} className="min-h-32" maxLength={4000} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="ghost">{t("common.cancel")}</Button>
            </DialogClose>
            <Button variant="brand" onClick={send} loading={busy} disabled={!pid || msg.trim().length < 1}>
              <Send /> {t("match.professor.sendInvite")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

