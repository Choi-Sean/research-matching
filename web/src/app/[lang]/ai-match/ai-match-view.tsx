"use client";

import { ArrowRight, Clock, Eye, Gauge, Layers, Lock, Puzzle, ShieldCheck, Sparkles, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { HeroSearch } from "@/components/marketing/hero";
import { MockMatch, MockPersona, MockStyle } from "@/components/marketing/mocks";
import { Button } from "@/components/ui/button";
import { Dial } from "@/components/ui/form";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/overlay";
import { Reveal } from "@/components/ui/reveal";
import { Card, ScoreRing } from "@/components/ui/surface";
import { useAuth } from "@/lib/auth";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { STYLE_KEYS } from "@/lib/labels";

const LAB = { autonomy: 4, collaboration: 4, pace: 5, structure: 2 } as const;
const em = (c: React.ReactNode) => <em>{c}</em>;

export function AiMatchView() {
  const { t, rich, fmt } = useI18n();
  const { user } = useAuth();
  const [you, setYou] = useState<Partial<Record<(typeof STYLE_KEYS)[number], number | null>>>({});

  const fit = useMemo(() => {
    const diffs = STYLE_KEYS.filter((k) => you[k]).map((k) => ({ k, d: Math.abs((you[k] as number) - LAB[k]) }));
    if (diffs.length === 0) return null;
    const sim = 1 - diffs.reduce((s, x) => s + x.d, 0) / diffs.length / 4;
    return { score: Math.round(sim * 100), aligned: diffs.filter((x) => x.d <= 1).map((x) => x.k), differs: diffs.filter((x) => x.d >= 3).map((x) => x.k) };
  }, [you]);

  const label = (k: string) => t(`enums.style.${k}` as MessageKey);
  const primary =
    user?.role === "student"
      ? { href: "/dashboard/matches", text: t("aimatch.hero.student") }
      : user?.role === "professor"
        ? { href: "/dashboard/talent", text: t("aimatch.hero.professor") }
        : { href: "/register", text: t("aimatch.hero.signUp") };

  const signals = [
    { k: "topics", icon: Layers },
    { k: "skills", icon: Puzzle },
    { k: "style", icon: Gauge },
    { k: "hours", icon: Clock },
  ] as const;
  const trust = [
    { k: "t1", icon: Eye },
    { k: "t2", icon: Lock },
    { k: "t3", icon: UserX },
    { k: "t4", icon: ShieldCheck },
  ] as const;

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-noise">
          <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
          <div className="absolute -top-40 start-1/2 size-[44rem] -translate-x-1/2 rounded-full blur-3xl rtl:translate-x-1/2" style={{ background: "radial-gradient(closest-side, var(--glow-a), transparent)" }} />
        </div>
        <Container className="py-20 text-center sm:py-28">
          <p className="eyebrow mb-5 inline-flex items-center gap-2">
            <Sparkles className="size-3.5 text-accent" /> {t("aimatch.hero.eyebrow")}
          </p>
          <h1 className="display mx-auto max-w-4xl text-[clamp(2.4rem,6vw,4.5rem)] text-ink">{rich("aimatch.hero.title", { em })}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{t("aimatch.hero.subtitle")}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="brand">
              <Link href={primary.href}>
                {primary.text} <ArrowRight className="rtl:rotate-180" />
              </Link>
            </Button>
          </div>
          <div className="mx-auto mt-16 grid max-w-4xl gap-5 text-start md:grid-cols-2">
            <Reveal>
              <Card className="p-5">
                <MockMatch />
              </Card>
            </Reveal>
            <Reveal delay={100}>
              <Card className="p-5">
                <MockPersona />
              </Card>
            </Reveal>
          </div>
        </Container>
      </section>

      <Section tone="subtle">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={t("aimatch.signals.eyebrow")} title={t("aimatch.signals.title")} />
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {signals.map((s, i) => (
              <Reveal key={s.k} delay={i * 70}>
                <Card className="h-full p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand-text">
                    <s.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{t(`aimatch.signals.${s.k}.title` as MessageKey)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t(`aimatch.signals.${s.k}.body` as MessageKey)}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal>
            <SectionHeading eyebrow={t("aimatch.demo.eyebrow")} title={t("aimatch.demo.title")} description={t("aimatch.demo.description")} />
          </Reveal>
          <Reveal>
            <Card className="mx-auto mt-14 grid max-w-4xl gap-10 p-6 sm:p-10 md:grid-cols-[1.4fr_1fr]">
              <div className="grid content-start gap-x-8 gap-y-7 sm:grid-cols-2">
                {STYLE_KEYS.map((k) => (
                  <Dial
                    key={k}
                    label={label(k)}
                    low={t(`enums.style.${k}Low` as MessageKey)}
                    high={t(`enums.style.${k}High` as MessageKey)}
                    value={you[k] ?? null}
                    onChange={(v) => setYou((s) => ({ ...s, [k]: v }))}
                  />
                ))}
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-2/70 p-6 text-center">
                <ScoreRing score={fit?.score ?? 0} size={104} stroke={9} label={t("aimatch.demo.fit")} />
                <p className="mt-3 text-sm font-semibold text-ink">{t("aimatch.demo.fit")}</p>
                <div className="mt-3 min-h-16 space-y-1.5 text-xs leading-relaxed text-muted">
                  {!fit && <p>{t("aimatch.demo.none")}</p>}
                  {fit && fit.aligned.length > 0 && <p className="text-good-text">{t("aimatch.demo.aligned", { items: fmt.list(fit.aligned.map(label)) })}</p>}
                  {fit && fit.differs.length > 0 && <p className="text-warn-text">{t("aimatch.demo.differs", { items: fmt.list(fit.differs.map(label)) })}</p>}
                </div>
                <div className="mt-4 w-full border-t border-line pt-4 text-start">
                  <p className="mb-2 text-xs font-semibold text-faint">{t("aimatch.demo.lab")}</p>
                  <MockStyle />
                </div>
              </div>
            </Card>
          </Reveal>
        </Container>
      </Section>

      <Section tone="subtle">
        <Container>
          <Reveal>
            <SectionHeading title={t("aimatch.directions.title")} />
          </Reveal>
          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            {(["students", "professors"] as const).map((who, i) => (
              <Reveal key={who} delay={i * 90}>
                <Card className="h-full p-8">
                  <h3 className="display text-2xl text-ink">{t(`aimatch.directions.${who}.title` as MessageKey)}</h3>
                  <ol className="mt-6 space-y-4">
                    {(["s1", "s2", "s3"] as const).map((s, n) => (
                      <li key={s} className="flex gap-4">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-text">{n + 1}</span>
                        <p className="leading-relaxed text-ink/90">{t(`aimatch.directions.${who}.${s}` as MessageKey)}</p>
                      </li>
                    ))}
                  </ol>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal>
            <SectionHeading eyebrow={t("aimatch.trust.eyebrow")} title={t("aimatch.trust.title")} />
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {trust.map((x, i) => (
              <Reveal key={x.k} delay={i * 70}>
                <div className="flex gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-good-soft text-good-text">
                    <x.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{t(`aimatch.trust.${x.k}.title` as MessageKey)}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(`aimatch.trust.${x.k}.body` as MessageKey)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="subtle" className="!py-16">
        <Container className="max-w-3xl">
          <SectionHeading title={t("aimatch.faq.title")} />
          <Accordion type="single" collapsible defaultValue="q1" className="mt-10 rounded-3xl border border-line bg-surface px-6 shadow-card sm:px-8">
            {(["1", "2", "3"] as const).map((n) => (
              <AccordionItem key={n} value={`q${n}`}>
                <AccordionTrigger>{t(`aimatch.faq.q${n}` as MessageKey)}</AccordionTrigger>
                <AccordionContent>{t(`aimatch.faq.a${n}` as MessageKey)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      <Container className="py-16 text-center">
        <h2 className="display text-[clamp(1.8rem,4vw,2.8rem)] text-ink">{t("aimatch.cta.title")}</h2>
        <Button asChild size="lg" className="mt-7">
          <Link href={primary.href}>
            {user ? primary.text : t("aimatch.cta.button")} <ArrowRight className="rtl:rotate-180" />
          </Link>
        </Button>
        <div className="mt-10">
          <HeroSearch compact />
        </div>
      </Container>
    </>
  );
}
