"use client";

import { ArrowLeft, Check, ExternalLink, Inbox, Mail, Pencil, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StyleDisplay } from "@/components/position/style-display";
import { Button } from "@/components/ui/button";
import { Alert, Avatar, Badge, Card, Chip, EmptyState, Skeleton } from "@/components/ui/surface";
import { api, type Applicant } from "@/lib/api";
import { useApi, useErrorText } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { APP_TONE, COMP_TONE, kw, useLabels } from "@/lib/labels";

export default function PositionApplicants() {
  const { t, fmt } = useI18n();
  const labels = useLabels();
  const errorText = useErrorText();
  const { id } = useParams<{ id: string }>();
  const position = useApi(`position-${id}`, () => api.position(id));
  const applicants = useApi(`applicants-${id}`, () => api.applicants(id));
  const p = position.data;
  const list = applicants.data;
  const [busy, setBusy] = useState<number | null>(null);

  const decide = async (a: Applicant, status: "accepted" | "rejected") => {
    setBusy(a.id);
    try {
      await api.decide(a.id, status);
      applicants.reload();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Link href="/dashboard/positions" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("dash.positions.title")}
      </Link>
      {p ? (
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="display text-[clamp(1.7rem,3vw,2.3rem)] text-ink">{p.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={p.status === "open" ? "good" : "neutral"}>{p.status === "open" ? t("dash.positions.open") : t("dash.positions.closed")}</Badge>
              <Badge tone={COMP_TONE[p.compensation]}>{labels.compensation(p.compensation)}</Badge>
              <Link href={`/positions/${p.id}`} className="inline-flex items-center gap-1 text-sm text-brand-text hover:underline">
                {t("dash.positions.viewPublic")} <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/dashboard/positions/${p.id}/edit`}>
              <Pencil /> {t("dash.positions.edit")}
            </Link>
          </Button>
        </div>
      ) : (
        <Skeleton className="mb-8 h-20" />
      )}

      <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">
        {t("dash.positions.applicants")} {list && <span className="text-faint">({list.length})</span>}
      </h2>
      {applicants.error != null && <div className="mb-4"><Alert>{errorText(applicants.error)}</Alert></div>}

      {!list ? (
        <Skeleton className="h-40" />
      ) : list.length === 0 ? (
        <EmptyState icon={<Inbox />} title={t("dash.positions.noApplicants")} action={<Button asChild variant="brand"><Link href="/dashboard/talent">{t("dash.overview.talentCta")}</Link></Button>}>
          {t("dash.positions.noApplicantsBody")}
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {list.map((a) => (
            <Card key={a.id} className="p-6">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={a.student.full_name} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{a.student.full_name}</p>
                  <p className="text-sm text-muted">
                    {[a.profile?.major, labels.year(a.profile?.year), a.profile?.university].filter(Boolean).join(" · ") || t("dash.positions.profileIncomplete")}
                  </p>
                </div>
                <div className="text-end">
                  <div className="flex flex-wrap justify-end gap-2">
                    {a.invited && <Badge tone="accent">{t("dash.positions.invitedBadge")}</Badge>}
                    <Badge tone={APP_TONE[a.status]}>{labels.appStatus(a.status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-faint">{fmt.relative(a.created_at)}</p>
                </div>
              </div>

              <p className="mt-4 rounded-xl bg-surface-2/70 p-4 text-sm leading-relaxed whitespace-pre-line text-ink/90" dir="auto">
                {a.message}
              </p>
              {a.profile?.bio && <p className="mt-3 text-sm leading-relaxed text-muted">{a.profile.bio}</p>}
              {kw(a.profile?.skills).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {kw(a.profile?.skills).map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
              )}
              {a.profile?.work_style && (
                <details className="mt-4 rounded-xl border border-line p-4">
                  <summary className="cursor-pointer text-sm font-medium text-ink">{t("dash.profile.workStyle")}</summary>
                  <div className="mt-4">
                    <StyleDisplay style={a.profile.work_style} />
                  </div>
                </details>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <a href={`mailto:${a.student.email}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand-text" dir="ltr">
                  <Mail className="size-4" /> {a.student.email}
                </a>
                {a.profile?.resume_url && (
                  <a href={a.profile.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-text hover:underline">
                    <ExternalLink className="size-4" /> {t("dash.positions.resume")}
                  </a>
                )}
                {a.status !== "withdrawn" && (
                  <div className="ms-auto flex gap-2">
                    <Button size="sm" variant="danger" disabled={a.status === "rejected"} loading={busy === a.id} onClick={() => decide(a, "rejected")}>
                      <X /> {t("dash.positions.decline")}
                    </Button>
                    <Button size="sm" variant="brand" disabled={a.status === "accepted"} loading={busy === a.id} onClick={() => decide(a, "accepted")}>
                      <Check /> {t("dash.positions.accept")}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
