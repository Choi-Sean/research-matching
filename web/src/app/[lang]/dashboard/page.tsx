"use client";

import { ArrowRight, Briefcase, CheckCircle2, Clock, Eye, FileText, FlaskConical, Mail, Plus, Sparkles, UsersRound } from "lucide-react";
import { PositionCard } from "@/components/position/position-card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/layout";
import { Alert, Badge, Card, Skeleton } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { APP_TONE, useLabels } from "@/lib/labels";

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: number | string | undefined }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Icon className="size-4 text-faint" /> {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-ink">{value ?? <Skeleton className="h-9 w-14" />}</div>
    </Card>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "student" ? <StudentHome name={user.full_name} /> : <ProfessorHome name={user.full_name} verified={user.verified} />;
}

function StudentHome({ name }: { name: string }) {
  const { t, tp, fmt } = useI18n();
  const labels = useLabels();
  const apps = useApi("my-applications", () => api.myApplications());
  const profile = useApi("student-profile", () => api.studentProfile());
  const strength = useApi("profile-strength", () => api.profileStrength());
  const invitations = useApi("my-invitations", () => api.myInvitations());
  const suggested = useApi("suggested-positions", () => api.positions({ limit: 4 }));
  const a = apps.data;
  const pending = invitations.data?.filter((i) => i.status === "pending").length ?? 0;

  return (
    <>
      <PageHeader
        title={t("dash.greeting", { name: name.split(" ")[0] })}
        description={t("dash.overview.studentSubtitle")}
        action={
          <Button asChild>
            <Link href="/positions">
              {t("dash.overview.findPositions")} <ArrowRight className="rtl:rotate-180" />
            </Link>
          </Button>
        }
      />

      {pending > 0 && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-brand/30 bg-brand-soft/50 p-4">
          <p className="flex items-center gap-2.5 text-sm font-medium text-ink">
            <Mail className="size-4 text-brand-text" /> {tp("dash.overview.pendingInvitations", pending)}
          </p>
          <Button asChild size="sm" variant="brand">
            <Link href="/dashboard/invitations">{t("dash.overview.viewInvitations")}</Link>
          </Button>
        </Card>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {strength.data && strength.data.score < 80 && (
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn-text">
                <FileText className="size-4.5" />
              </span>
              <div>
                <p className="font-semibold text-ink">{t("dash.overview.completeTitle")}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{t("dash.overview.completeBody")}</p>
                <Button asChild size="sm" variant="secondary" className="mt-3">
                  <Link href="/dashboard/profile">{t("dash.overview.completeCta")}</Link>
                </Button>
              </div>
            </div>
          </Card>
        )}
        {profile.data && !profile.data.discoverable && (
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-text">
                <Eye className="size-4.5" />
              </span>
              <div>
                <p className="font-semibold text-ink">{t("dash.overview.discoverTitle")}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{t("dash.overview.discoverBody")}</p>
                <Button asChild size="sm" variant="secondary" className="mt-3">
                  <Link href="/dashboard/profile#visibility">{t("dash.overview.discoverCta")}</Link>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={FileText} label={t("dash.overview.applications")} value={a?.length} />
        <Stat icon={Clock} label={t("dash.overview.inReview")} value={a?.filter((x) => x.status === "pending").length} />
        <Stat icon={CheckCircle2} label={t("dash.overview.accepted")} value={a?.filter((x) => x.status === "accepted").length} />
      </div>

      <Card className="mt-8 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-brand-soft/60 via-surface to-surface p-6">
        <div className="max-w-lg">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <Sparkles className="size-4 text-accent" /> {t("dash.overview.matchTitle")}
          </p>
          <p className="mt-1 text-sm text-muted">{t("dash.overview.matchBody")}</p>
        </div>
        <Button asChild variant="brand">
          <Link href="/dashboard/matches">{t("dash.overview.matchCta")}</Link>
        </Button>
      </Card>

      <h2 className="mt-10 mb-4 text-lg font-semibold tracking-tight text-ink">{t("dash.overview.recentApplications")}</h2>
      {a && a.length === 0 ? (
        <Card className="p-6 text-sm text-muted">
          {t("dash.overview.noApplications")}{" "}
          <Link className="font-medium text-brand-text hover:underline" href="/positions">
            {t("dash.overview.browse")}
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-line">
          {a ? (
            a.slice(0, 4).map((x) => (
              <Link key={x.id} href={`/positions/${x.position_id}`} className="flex items-center justify-between gap-4 p-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-surface-2/60">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{x.position.title}</p>
                  <p className="truncate text-sm text-muted">
                    {x.position.lab.name} · {fmt.relative(x.created_at)}
                  </p>
                </div>
                <Badge tone={APP_TONE[x.status]}>{labels.appStatus(x.status)}</Badge>
              </Link>
            ))
          ) : (
            <Skeleton className="h-20" />
          )}
        </Card>
      )}

      <h2 className="mt-10 mb-4 text-lg font-semibold tracking-tight text-ink">{t("dash.overview.newForYou")}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{suggested.data?.slice(0, 4).map((p) => <PositionCard key={p.id} p={p} />)}</div>
    </>
  );
}

function ProfessorHome({ name, verified }: { name: string; verified: boolean }) {
  const { t, tp } = useI18n();
  const lab = useApi("my-lab", async () => {
    try {
      return await api.myLab();
    } catch {
      return null;
    }
  });
  const positions = useApi("my-positions", async () => {
    try {
      return await api.myPositions();
    } catch {
      return [];
    }
  });
  const list = positions.data;
  const open = list?.filter((p) => p.status === "open").length;
  const applicants = list?.reduce((n, p) => n + p.applicant_count, 0);
  const displayName = name.replace(/^prof\.?\s+/i, "");

  return (
    <>
      <PageHeader
        title={t("dash.welcomeProfessor", { name: displayName })}
        description={t("dash.overview.professorSubtitle")}
        action={
          lab.data ? (
            <Button asChild>
              <Link href="/dashboard/positions/new">
                <Plus /> {t("dash.overview.newPosition")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      {!verified && (
        <Alert tone="warning" title={t("dash.overview.unverifiedTitle")} className="mb-6">
          {t("dash.overview.unverifiedBody")}
        </Alert>
      )}

      {lab.data === null && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-brand/30 bg-brand-soft/50 p-5">
          <div>
            <p className="font-semibold text-ink">{t("dash.overview.createLabTitle")}</p>
            <p className="mt-0.5 text-sm text-muted">{t("dash.overview.createLabBody")}</p>
          </div>
          <Button asChild variant="brand">
            <Link href="/dashboard/lab">{t("dash.overview.createLabCta")}</Link>
          </Button>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Briefcase} label={t("dash.overview.openPositions")} value={open} />
        <Stat icon={UsersRound} label={t("dash.overview.applicants")} value={applicants} />
        <Stat icon={FlaskConical} label={t("dash.overview.lab")} value={lab.data === undefined ? undefined : lab.data ? t("dash.overview.live") : t("dash.overview.notSetUp")} />
      </div>

      <Card className="mt-8 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-accent-soft/60 via-surface to-surface p-6">
        <div className="max-w-lg">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <Sparkles className="size-4 text-accent" /> {t("dash.overview.talentTitle")}
          </p>
          <p className="mt-1 text-sm text-muted">{t("dash.overview.talentBody")}</p>
        </div>
        <Button asChild variant="brand">
          <Link href="/dashboard/talent">{t("dash.overview.talentCta")}</Link>
        </Button>
      </Card>

      <h2 className="mt-10 mb-4 text-lg font-semibold tracking-tight text-ink">{t("dash.overview.yourPositions")}</h2>
      {list && list.length === 0 ? (
        <Card className="p-6 text-sm text-muted">{t("dash.overview.noPositions")}</Card>
      ) : (
        <Card className="divide-y divide-line">
          {list ? (
            list.slice(0, 5).map((p) => (
              <Link key={p.id} href={`/dashboard/positions/${p.id}`} className="flex items-center justify-between gap-4 p-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-surface-2/60">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{p.title}</p>
                  <p className="text-sm text-muted">{tp("dash.overview.applicantsCount", p.applicant_count)}</p>
                </div>
                <Badge tone={p.status === "open" ? "good" : "neutral"}>{p.status === "open" ? t("dash.positions.open") : t("dash.positions.closed")}</Badge>
              </Link>
            ))
          ) : (
            <Skeleton className="h-20" />
          )}
        </Card>
      )}
    </>
  );
}
