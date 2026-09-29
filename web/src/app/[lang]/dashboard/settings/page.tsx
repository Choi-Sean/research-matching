"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/form";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/overlay";
import { PageHeader } from "@/components/ui/layout";
import { Alert, Card } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useErrorText } from "@/lib/hooks";
import { LOCALES } from "@/lib/i18n/config";
import { useLocaleRouter, useSwitchLocale } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const { user, refresh, logout } = useAuth();
  const errorText = useErrorText();
  const switchLocale = useSwitchLocale();
  const router = useLocaleRouter();
  const [name, setName] = useState(user?.full_name ?? "");
  const [lang, setLang] = useState(locale);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");
  const [delPw, setDelPw] = useState("");
  const [delError, setDelError] = useState("");
  const [delBusy, setDelBusy] = useState(false);

  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.updateMe({ full_name: name.trim(), locale: lang });
      await refresh();
      toast.success(t("dash.settings.saved"));
      if (lang !== locale) switchLocale(lang);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwBusy(true);
    setPwError("");
    try {
      await api.changePassword(current, next);
      toast.success(t("dash.settings.passwordChanged"));
      setCurrent("");
      setNext("");
    } catch (err) {
      setPwError(errorText(err));
    } finally {
      setPwBusy(false);
    }
  };

  const remove = async () => {
    setDelBusy(true);
    setDelError("");
    try {
      await api.deleteAccount(delPw);
      logout();
      toast.success(t("dash.settings.deleted"));
      router.push("/");
    } catch (err) {
      setDelError(errorText(err));
      setDelBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={t("dash.settings.title")} description={t("dash.settings.subtitle")} />
      <div className="max-w-2xl space-y-6">
        <Card className="p-6">
          <h2 className="mb-5 text-base font-semibold text-ink">{t("dash.settings.account")}</h2>
          <form onSubmit={save} className="space-y-5">
            <Field label={t("dash.settings.name")}>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label={t("dash.settings.email")} hint={t("dash.settings.emailNote")}>
              <Input value={user.email} disabled dir="ltr" />
            </Field>
            <Field label={t("dash.settings.language")} hint={t("dash.settings.languageHint")}>
              <NativeSelect value={lang} onChange={(e) => setLang(e.target.value)}>
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Button type="submit" loading={busy}>
              {t("dash.settings.saveChanges")}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 text-base font-semibold text-ink">{t("dash.settings.password")}</h2>
          <form onSubmit={changePw} className="space-y-5">
            <Field label={t("dash.settings.currentPassword")}>
              <Input type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} dir="ltr" />
            </Field>
            <Field label={t("dash.settings.newPassword")} hint={t("auth.register.passwordHint")}>
              <Input type="password" autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} dir="ltr" />
            </Field>
            {pwError && <Alert>{pwError}</Alert>}
            <Button type="submit" variant="secondary" loading={pwBusy}>
              {t("dash.settings.changePassword")}
            </Button>
          </form>
        </Card>

        <Card className="border-bad/30 p-6">
          <h2 className="text-base font-semibold text-bad-text">{t("dash.settings.danger")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("dash.settings.dangerBody")}</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="danger" className="mt-4">
                {t("dash.settings.deleteCta")}
              </Button>
            </DialogTrigger>
            <DialogContent title={t("dash.settings.danger")} description={t("dash.settings.dangerBody")} closeLabel={t("common.close")}>
              <div className="space-y-4">
                <Field label={t("dash.settings.dangerConfirm")}>
                  <Input type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} dir="ltr" />
                </Field>
                {delError && <Alert>{delError}</Alert>}
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="ghost">{t("common.cancel")}</Button>
                  </DialogClose>
                  <Button variant="danger" onClick={remove} loading={delBusy} disabled={!delPw}>
                    {t("dash.settings.deleteCta")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </>
  );
}
