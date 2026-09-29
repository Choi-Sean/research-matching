"use client";

import { Check, GraduationCap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Container, PageHeader } from "@/components/ui/layout";
import { Alert, Card } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useErrorText } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n/provider";

export function ContactView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const errorText = useErrorText();
  const [name, setName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.contact({ name: name.trim(), email: email.trim(), message: message.trim() });
      setDone(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-4xl py-10 sm:py-14">
      <PageHeader title={t("community.contact.title")} description={t("community.contact.subtitle")} />
      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <Card className="p-6 sm:p-7">
          {done ? (
            <div className="py-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-good-soft text-good-text">
                <Check className="size-6" />
              </span>
              <p className="mt-4 font-semibold text-ink">{t("community.contact.sent")}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("community.contact.name")}>
                  <Input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </Field>
                <Field label={t("community.contact.email")}>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" dir="ltr" />
                </Field>
              </div>
              <Field label={t("community.contact.message")}>
                <Textarea required minLength={5} maxLength={5000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("community.contact.messagePlaceholder")} className="min-h-44" />
              </Field>
              {error && <Alert>{error}</Alert>}
              <Button type="submit" variant="brand" size="lg" loading={busy}>
                {t("community.contact.send")}
              </Button>
              <p className="text-xs text-faint">{t("community.contact.privacy")}</p>
            </form>
          )}
        </Card>
        <Card className="self-start p-6">
          <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-text">
            <GraduationCap className="size-5" />
          </span>
          <h2 className="mt-4 font-semibold text-ink">{t("community.contact.professorsTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("community.contact.professorsBody")}</p>
        </Card>
      </div>
    </Container>
  );
}
