"use client";

import { ArrowLeft, Building2, CalendarClock, CheckCircle2, Clock, ExternalLink, FlaskConical, MapPin, Send, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { MaterialList } from "@/components/position/materials";
import { PositionSaveButton } from "@/components/position/position-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Container } from "@/components/ui/layout";
import { Alert, Avatar, Badge, Card, Chip, EmptyState, Skeleton } from "@/components/ui/surface";
import { api, type MyApplication } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useApi, useErrorText } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { APP_TONE, COMP_TONE, kw, useLabels } from "@/lib/labels";
import { useDeadline } from "@/lib/use-deadline";

export function PositionView({ id }: { id: string }) {
  const { t, fmt } = useI18n();
  const labels = useLabels();
  const { user, loading: authLoading } = useAuth();
  const deadline = useDeadline();
  const position = useApi(`position-${id}`, () => api.position(id));
  const p = position.data;
  const materials = useApi(p ? `materials-${p.lab_id}` : null, () => api.labMaterials(p!.lab_id));
  const mine = useApi(user?.role === "student" ? "my-applications" : null, () => api.myApplications());
  const existing = mine.data?.find((a) => a.position_id === Number(id));

  if (position.error) {
    return (
      <Container className="py-24">
        <EmptyState
          icon={<FlaskConical />}
          title={t("positions.notFound")}
          action={
            <Button asChild variant="secondary">
              <Link href="/positions">{t("positions.backToAll")}</Link>
            </Button>
          }
        />
      </Container>
    );
  }
  if (!p) {
    return (
      <Container className="grid gap-8 py-12 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </Container>
    );
  }

  const dl = deadline(p.deadline);
  const skills = kw(p.required_skills);
  const tags = kw(p.keywords);

  return (
    <Container className="py-8 sm:py-12">
      <Link href="/positions" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink pointer-coarse:-mt-3 pointer-coarse:mb-3 pointer-coarse:min-h-11">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("positions.backToAll")}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={COMP_TONE[p.compensation]}>{labels.compensation(p.compensation)}</Badge>
            {p.hours_per_week && (
              <Badge>
                <Clock /> {t("common.hoursPerWeek", { n: p.hours_per_week })}
              </Badge>
            )}
            {p.term && <Badge>{labels.term(p.term)}</Badge>}
            {p.location_type && (
              <Badge>
                <MapPin /> {labels.location(p.location_type)}
              </Badge>
            )}
            {p.slots && (
              <Badge>
                <Users /> {t(p.slots === 1 ? "positions.slots_one" : "positions.slots_other", { count: p.slots })}
              </Badge>
            )}
            {dl && (
              <Badge tone={dl.urgent ? "bad" : "neutral"}>
                <CalendarClock /> {dl.text}
              </Badge>
            )}
            {p.status === "closed" && <Badge tone="bad">{t("common.closedLabel")}</Badge>}
          </div>

          <div className="mt-5 flex items-start justify-between gap-4">
            <h1 className="display text-[clamp(1.9rem,3.8vw,2.9rem)] text-ink">{p.title}</h1>
            <PositionSaveButton p={p} />
          </div>

          <Link href={`/labs/${p.lab_id}`} className="mt-6 flex w-fit items-center gap-3.5 rounded-2xl border border-line bg-surface p-3 pe-5 shadow-card transition-colors hover:border-line-2">
            <Avatar name={p.lab.owner_name} size={46} />
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                {p.lab.name} <ShieldCheck className="size-4 text-good" aria-label={t("positions.verifiedLab")} />
              </p>
              <p className="text-xs text-muted">
                {p.lab.owner_name} · {p.lab.university}
              </p>
            </div>
          </Link>

          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-ink">{t("positions.about")}</h2>
            <p className="leading-relaxed whitespace-pre-line text-ink/85">{p.description}</p>
          </section>

          {p.requirements && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-semibold tracking-tight text-ink">{t("positions.requirements")}</h2>
              <p className="leading-relaxed whitespace-pre-line text-ink/85">{p.requirements}</p>
            </section>
          )}

          {skills.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-semibold tracking-tight text-ink">{t("positions.skills")}</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge key={s} tone="brand">
                    {s}
                  </Badge>
                ))}
              </div>
            </section>
          )}
          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {tags.map((k) => (
                <Chip key={k}>{k}</Chip>
              ))}
            </div>
          )}

          <section className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{t("positions.research")}</h2>
            <p className="mt-1 mb-4 text-sm text-muted">{t("positions.researchHint")}</p>
            {materials.data ? <MaterialList items={materials.data} /> : <Skeleton className="h-20" />}
          </section>
          <p className="mt-10 text-xs text-faint">
            {t("positions.postedAgo", { when: fmt.relative(p.created_at) })}
          </p>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div id="apply" className="scroll-mt-24">
            <ApplyCard positionId={p.id} open={p.status === "open"} existing={existing} onApplied={mine.reload} />
          </div>
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <FlaskConical className="size-4 text-brand-text" /> {t("positions.aboutLab")}
            </h3>
            {p.lab.bio && <p className="line-clamp-4 text-sm leading-relaxed text-muted">{p.lab.bio}</p>}
            <div className="mt-3 space-y-1.5 text-sm text-muted">
              <p className="flex items-center gap-2">
                <Building2 className="size-4 shrink-0 text-faint" /> {p.lab.university} · {p.lab.department}
              </p>
              {p.lab.website && (
                <a href={p.lab.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-text hover:underline pointer-coarse:min-h-11">
                  <ExternalLink className="size-4 shrink-0" /> {t("positions.website")}
                </a>
              )}
            </div>
            <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
              <Link href={`/labs/${p.lab_id}`}>{t("positions.viewLab")}</Link>
            </Button>
          </Card>
        </aside>
      </div>
      {p.status === "open" && !authLoading && !existing && (!user || user.role === "student") && (
        <MobileApplyBar positionId={p.id} title={p.title} lab={p.lab.name} guest={!user} />
      )}
    </Container>
  );
}

