"use client";

import { ArrowRight, Check } from "lucide-react";
import { MockDiscover, MockEmail, MockSummary, MockTracker } from "@/components/marketing/mocks";
import { Button } from "@/components/ui/button";
import { Container, SectionHeading } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

const STEPS = [
  { k: "s1", mock: <MockDiscover /> },
  { k: "s2", mock: <MockSummary /> },
  { k: "s3", mock: <MockEmail /> },
  { k: "s4", mock: <MockTracker /> },
] as const;

export function HowView() {
  const { t } = useI18n();
  return (
    <Container className="py-12 sm:py-16">
      <Reveal>
        <SectionHeading eyebrow={t("how.eyebrow")} title={t("how.title")} description={t("how.subtitle")} />
      </Reveal>
      <div className="mt-20 space-y-24">
        {STEPS.map((s, i) => (
          <Reveal key={s.k}>
            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className={cn(i % 2 === 1 && "md:order-2")}>
                <span className="display grid size-14 place-items-center rounded-full border border-line-2 bg-surface text-2xl text-brand-text">{i + 1}</span>
                <h2 className="display mt-6 text-[clamp(1.7rem,3.2vw,2.4rem)] text-ink">{t(`how.${s.k}.title` as MessageKey)}</h2>
                <p className="mt-4 text-lg leading-relaxed text-muted">{t(`how.${s.k}.body` as MessageKey)}</p>
                <ul className="mt-6 space-y-2.5">
                  {(["b1", "b2"] as const).map((b) => (
                    <li key={b} className="flex gap-3 text-ink/90">
                      <Check className="mt-1 size-4 shrink-0 text-good" /> {t(`how.${s.k}.${b}` as MessageKey)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-7">{s.mock}</div>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-24 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" variant="brand">
          <Link href="/discover">
            {t("how.cta")} <ArrowRight className="rtl:rotate-180" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/ai-match">{t("how.ctaMatch")}</Link>
        </Button>
      </div>
    </Container>
  );
}
