"use client";

import { ArrowRight, MousePointerClick, Quote } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/ui/layout";
import { Card } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

// The template is the email itself, so it stays in English; the guidance around it is translated.
const PARTS: ({ text: string } | { slot: "b1" | "b2" | "b3" | "b4" | "b5" })[] = [
  { text: "I've been reading your recent work on " },
  { slot: "b1" },
  { text: ", and one detail stayed with me: " },
  { slot: "b2" },
  { text: ". It connects to my own interest in " },
  { slot: "b3" },
  { text: ", because " },
  { slot: "b4" },
  { text: ". I was left wondering: " },
  { slot: "b5" },
  { text: "?" },
];
const FLAGS = ["rf1", "rf2", "rf3", "rf4", "rf5"] as const;

export function FrameworkView() {
  const { t } = useI18n();
  const [active, setActive] = useState<"b1" | "b2" | "b3" | "b4" | "b5">("b1");

  return (
    <Container className="max-w-4xl py-10 sm:py-14">
      <PageHeader title={t("tools.framework.title")} description={t("tools.framework.subtitle")} />

      <Card className="p-6 sm:p-9">
        <p className="eyebrow">{t("tools.framework.template")}</p>
        <p className="mt-5 text-[1.15rem] leading-[2.3] text-ink sm:text-[1.3rem]" dir="ltr" lang="en">
          <Quote className="me-2 mb-1 inline size-5 text-faint" aria-hidden />
          {PARTS.map((p, i) =>
            "text" in p ? (
              <span key={i}>{p.text}</span>
            ) : (
              <button
                key={i}
                onClick={() => setActive(p.slot)}
                aria-pressed={active === p.slot}
                className={cn(
                  "mx-0.5 rounded-lg border px-2 py-0.5 align-baseline text-[0.85em] font-medium transition-colors",
                  active === p.slot
                    ? "border-brand bg-brand text-brand-fg"
                    : "border-brand/30 bg-brand-soft text-brand-text hover:border-brand/60",
                )}
              >
                [{t(`tools.framework.${p.slot}.label` as MessageKey)}]
              </button>
            ),
          )}
        </p>
        <div className="mt-7 rounded-2xl border border-line bg-surface-2/70 p-5" aria-live="polite">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-faint uppercase">
            <MousePointerClick className="size-3.5" /> {t("tools.framework.guidance")}
          </p>
          <p className="mt-2.5 text-base leading-relaxed text-ink">{t(`tools.framework.${active}.tip` as MessageKey)}</p>
        </div>
        <p className="mt-3 text-xs text-faint">{t("tools.framework.tapHint")}</p>
      </Card>

      <section className="mt-16">
        <h2 className="display text-[clamp(1.6rem,3vw,2.2rem)] text-ink">{t("tools.framework.redFlags")}</h2>
        <p className="mt-2 text-muted">{t("tools.framework.redFlagsSub")}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {FLAGS.map((f) => (
            <Card key={f} className="p-5">
              <p className="text-base font-medium text-bad-text line-through decoration-bad/60" dir="ltr" lang="en">
                “{t(`tools.framework.${f}.phrase` as MessageKey)}”
              </p>
              <p className="mt-2 text-sm text-muted">{t(`tools.framework.${f}.why` as MessageKey)}</p>
              <p className="mt-3 flex gap-2 text-sm text-good-text">
                <span className="font-semibold">{t("tools.framework.instead")}</span>
                <span className="text-ink/90">{t(`tools.framework.${f}.instead` as MessageKey)}</span>
              </p>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-14 text-center">
        <Button asChild size="lg" variant="brand">
          <Link href="/tools/email-checker">
            {t("tools.framework.cta")} <ArrowRight className="rtl:rotate-180" />
          </Link>
        </Button>
      </div>
    </Container>
  );
}
