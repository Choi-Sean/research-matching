"use client";

import { Lock } from "lucide-react";
import { Prose } from "@/components/marketing/prose";
import { Button } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/ui/layout";
import { Card } from "@/components/ui/surface";
import { PLAYBOOK } from "@/content/playbook";
import { useAuth } from "@/lib/auth";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export function PlaybookView() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const unlocked = !!user?.is_pro;
  const free = PLAYBOOK.filter((s) => s.free);
  const locked = PLAYBOOK.filter((s) => !s.free);

  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <PageHeader eyebrow={t("playbook.eyebrow")} title={t("playbook.title")} description={t("playbook.subtitle")} />
      {locale !== "en" && <p className="-mt-4 mb-8 text-sm text-faint">{t("playbook.englishNote")}</p>}

      <div className="space-y-6">
        {(unlocked ? PLAYBOOK : free).map((s) => (
          <Card key={s.id} className="p-7 sm:p-9">
            <h2 className="display text-2xl text-ink" lang="en" dir="ltr">
              {s.title}
            </h2>
            <div className="mt-4">
              <Prose blocks={s.blocks} />
            </div>
          </Card>
        ))}

        {!unlocked && (
          <div className="relative overflow-hidden rounded-2xl border border-line">
            <div aria-hidden className="pointer-events-none space-y-6 p-7 opacity-60 blur-[6px] select-none sm:p-9">
              {locked.slice(0, 2).map((s) => (
                <div key={s.id}>
                  <h2 className="display text-2xl text-ink">{s.title}</h2>
                  <div className="mt-3 h-3 w-full rounded bg-surface-3" />
                  <div className="mt-2 h-3 w-5/6 rounded bg-surface-3" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 grid place-items-center bg-surface/70 p-6 text-center backdrop-blur-[2px]">
              <div className="max-w-sm">
                <span className="mx-auto grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-text">
                  <Lock className="size-5" />
                </span>
                <h3 className="mt-3 text-lg font-semibold text-ink">{t("playbook.lockedTitle")}</h3>
                <p className="mt-1.5 text-sm text-muted">{t("playbook.lockedBody")}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button asChild variant="brand">
                    <Link href="/pricing">{t("playbook.seePlans")}</Link>
                  </Button>
                  {!user && (
                    <Button asChild variant="secondary">
                      <Link href="/login?next=/playbook">{t("playbook.signIn")}</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 text-center">
        <Button asChild size="lg" variant="primary">
          <Link href="/tools/email-checker">{t("playbook.cta")}</Link>
        </Button>
      </div>
    </Container>
  );
}
