"use client";

import { Briefcase, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/layout";
import { Alert, Badge, Card, EmptyState, Skeleton } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { useApi, useErrorText } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { COMP_TONE, useLabels } from "@/lib/labels";
import { ApiError } from "@/lib/api";

export default function MyPositions() {
  const { t, tp, fmt } = useI18n();
  const labels = useLabels();
  const errorText = useErrorText();
  const { data, error, reload } = useApi("my-positions", () => api.myPositions());

  const toggle = async (id: number, open: boolean) => {
    try {
      await (open ? api.closePosition(id) : api.reopenPosition(id));
      reload();
    } catch (e) {
      toast.error(errorText(e));
    }
  };
  const remove = async (id: number) => {
    if (!confirm(t("dash.positions.deleteConfirm"))) return;
    try {
      await api.deletePosition(id);
      reload();
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const needsLab = error instanceof ApiError && error.code === "lab_required";
  return (
    <>
      <PageHeader
        title={t("dash.positions.title")}
        description={t("dash.positions.subtitle")}
        action={
          <Button asChild>
            <Link href="/dashboard/positions/new">
              <Plus /> {t("dash.positions.new")}
            </Link>
          </Button>
        }
      />
      {error != null && !needsLab && <Alert>{errorText(error)}</Alert>}
      {!data && !error ? (
        <Skeleton className="h-40" />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          title={t("dash.positions.emptyTitle")}
          action={
            <Button asChild>
              <Link href="/dashboard/positions/new">{t("dash.positions.post")}</Link>
            </Button>
          }
        >
          {needsLab ? t("dash.positions.emptyLab") : t("dash.positions.emptyBody")}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {data.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/positions/${p.id}`} className="font-semibold text-ink hover:text-brand-text">
                    {p.title}
                  </Link>
                  <Badge tone={p.status === "open" ? "good" : "neutral"}>{p.status === "open" ? t("dash.positions.open") : t("dash.positions.closed")}</Badge>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <Badge tone={COMP_TONE[p.compensation]}>{labels.compensation(p.compensation)}</Badge>
                  {t("dash.positions.postedAgo", { when: fmt.relative(p.created_at) })}
                </p>
              </div>
              <Link href={`/dashboard/positions/${p.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-text">
                <Users className="size-4" /> {tp("dash.overview.applicantsCount", p.applicant_count)}
              </Link>
              <div className="flex gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/dashboard/positions/${p.id}/edit`}>
                    <Pencil /> {t("dash.positions.edit")}
                  </Link>
                </Button>
                <Button variant={p.status === "open" ? "danger" : "secondary"} size="sm" onClick={() => toggle(p.id, p.status === "open")}>
                  {p.status === "open" ? t("dash.positions.close") : t("dash.positions.reopen")}
                </Button>
                {p.applicant_count === 0 && (
                  <Button variant="ghost" size="iconSm" aria-label={t("dash.positions.delete")} onClick={() => remove(p.id)}>
                    <Trash2 className="text-bad" />
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
