"use client";

import { Briefcase, GraduationCap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/surface";
import type { Role } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useErrorText } from "@/lib/hooks";
import { Link, useLocaleRouter } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export function RegisterForm() {
  const { t, rich, locale } = useI18n();
  const { register } = useAuth();
  const errorText = useErrorText();
  const router = useLocaleRouter();
  const sp = useSearchParams();
  const [role, setRole] = useState<Role>(sp.get("role") === "professor" ? "professor" : "student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState(sp.get("ref") ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({ email, password, full_name: fullName, role, locale, referral_code: referral.trim() || undefined });
      const next = sp.get("next");
      router.push(next?.startsWith("/") && !next.startsWith("//") ? next : role === "professor" ? "/dashboard/lab" : "/dashboard/profile");
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  const roles = [
    { value: "student" as const, icon: GraduationCap, label: t("auth.register.student"), desc: t("auth.register.studentDesc") },
    { value: "professor" as const, icon: Briefcase, label: t("auth.register.professor"), desc: t("auth.register.professorDesc") },
  ];

  return (
    <AuthShell title={t("auth.register.title")} subtitle={t("auth.register.subtitle")}>
      <form onSubmit={submit} className="space-y-5">
        <div role="radiogroup" aria-label={t("auth.register.iAm")} className="grid grid-cols-2 gap-3">
          {roles.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={role === r.value}
              onClick={() => setRole(r.value)}
              className={cn(
                "rounded-2xl border p-4 text-start transition-all",
                role === r.value ? "border-brand bg-brand-soft/60 ring-4 ring-brand/10" : "border-line-2 bg-surface hover:border-faint/60",
              )}
            >
              <r.icon className={cn("size-5", role === r.value ? "text-brand-text" : "text-faint")} />
              <p className="mt-2.5 text-sm font-semibold text-ink">{r.label}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted">{r.desc}</p>
            </button>
          ))}
        </div>

        <Field label={t("auth.register.fullName")}>
          <Input required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={role === "professor" ? t("auth.register.fullNamePlaceholderProfessor") : t("auth.register.fullNamePlaceholderStudent")} />
        </Field>
        <Field label={t("auth.register.email")} hint={t("auth.register.emailHint")}>
          <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.login.emailPlaceholder")} dir="ltr" />
        </Field>
        <Field label={t("auth.register.password")} hint={t("auth.register.passwordHint")}>
          <Input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
        </Field>
        <Field label={t("auth.register.referral")} optional={t("common.optional")} hint={t("auth.register.referralHint")}>
          <Input value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} maxLength={16} className="font-mono tracking-wider uppercase" dir="ltr" />
        </Field>

        {role === "professor" && <Alert tone="info">{t("auth.register.professorNote")}</Alert>}
        {error && <Alert>{error}</Alert>}
        <Button type="submit" size="lg" loading={busy} className="w-full">
          {t("auth.register.submit")}
        </Button>
        <p className="text-center text-xs leading-relaxed text-faint">
          {rich("auth.register.consent", {
            terms: (c) => (
              <Link href="/terms" className="underline hover:text-ink">
                {c}
              </Link>
            ),
            privacy: (c) => (
              <Link href="/privacy" className="underline hover:text-ink">
                {c}
              </Link>
            ),
          })}
        </p>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.register.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-brand-text hover:underline">
          {t("auth.register.signIn")}
        </Link>
      </p>
    </AuthShell>
  );
}
