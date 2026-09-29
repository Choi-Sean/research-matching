"use client";

import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/layout";
import { Alert, Avatar, Badge, Card, EmptyState, Skeleton } from "@/components/ui/surface";
import { api, type Invitation } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi, useErrorText } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { INV_TONE, useLabels } from "@/lib/labels";

export default function InvitationsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "student" ? <StudentInvitations /> : <ProfessorInvitations />;
}

function StudentInvitations() {
  const { t, fmt } = useI18n();
  const labels = useLabels();
  const errorText = useErrorText();
  const { data, error, reload } = useApi("my-invitations", () => api.myInvitations());
  const [note, setNote] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const respond = async (inv: Invitation, action: "accept" | "decline") => {
    setBusy(inv.id);
    try {
      await api.respondInvitation(inv.id, action, note[inv.id]?.trim() || undefined);
      toast.success(action === "accept" ? t("dash.invitations.accepted") : t("dash.invitations.declined"));
      reload();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader title={t("dash.invitations.title")} description={t("dash.invitations.subtitleStudent")} />
      {error != null && <Alert>{errorText(error)}</Alert>}
      {!data ? (
        <Skeleton className="h-40" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Mail />}
          title={t("dash.invitations.emptyStudentTitle")}
          action={
            <Button asChild variant="secondary">
              <Link href="/dashboard/profile#visibility">{t("dash.overview.discoverCta")}</Link>
            </Button>
          }
        >
          {t("dash.invitations.emptyStudentBody")}
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {data.map((inv) => (
            <Card key={inv.id} className="p-6">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={inv.professor.full_name} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted">{t("dash.invitations.from", { name: inv.professor.full_name })}</p>
                  <Link href={`/positions/${inv.position_id}`} className="mt-0.5 block text-lg font-semibold tracking-tight text-ink hover:text-brand-text">
                    {inv.position.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {inv.position.lab.name} · {inv.position.lab.university}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {inv.match_score != null && <Badge tone="good">{t("dash.invitations.match", { score: inv.match_score })}</Badge>}
                  <Badge tone={INV_TONE[inv.status]}>{labels.invStatus(inv.status)}</Badge>
                </div>
              </div>
              <blockquote className="mt-4 rounded-xl bg-surface-2/70 p-4 text-sm leading-relaxed text-ink/90" dir="auto">
                {inv.message}
              </blockquote>
              <p className="mt-2 text-xs text-faint">{t("dash.invitations.receivedAgo", { when: fmt.relative(inv.created_at) })}</p>
              {inv.status === "pending" && (
                <div className="mt-4 space-y-3">
                  <Textarea
                    value={note[inv.id] ?? ""}
                    onChange={(e) => setNote((n) => ({ ...n, [inv.id]: e.target.value }))}
                    placeholder={t("dash.invitations.replyPlaceholder")}
                    className="min-h-20"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="brand" loading={busy === inv.id} onClick={() => respond(inv, "accept")}>
                      <Send /> {t("dash.invitations.accept")}
                    </Button>
                    <Button variant="ghost" disabled={busy === inv.id} onClick={() => respond(inv, "decline")}>
                      {t("dash.invitations.decline")}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function ProfessorInvitations() {
  const { t, fmt } = useI18n();
  const labels = useLabels();
  const errorText = useErrorText();
  const { data, error, reload } = useApi("sent-invitations", () => api.sentInvitations());
  const [busy, setBusy] = useState<number | null>(null);

  const withdraw = async (id: number) => {
    setBusy(id);
    try {
      await api.withdrawInvitation(id);
      reload();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title={t("dash.invitations.title")}
        description={t("dash.invitations.subtitleProfessor")}
        action={
          <Button asChild>
            <Link href="/dashboard/talent">{t("dash.invitations.findStudents")}</Link>
          </Button>
        }
      />
      {error != null && <Alert>{errorText(error)}</Alert>}
      {!data ? (
        <Skeleton className="h-40" />
      ) : data.length === 0 ? (
        <EmptyState icon={<Mail />} title={t("dash.invitations.emptyProfessorTitle")}>
          {t("dash.invitations.emptyProfessorBody")}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {data.map((inv) => (
            <Card key={inv.id} className="p-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={inv.student.full_name} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{t("dash.invitations.to", { name: inv.student.full_name })}</p>
                  <p className="truncate text-sm text-muted">
                    {inv.position.title} · {fmt.relative(inv.created_at)}
                  </p>
                </div>
                {inv.match_score != null && <Badge tone="good">{t("dash.invitations.match", { score: inv.match_score })}</Badge>}
                <Badge tone={INV_TONE[inv.status]}>{labels.invStatus(inv.status)}</Badge>
                {inv.status === "pending" && (
                  <Button variant="ghost" size="sm" loading={busy === inv.id} onClick={() => withdraw(inv.id)}>
                    {t("dash.invitations.withdraw")}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
