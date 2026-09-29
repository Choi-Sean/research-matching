"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import type { Block } from "@/content/blog";
import { LEGAL_UPDATED } from "@/content/legal";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { Prose } from "./prose";

export function LegalPage({ kind, blocks }: { kind: "privacy" | "terms"; blocks: Block[] }) {
  const { t, fmt, locale } = useI18n();
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <h1 className="display text-[clamp(2.2rem,4.6vw,3.4rem)] text-ink">{kind === "privacy" ? t("legal.privacyTitle") : t("legal.termsTitle")}</h1>
      <p className="mt-4 text-sm text-faint">{t("legal.updated", { date: fmt.date(LEGAL_UPDATED, { dateStyle: "long" }) })}</p>
      {locale !== "en" && <p className="mt-2 text-sm text-faint">{t("legal.englishNote")}</p>}
      <div className="mt-10">
        <Prose blocks={blocks} />
      </div>
      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">{t("legal.questions")}</p>
        <Button asChild variant="secondary">
          <Link href="/contact">{t("legal.contactUs")}</Link>
        </Button>
      </div>
    </Container>
  );
}
