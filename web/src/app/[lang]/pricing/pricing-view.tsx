"use client";

import { Check, Gift, Mail, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Container } from "@/components/ui/layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/overlay";
import { Alert, Badge, Card, Skeleton } from "@/components/ui/surface";
import { api, type Plan, type PlanId } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useApi, useErrorText } from "@/lib/hooks";
import type { MessageKey } from "@/lib/i18n/core";
import { Link, useLocaleRouter } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export function PricingView() {
  const { t, fmt, locale } = useI18n();
  const { user, refresh } = useAuth();
  const errorText = useErrorText();
  const router = useLocaleRouter();
  const cancelled = useSearchParams().get("checkout") === "cancelled";
  const plans = useApi("plans", () => api.plans());
  const billing = useApi(user ? "billing" : null, () => api.billing());
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [waitlisted, setWaitlisted] = useState(false);

  const buy = async (plan: PlanId) => {
    if (plan === "free") return router.push(user ? "/dashboard" : "/register");
    if (!user) return router.push(`/login?next=/pricing`);
    setBusy(plan);
    try {
      const r = await api.checkout(plan, locale);
      if (r.url) window.location.assign(r.url);
      else {
        toast.success(t("pricing.activated"));
        await refresh();
        billing.reload();
      }
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const redeem = async () => {
    try {
      await api.redeem(code.trim());
      toast.success(t("pricing.referral.redeemed"));
      setCode("");
      await refresh();
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.joinWaitlist(email.trim(), locale);
      setWaitlisted(true);
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const current = user ? (user.is_pro ? user.plan : "free") : null;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow mb-4">{t("pricing.eyebrow")}</p>
        <h1 className="display text-[clamp(2.2rem,5vw,3.6rem)] text-ink">{t("pricing.title")}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">{t("pricing.subtitle")}</p>
      </div>

      {cancelled && <Alert tone="info" className="mx-auto mt-8 max-w-xl">{t("pricing.cancelled")}</Alert>}
      {billing.data?.checkout_mode === "dev" && <Alert tone="info" className="mx-auto mt-8 max-w-xl">{t("pricing.devMode")}</Alert>}

      <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {!plans.data
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[30rem]" />)
          : plans.data.map((p) => <PlanCard key={p.id} plan={p} current={current === p.id} busy={busy === p.id} onBuy={() => buy(p.id)} fmt={fmt} />)}
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-faint">
        <ShieldCheck className="size-4" /> {t("pricing.payments")}
      </p>

      <div className="mt-20 grid gap-5 lg:grid-cols-2">
        <Card className="p-7">
          <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent-text">
            <Gift className="size-5" />
          </span>
          <h2 className="mt-5 text-xl font-semibold tracking-tight text-ink">{t("pricing.referral.title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("pricing.referral.body")}</p>
          <p className="mt-5 text-sm font-medium text-ink">{t("pricing.referral.haveCode")}</p>
          {user ? (
            <div className="mt-2 flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t("pricing.referral.placeholder")} maxLength={16} className="font-mono tracking-wider uppercase" dir="ltr" />
              <Button variant="secondary" onClick={redeem} disabled={code.trim().length < 3}>
                {t("pricing.referral.redeem")}
              </Button>
            </div>
          ) : (
            <Button asChild variant="secondary" className="mt-2">
              <Link href="/login?next=/pricing">{t("pricing.referral.signIn")}</Link>
            </Button>
          )}
        </Card>

        <Card className="p-7">
          <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand-text">
            <Mail className="size-5" />
          </span>
          <h2 className="mt-5 text-xl font-semibold tracking-tight text-ink">{t("pricing.waitlist.title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("pricing.waitlist.body")}</p>
          {waitlisted ? (
            <p className="mt-5 flex items-center gap-2 text-sm font-medium text-good-text">
              <Check className="size-4" /> {t("pricing.waitlist.joined")}
            </p>
          ) : (
            <form onSubmit={join} className="mt-5 flex gap-2">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("pricing.waitlist.placeholder")} dir="ltr" />
              <Button type="submit" variant="primary">
                {t("pricing.waitlist.join")}
              </Button>
            </form>
          )}
        </Card>
      </div>

      <div className="mx-auto mt-20 max-w-3xl">
        <h2 className="display mb-8 text-center text-[clamp(1.6rem,3vw,2.2rem)] text-ink">{t("pricing.faq.title")}</h2>
        <Accordion type="single" collapsible className="rounded-3xl border border-line bg-surface px-6 shadow-card sm:px-8">
          {(["1", "2", "3", "4", "5"] as const).map((n) => (
            <AccordionItem key={n} value={`q${n}`}>
              <AccordionTrigger>{t(`pricing.faq.q${n}`)}</AccordionTrigger>
              <AccordionContent>{t(`pricing.faq.a${n}`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Container>
  );
}

function PlanCard({
  plan,
  current,
  busy,
  onBuy,
  fmt,
}: {
  plan: Plan;
  current: boolean;
  busy: boolean;
  onBuy: () => void;
  fmt: ReturnType<typeof useI18n>["fmt"];
}) {
  const { t } = useI18n();
  const id = plan.id;
  const price = plan.price_cents === 0 ? fmt.currency(0, plan.currency.toUpperCase()) : fmt.currency(plan.price_cents, plan.currency.toUpperCase());
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border p-7 shadow-card transition-shadow hover:shadow-pop",
        plan.highlighted ? "border-brand bg-surface ring-4 ring-brand/10" : "border-line bg-surface",
      )}
    >
      {plan.highlighted && (
        <Badge tone="brand" className="absolute -top-3 start-7 bg-brand text-brand-fg">
          {t("pricing.plans.semester.badge")}
        </Badge>
      )}
      <h3 className="text-base font-semibold text-ink">{t(`pricing.plans.${id}.name` as MessageKey)}</h3>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="display text-5xl text-ink tabular-nums">{price}</span>
      </p>
      <p className="mt-1 text-sm text-muted">{t(`pricing.plans.${id}.desc` as MessageKey)}</p>
      <ul className="mt-7 flex-1 space-y-3">
        {plan.features.map((f) => {
          const header = f.startsWith("everything_");
          return (
            <li key={f} className={cn("flex gap-2.5 text-sm", header ? "font-semibold text-ink" : "text-ink/85")}>
              {!header && <Check className="mt-0.5 size-4 shrink-0 text-good" />}
              {t(`pricing.features.${f}` as MessageKey)}
            </li>
          );
        })}
      </ul>
      <Button variant={plan.highlighted ? "brand" : "secondary"} size="lg" className="mt-8 w-full" onClick={onBuy} loading={busy} disabled={current}>
        {current ? t("pricing.cta.current") : t(`pricing.cta.${id}` as MessageKey)}
      </Button>
    </div>
  );
}
