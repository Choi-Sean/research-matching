"use client";

import { Check, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/ui/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { Alert, Avatar, Badge, Card, EmptyState, Skeleton } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi, useErrorText } from "@/lib/hooks";
import type { MessageKey } from "@/lib/i18n/core";
import { useI18n } from "@/lib/i18n/provider";

export function AdminView() {
  const { t, fmt } = useI18n();
  const { user, loading } = useAuth();
  const errorText = useErrorText();
  const enabled = !!user?.is_admin;
  const overview = useApi(enabled ? "admin-overview" : null, () => api.adminOverview());
  const [pendingOnly, setPendingOnly] = useState(false);
  const professors = useApi(enabled ? `admin-professors-${pendingOnly}` : null, () => api.adminProfessors(pendingOnly));
  const waitlist = useApi(enabled ? "admin-waitlist" : null, () => api.adminWaitlist());
  const contact = useApi(enabled ? "admin-contact" : null, () => api.adminContact());

  if (loading) return <Container className="py-12"><Skeleton className="h-96" /></Container>;
  if (!enabled)
    return (
      <Container className="py-24">
        <EmptyState icon={<ShieldCheck />} title={t("dash.admin.notAdmin")} />
      </Container>
    );

  const verify = async (id: number, verified: boolean) => {
    try {
      await api.adminVerify(id, verified);
      toast.success(verified ? t("dash.admin.verifiedToast") : t("dash.admin.revokedToast"));
      professors.reload();
      overview.reload();
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader title={t("dash.admin.title")} description={t("dash.admin.subtitle")} />

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {overview.data
          ? (Object.entries(overview.data) as [string, number][]).map(([k, v]) => (
              <Card key={k} className="p-4">
                <p className="text-2xl font-semibold tabular-nums text-ink">{v}</p>
                <p className="text-xs text-muted">{t(`dash.admin.stats.${k}` as MessageKey)}</p>
              </Card>
            ))
          : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20" />)}
      </div>

      <Tabs defaultValue="professors">
        <TabsList>
          <TabsTrigger value="professors">{t("dash.admin.verification")}</TabsTrigger>
          <TabsTrigger value="waitlist">{t("dash.admin.waitlist")}</TabsTrigger>
          <TabsTrigger value="contact">{t("dash.admin.contact")}</TabsTrigger>
        </TabsList>

        <TabsContent value="professors" className="space-y-4">
          <label className="inline-flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} className="size-4 accent-[var(--brand)]" />
            {t("dash.admin.onlyPending")}
          </label>
          {professors.error != null && <Alert>{errorText(professors.error)}</Alert>}
          {!professors.data ? (
            <Skeleton className="h-40" />
          ) : professors.data.length === 0 ? (
            <p className="text-sm text-muted">{t("dash.admin.empty")}</p>
          ) : (
            <div className="space-y-3">
              {professors.data.map((p) => (
                <Card key={p.id} className="flex flex-wrap items-center gap-4 p-5">
                  <Avatar name={p.full_name} size={42} />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="font-semibold text-ink">{p.full_name}</p>
                    <p className="text-sm text-muted" dir="ltr">{p.email}</p>
                    <p className="mt-0.5 text-xs text-faint">
                      {[p.lab_name, p.university].filter(Boolean).join(" · ")}
                      {p.website && (
                        <>
                          {" · "}
                          <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-brand-text hover:underline">
                            {p.website}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <Badge tone={p.verified ? "good" : "warn"}>{p.verified ? t("dash.admin.verifiedAt") : t("dash.admin.pendingBadge")}</Badge>
                  {p.verified ? (
                    <Button variant="ghost" size="sm" onClick={() => verify(p.id, false)}>
                      <X /> {t("dash.admin.unverify")}
                    </Button>
                  ) : (
                    <Button variant="brand" size="sm" onClick={() => verify(p.id, true)}>
                      <Check /> {t("dash.admin.verify")}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="waitlist">
          {!waitlist.data ? (
            <Skeleton className="h-32" />
          ) : waitlist.data.length === 0 ? (
            <p className="text-sm text-muted">{t("dash.admin.empty")}</p>
          ) : (
            <Card className="divide-y divide-line">
              {waitlist.data.map((w) => (
                <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                  <span className="font-medium text-ink" dir="ltr">{w.email}</span>
                  <span className="text-faint">
                    {w.feature} · {w.locale} · {fmt.date(w.created_at)}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contact">
          {!contact.data ? (
            <Skeleton className="h-32" />
          ) : contact.data.length === 0 ? (
            <p className="text-sm text-muted">{t("dash.admin.empty")}</p>
          ) : (
            <div className="space-y-3">
              {contact.data.map((c) => (
                <Card key={c.id} className="p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-ink">
                      {c.name} <span className="font-normal text-muted" dir="ltr">&lt;{c.email}&gt;</span>
                    </p>
                    <span className="text-xs text-faint">{fmt.date(c.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink/90" dir="auto">{c.message}</p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Container>
  );
}
