"use client";

import { Check, Copy, Gift, Link2, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/layout";
import { Alert, Badge, Card, Progress, Skeleton } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi, useErrorText } from "@/lib/hooks";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export default function BillingPage() {
  return (
    <Suspense>
      <BillingInner />
    </Suspense>
  );
}

function BillingInner() {
  const { t, tp, fmt } = useI18n();
  const { refresh } = useAuth();
  const errorText = useErrorText();
  const success = useSearchParams().get("checkout") === "success";
  const billing = useApi("billing", () => api.billing());
  const b = billing.data;
  const [code, setCode] = useState("");

  // Right after Stripe redirects back, the webhook may take a moment — refresh the account.
  useEffect(() => {
    if (success) void refresh().then(() => billing.reload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(t("dash.billing.copied"));
  };
  const redeem = async () => {
    try {
      const r = await api.redeem(code.trim());
      toast.success(t("dash.billing.redeemedOk", { days: r.reward_days }));
      setCode("");
      await refresh();
      billing.reload();
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <>
      <PageHeader title={t("dash.billing.title")} description={t("dash.billing.subtitle")} />
      {success && <Alert tone="success" className="mb-6">{t("dash.billing.checkoutSuccess")}</Alert>}
      {b?.checkout_mode === "dev" && <Alert tone="info" className="mb-6">{t("dash.billing.devMode")}</Alert>}

      {!b ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="max-w-3xl space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted">{t("dash.billing.currentPlan")}</p>
                <p className="mt-1 flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-ink">
                  {b.is_pro ? t(`dash.billing.plan.${b.plan}` as MessageKey) : t("dash.billing.plan.free")}
                  {b.is_pro && (
                    <Badge tone="brand">
                      <Sparkles /> {t("common.pro")}
                    </Badge>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {!b.is_pro ? t("dash.billing.freeNote") : b.plan === "lifetime" ? t("dash.billing.lifetimeNote") : b.pro_until ? t("dash.billing.activeUntil", { date: fmt.date(b.pro_until) }) : ""}
                </p>
              </div>
              <Button asChild variant={b.is_pro && b.plan === "lifetime" ? "secondary" : "brand"}>
                <Link href="/pricing">{t("dash.billing.upgrade")}</Link>
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-5 text-base font-semibold text-ink">{t("dash.billing.usage")}</h2>
            <ul className="space-y-5">
              {b.usage.map((u) => (
                <li key={u.feature}>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink">{t(`dash.billing.features.${u.feature}` as MessageKey)}</span>
                    <span className="tabular-nums text-muted">
                      {u.limit == null ? t("dash.billing.unlimited") : t("dash.billing.usageItem", { used: u.used, limit: u.limit })}
                    </span>
                  </div>
                  {u.limit != null && <Progress value={(u.used / Math.max(u.limit, 1)) * 100} className="mt-2" />}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-text">
              <Gift className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-ink">{t("dash.billing.referral")}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("dash.billing.referralBody", { days: b.referral_reward_days })}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-line-2 bg-surface-2 px-4 py-2.5">
                <p className="text-[0.6875rem] text-faint">{t("dash.billing.yourCode")}</p>
                <p className="font-mono text-lg font-semibold tracking-[0.2em] text-ink" dir="ltr">{b.referral_code}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copy(b.referral_code)}>
                <Copy /> {t("dash.billing.copyCode")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => copy(`${window.location.origin}/register?ref=${b.referral_code}`)}>
                <Link2 /> {t("dash.billing.copyLink")}
              </Button>
            </div>
            {b.referrals_redeemed > 0 && (
              <p className="mt-4 flex items-center gap-2 text-sm text-good-text">
                <Check className="size-4" /> {tp("dash.billing.redeemed", b.referrals_redeemed)}
              </p>
            )}
            <div className="mt-6 border-t border-line pt-5">
              <p className="mb-2 text-sm font-medium text-ink">{t("dash.billing.redeem")}</p>
              <div className="flex max-w-sm gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t("dash.billing.redeemPlaceholder")} maxLength={16} className="font-mono tracking-wider uppercase" dir="ltr" />
                <Button variant="secondary" onClick={redeem} disabled={code.trim().length < 3}>
                  {t("dash.billing.redeemCta")}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
