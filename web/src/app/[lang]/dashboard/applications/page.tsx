"use client";

import { FileText, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/layout";
import { Alert, Avatar, Badge, Card, EmptyState, Skeleton } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { useApi, useErrorText } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { APP_TONE, useLabels } from "@/lib/labels";

export default function ApplicationsPage() {
  const { t, fmt } = useI18n();
  const labels = useLabels();
  const errorText = useErrorText();
  const { data, error, reload } = useApi("my-applications", () => api.myApplications());
  const [busy, setBusy] = useState<number | null>(null);

  const withdraw = async (id: number) => {
    if (!confirm(t("dash.applications.withdrawConfirm"))) return;
    setBusy(id);
    try {
      await api.withdraw(id);
      toast.success(t("dash.applications.withdrawn"));
      reload();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader title={t("dash.applications.title")} description={t("dash.applications.subtitle")} />
      {error != null && <Alert>{errorText(error)}</Alert>}
      {!data ? (
        <Skeleton className="h-40" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title={t("dash.applications.emptyTitle")}
          action={
            <Button asChild>
              <Link href="/positions">{t("dash.applications.browse")}</Link>
            </Button>
          }
        >
          {t("dash.applications.emptyBody")}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={a.position.lab.owner_name} size={44} />
                <div className="min-w-0 flex-1">
                  <Link href={`/positions/${a.position_id}`} className="font-semibold text-ink hover:text-brand-text">
                    {a.position.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {a.position.lab.name} · {a.position.lab.university}
                  </p>
                  <p className="mt-0.5 text-xs text-faint">
                    {t("dash.applications.applied", { when: fmt.relative(a.created_at) })}
                    {a.decided_at && ` · ${t("dash.applications.decided", { when: fmt.relative(a.decided_at) })}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {a.invited && <Badge tone="accent">{t("dash.applications.invited")}</Badge>}
                  <Badge tone={APP_TONE[a.status]}>{labels.appStatus(a.status)}</Badge>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 rounded-xl bg-surface-2/70 p-3.5 text-sm leading-relaxed text-muted" dir="auto">
                “{a.message}”
              </p>
              {a.status === "pending" && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" loading={busy === a.id} onClick={() => withdraw(a.id)}>
                    <Undo2 /> {t("dash.applications.withdraw")}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
