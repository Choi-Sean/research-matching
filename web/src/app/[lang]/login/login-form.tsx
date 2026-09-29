"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/surface";
import { useAuth } from "@/lib/auth";
import { useErrorText } from "@/lib/hooks";
import { Link, useLocaleRouter } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

const DEMOS = [
  ["student", "student@mit.edu"],
  ["professor", "prof1@mit.edu"],
  ["admin", "admin@labora.edu"],
] as const;

export function LoginForm() {
  const { t } = useI18n();
  const { login } = useAuth();
  const errorText = useErrorText();
  const router = useLocaleRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      <form onSubmit={submit} className="space-y-5">
        <Field label={t("auth.login.email")}>
          <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.login.emailPlaceholder")} dir="ltr" />
        </Field>
        <Field label={t("auth.login.password")}>
          <Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
        </Field>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" size="lg" variant="primary" loading={busy} className="w-full">
          {t("auth.login.submit")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.login.noAccount")}{" "}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-medium text-brand-text hover:underline">
          {t("auth.login.signUp")}
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-faint">
        {t("auth.login.forgot")}{" "}
        <Link href="/contact" className="underline hover:text-ink">
          {t("auth.login.forgotHelp")}
        </Link>
      </p>

      {process.env.NODE_ENV !== "production" && (
        <div className="mt-8 rounded-2xl border border-dashed border-line-2 p-4 text-xs text-muted">
          <p className="mb-2 font-medium text-ink">{t("auth.login.demo")}</p>
          <div className="flex flex-wrap gap-2">
            {DEMOS.map(([k, mail]) => (
              <button
                key={k}
                type="button"
                className="rounded-lg border border-line bg-surface px-3 py-1.5 font-medium text-ink hover:border-line-2 pointer-coarse:py-3"
                onClick={() => {
                  setEmail(mail);
                  setPassword("password123");
                }}
              >
                {t(`auth.login.demo${k[0].toUpperCase()}${k.slice(1)}` as "auth.login.demoStudent")}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
}