/** Phones only: the apply form sits below the whole description, so keep a one-tap route to it until it scrolls into view. */
function MobileApplyBar({ positionId, title, lab, guest }: { positionId: number; title: string; lab: string; guest: boolean }) {
  const { t } = useI18n();
  const [ahead, setAhead] = useState(false); // the form is still below the screen

  useEffect(() => {
    const target = document.getElementById("apply");
    if (!target) return;
    const io = new IntersectionObserver(([e]) => setAhead(!e.isIntersecting && e.boundingClientRect.top > 0));
    io.observe(target);
    return () => io.disconnect();
  }, []);

  const jump = () => {
    const target = document.getElementById("apply");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => target?.querySelector("textarea")?.focus({ preventScroll: true }), 500);
  };

  return (
    <div
      inert={!ahead}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/90 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl transition-transform duration-300 lg:hidden",
        ahead ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-[1200px] items-center gap-3">
        <div className="min-w-0 flex-1">
          {/* dir="auto": a title in another script than the page keeps its own direction, so truncation cuts the end of it, not the start */}
          <p className="truncate text-sm font-semibold text-ink" dir="auto">{title}</p>
          <p className="truncate text-xs text-muted" dir="auto">{lab}</p>
        </div>
        {guest ? (
          <Button asChild variant="brand">
            <Link href={`/login?next=/positions/${positionId}`}>{t("positions.apply.signInCta")}</Link>
          </Button>
        ) : (
          <Button variant="brand" onClick={jump}>
            {t("positions.apply.title")}
          </Button>
        )}
      </div>
    </div>
  );
}

function ApplyCard({ positionId, open, existing, onApplied }: { positionId: number; open: boolean; existing?: MyApplication; onApplied: () => void }) {
  const { t } = useI18n();
  const labels = useLabels();
  const { user, loading } = useAuth();
  const errorText = useErrorText();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.apply(positionId, message.trim());
      setDone(true);
      onApplied();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  let body: React.ReactNode;
  if (loading) body = <Skeleton className="h-28" />;
  else if (!open) body = <p className="text-sm text-muted">{t("positions.apply.closedNote")}</p>;
  else if (!user)
    body = (
      <>
        <p className="mb-4 text-sm leading-relaxed text-muted">{t("positions.apply.signIn")}</p>
        <Button asChild className="w-full" variant="brand">
          <Link href={`/login?next=/positions/${positionId}`}>{t("positions.apply.signInCta")}</Link>
        </Button>
        <p className="mt-3 text-center text-sm text-muted">
          {t("positions.apply.newHere")}{" "}
          <Link href="/register" className="font-medium text-brand-text hover:underline">
            {t("positions.apply.createAccount")}
          </Link>
        </p>
      </>
    );
  else if (user.role === "professor") body = <p className="text-sm text-muted">{t("positions.apply.professorNote")}</p>;
  else if (existing || done) {
    const status = existing?.status ?? "pending";
    body = (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-11 text-good" />
        <p className="mt-3 font-semibold text-ink">{t("positions.apply.sent")}</p>
        <p className="mt-2 text-sm text-muted">
          {t("positions.apply.status")}: <Badge tone={APP_TONE[status]}>{labels.appStatus(status)}</Badge>
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-4">
          <Link href="/dashboard/applications">{t("positions.apply.track")}</Link>
        </Button>
      </div>
    );
  } else
    body = (
      <form onSubmit={submit} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">{t("positions.apply.label")}</span>
          <Textarea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("positions.apply.placeholder")} className="min-h-36" />
        </label>
        <p className="text-xs leading-relaxed text-faint">{t("positions.apply.fitHint")}</p>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" variant="brand" loading={busy} className="w-full">
          <Send /> {t("positions.apply.submit")}
        </Button>
        <p className="text-center text-xs text-faint">{t("positions.apply.shared")}</p>
      </form>
    );

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-ink">{t("positions.apply.title")}</h3>
      {body}
    </Card>
  );
}
