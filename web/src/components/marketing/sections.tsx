"use client";

import {
  ArrowRight,
  Check,
  Compass,
  FileSearch,
  GraduationCap,
  Layers,
  Lock,
  Mail,
  MailCheck,
  Repeat,
  ShieldCheck,
  Sparkles,
  Telescope,
  UsersRound,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/overlay";
import { Skeleton } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { HeroSearch } from "./hero";
import {
  HeroPreview,
  MockDiscover,
  MockEmail,
  MockMatch,
  MockPersona,
  MockPositions,
  MockStyle,
  MockSummary,
  MockTracker,
} from "./mocks";

const em = (chunks: ReactNode) => <em>{chunks}</em>;

/* ------------------------------------------------------------------------------------------- hero */

export function Hero() {
  const { t, rich, fmt } = useI18n();
  const stats = useApi("site-stats", () => api.stats());
  const s = stats.data;
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-noise">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-40 start-1/2 size-[46rem] -translate-x-1/2 rounded-full blur-3xl rtl:translate-x-1/2" style={{ background: "radial-gradient(closest-side, var(--glow-a), transparent)" }} />
        <div className="absolute -top-24 -end-32 size-[30rem] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, var(--glow-b), transparent)" }} />
      </div>
      <Container className="pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
        <Link
          href="/ai-match"
          className="animate-fade-up group mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 py-1.5 ps-2 pe-3.5 text-sm text-muted shadow-sm backdrop-blur transition-colors hover:border-brand/40 hover:text-ink"
        >
          <span className="grid size-6 place-items-center rounded-full bg-accent-soft text-accent-text">
            <Sparkles className="size-3.5" />
          </span>
          {t("home.hero.badge")}
          <ArrowRight className="size-3.5 text-faint transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </Link>

        <h1 className="display animate-fade-up mx-auto mt-7 max-w-4xl text-[clamp(2.6rem,7vw,5.25rem)] text-ink [animation-delay:70ms]">
          {rich("home.hero.title", { em })}
        </h1>
        <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted text-pretty [animation-delay:140ms] sm:text-xl">
          {t("home.hero.subtitle")}
        </p>

        <div className="animate-fade-up mt-10 [animation-delay:210ms]">
          <HeroSearch />
        </div>

        <p className="animate-fade-up mt-8 text-sm text-faint [animation-delay:280ms]">
          {s?.works_indexed && s.institutions_indexed
            ? t("home.hero.trust", { works: fmt.compact(s.works_indexed), institutions: fmt.compact(s.institutions_indexed) })
            : t("home.hero.trustFallback")}
        </p>

        <div className="animate-fade-up [animation-delay:350ms]">
          <HeroPreview />
        </div>
      </Container>
    </section>
  );
}

/* --------------------------------------------------------------------------------------- marquee */

const SCHOOLS = [
  "MIT", "Stanford University", "Harvard University", "UC Berkeley", "Carnegie Mellon University", "University of Michigan",
  "Georgia Tech", "Johns Hopkins University", "UT Austin", "University of Oxford", "University of Cambridge", "ETH Zürich",
  "University of Toronto", "National University of Singapore", "Seoul National University", "University of Tokyo",
  "Tsinghua University", "University of São Paulo", "TU Munich", "Sorbonne University", "University of Melbourne",
  "Indian Institute of Science", "American University of Beirut", "University of Cape Town",
];

export function LogoMarquee() {
  const { t } = useI18n();
  const row = (aria: boolean) => (
    <ul aria-hidden={aria || undefined} className="flex shrink-0 items-center gap-3 pe-3">
      {SCHOOLS.map((s) => (
        <li key={s} className="whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-muted shadow-xs">
          {s}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="border-y border-line bg-surface-2/40 py-8">
      <p className="mb-5 text-center text-xs font-semibold tracking-wider text-faint uppercase">{t("home.marquee.label")}</p>
      <div dir="ltr" className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------------------- problem */

export function ProblemSection() {
  const { t, rich } = useI18n();
  const items = [
    { icon: Mail, k: "generic" },
    { icon: Telescope, k: "who" },
    { icon: FileSearch, k: "read" },
  ] as const;
  return (
    <Section>
      <Container>
        <Reveal>
          <SectionHeading eyebrow={t("home.problem.eyebrow")} title={rich("home.problem.title", { em })} description={t("home.problem.description")} />
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.k} delay={i * 90}>
              <div className="h-full rounded-3xl border border-line bg-surface p-7 shadow-card">
                <span className="grid size-11 place-items-center rounded-2xl bg-bad-soft text-bad-text">
                  <it.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{t(`home.problem.${it.k}.title`)}</h3>
                <p className="mt-2 leading-relaxed text-muted">{t(`home.problem.${it.k}.body`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ---------------------------------------------------------------------------------------- bento */

function BentoCard({
  icon,
  title,
  body,
  className,
  children,
  href,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  className?: string;
  children: ReactNode;
  href?: string;
}) {
  const inner = (
    <div className={cn("group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-card transition-shadow duration-300 hover:shadow-pop sm:p-7", className)}>
      <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand-text [&_svg]:size-5">{icon}</span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-2 max-w-md leading-relaxed text-muted">{body}</p>
      <div className="mt-6 flex-1 self-stretch">{children}</div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

export function FeatureBento() {
  const { t } = useI18n();
  return (
    <Section tone="subtle" id="platform">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={t("home.features.eyebrow")} title={t("home.features.title")} description={t("home.features.description")} />
        </Reveal>
        <div className="mt-14 grid gap-5 lg:grid-cols-6">
          <Reveal className="lg:col-span-4">
            <BentoCard href="/discover" icon={<Compass />} title={t("home.features.discover.title")} body={t("home.features.discover.body")}>
              <MockDiscover />
            </BentoCard>
          </Reveal>
          <Reveal delay={80} className="lg:col-span-2">
            <BentoCard href="/discover" icon={<Sparkles />} title={t("home.features.summaries.title")} body={t("home.features.summaries.body")}>
              <MockSummary />
            </BentoCard>
          </Reveal>
          <Reveal className="lg:col-span-2">
            <BentoCard href="/tools/email-checker" icon={<MailCheck />} title={t("home.features.email.title")} body={t("home.features.email.body")}>
              <MockEmail />
            </BentoCard>
          </Reveal>
          <Reveal delay={80} className="lg:col-span-4">
            <BentoCard href="/ai-match" icon={<Layers />} title={t("home.features.match.title")} body={t("home.features.match.body")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <MockMatch />
                <MockStyle />
              </div>
            </BentoCard>
          </Reveal>
          <Reveal className="lg:col-span-3">
            <BentoCard href="/positions" icon={<GraduationCap />} title={t("home.features.positions.title")} body={t("home.features.positions.body")}>
              <MockPositions />
            </BentoCard>
          </Reveal>
          <Reveal delay={80} className="lg:col-span-3">
            <BentoCard href="/dashboard/outreach" icon={<Repeat />} title={t("home.features.tracker.title")} body={t("home.features.tracker.body")}>
              <MockTracker />
            </BentoCard>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ---------------------------------------------------------------------------------- how it works */

export function HowSection() {
  const { t } = useI18n();
  const steps = ["s1", "s2", "s3", "s4"] as const;
  return (
    <Section id="how-it-works">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={t("home.how.eyebrow")} title={t("home.how.title")} />
        </Reveal>
        <ol className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          <div aria-hidden className="absolute start-[12%] end-[12%] top-6 hidden h-px bg-gradient-to-r from-transparent via-line-2 to-transparent md:block" />
          {steps.map((s, i) => (
            <Reveal key={s} delay={i * 100} as="li" className="relative text-center md:px-2">
              <span className="display relative mx-auto grid size-12 place-items-center rounded-full border border-line-2 bg-canvas text-xl text-brand-text">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{t(`home.how.${s}.title`)}</h3>
              <p className="mx-auto mt-2 max-w-[15rem] leading-relaxed text-muted">{t(`home.how.${s}.body`)}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/* ---------------------------------------------------------------------------------------- match */

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((b) => (
        <li key={b} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink/90">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-good-soft text-good-text">
            <Check className="size-3" />
          </span>
          {b}
        </li>
      ))}
    </ul>
  );
}

export function MatchSection() {
  const { t, rich } = useI18n();
  return (
    <Section tone="subtle">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={t("home.match.eyebrow")} title={rich("home.match.title", { em })} description={t("home.match.description")} />
        </Reveal>
        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-line bg-surface p-7 shadow-card sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-text">
                <GraduationCap className="size-3.5" /> {t("home.match.students")}
              </span>
              <Bullets items={[t("home.match.s1"), t("home.match.s2"), t("home.match.s3")]} />
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <MockMatch />
                <MockStyle />
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="h-full rounded-3xl border border-line bg-surface p-7 shadow-card sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-text">
                <UsersRound className="size-3.5" /> {t("home.match.professors")}
              </span>
              <Bullets items={[t("home.match.p1"), t("home.match.p2"), t("home.match.p3")]} />
              <div className="mt-7">
                <MockPersona />
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal>
          <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-line bg-surface/70 p-4 text-sm leading-relaxed text-muted">
            <Lock className="mt-0.5 size-4 shrink-0 text-good" />
            <p>{t("home.match.privacy")}</p>
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="primary" size="lg">
              <Link href="/ai-match">
                {t("home.match.cta")} <ArrowRight className="rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------------------------- compare */

export function CompareSection() {
  const { t } = useI18n();
  const rows = ["r1", "r2", "r3"] as const;
  return (
    <Section>
      <Container>
        <Reveal>
          <SectionHeading title={t("home.compare.title")} description={t("home.compare.description")} />
        </Reveal>
        <Reveal>
          <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
            <div className="grid grid-cols-2 border-b border-line bg-surface-2/60 text-sm font-semibold">
              <div className="p-5 text-muted sm:px-8">{t("home.compare.colChatbot")}</div>
              <div className="flex items-center gap-2 border-s border-line bg-brand-soft/50 p-5 text-brand-text sm:px-8">
                <ShieldCheck className="size-4" /> {t("home.compare.colLabora")}
              </div>
            </div>
            {rows.map((r) => (
              <div key={r} className="border-b border-line last:border-0">
                <p className="bg-surface-2/30 px-5 pt-4 text-xs font-semibold tracking-wide text-faint uppercase sm:px-8">{t(`home.compare.${r}`)}</p>
                <div className="grid grid-cols-2">
                  <p className="flex gap-3 p-5 pt-2 text-[0.9375rem] leading-relaxed text-muted sm:px-8">
                    <X className="mt-1 size-4 shrink-0 text-bad" /> {t(`home.compare.${r}a`)}
                  </p>
                  <p className="flex gap-3 border-s border-line bg-brand-soft/30 p-5 pt-2 text-[0.9375rem] leading-relaxed text-ink sm:px-8">
                    <Check className="mt-1 size-4 shrink-0 text-good" /> {t(`home.compare.${r}b`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------------------------- professors */

export function ProfessorsBand() {
  const { t, rich } = useI18n();
  return (
    <section className="relative overflow-hidden bg-deep py-20 text-deep-fg sm:py-28">
      <div aria-hidden className="absolute -top-32 -end-32 size-[34rem] rounded-full opacity-60 blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(84 104 255 / 0.35), transparent)" }} />
      <Container className="relative grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.09em] text-[#8b99ff] uppercase">{t("home.professors.eyebrow")}</p>
          <h2 className="display mt-4 text-[clamp(2rem,4.4vw,3.25rem)] text-deep-fg [&_em]:!text-[#9aa7ff]">{rich("home.professors.title", { em })}</h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-deep-muted">{t("home.professors.description")}</p>
          <ul className="mt-7 space-y-3">
            {(["b1", "b2", "b3"] as const).map((b) => (
              <li key={b} className="flex gap-3 text-[0.9375rem] text-deep-fg/90">
                <Check className="mt-0.5 size-5 shrink-0 text-[#5bd6a4]" /> {t(`home.professors.${b}`)}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-9 !bg-white !text-[#0f1320] hover:!bg-white/90">
            <Link href="/register?role=professor">
              {t("home.professors.cta")} <ArrowRight className="rtl:rotate-180" />
            </Link>
          </Button>
        </Reveal>
        <Reveal delay={120}>
          <div className="rounded-3xl border border-deep-line bg-deep-2/70 p-3 shadow-pop backdrop-blur sm:p-4">
            <MockPersona />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------------------------------------- stats */

export function StatsSection() {
  const { t, fmt } = useI18n();
  const { data, loading } = useApi("site-stats", () => api.stats());
  const items = [
    { label: t("home.stats.works"), value: data?.works_indexed },
    { label: t("home.stats.institutions"), value: data?.institutions_indexed },
    { label: t("home.stats.researchers"), value: data?.researchers_indexed },
    { label: t("home.stats.labs"), value: data?.labs },
    { label: t("home.stats.positions"), value: data?.open_positions },
  ];
  return (
    <Section>
      <Container>
        <Reveal>
          <SectionHeading eyebrow={t("home.stats.eyebrow")} title={t("home.stats.title")} />
        </Reveal>
        <Reveal>
          <dl className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
            {items.map((it) => (
              <div key={it.label} className="text-center">
                <dd className="display order-1 text-[clamp(2.2rem,4vw,3.2rem)] text-ink tabular-nums">
                  {loading || it.value == null ? <Skeleton className="mx-auto h-11 w-24" /> : fmt.compact(it.value)}
                </dd>
                <dt className="mt-2 text-sm text-muted">{it.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-10 text-center text-xs text-faint">{t("home.stats.attribution")}</p>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------------------------- pricing + faq */

export function PricingTeaser() {
  const { t } = useI18n();
  return (
    <Container>
      <Reveal>
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-line bg-gradient-to-br from-brand-soft/70 via-surface to-accent-soft/40 px-6 py-12 text-center shadow-card sm:px-12 md:flex-row md:justify-between md:text-start">
          <div className="max-w-xl">
            <h2 className="display text-[clamp(1.6rem,3vw,2.3rem)] text-ink">{t("home.pricing.title")}</h2>
            <p className="mt-3 leading-relaxed text-muted">{t("home.pricing.description")}</p>
          </div>
          <Button asChild size="lg">
            <Link href="/pricing">
              {t("home.pricing.cta")} <ArrowRight className="rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </Container>
  );
}

export function FaqSection() {
  const { t } = useI18n();
  return (
    <Section id="faq">
      <Container className="max-w-3xl">
        <Reveal>
          <SectionHeading title={t("home.faq.title")} />
        </Reveal>
        <Reveal>
          <Accordion type="single" collapsible defaultValue="q1" className="mt-12 rounded-3xl border border-line bg-surface px-6 shadow-card sm:px-8">
            {(["1", "2", "3", "4", "5", "6"] as const).map((n) => (
              <AccordionItem key={n} value={`q${n}`}>
                <AccordionTrigger>{t(`home.faq.q${n}`)}</AccordionTrigger>
                <AccordionContent>{t(`home.faq.a${n}`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Container>
    </Section>
  );
}

export function FinalCta() {
  const { t, rich } = useI18n();
  return (
    <Container className="pb-8">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-line bg-surface px-6 py-16 text-center shadow-card sm:px-12 sm:py-20">
          <div aria-hidden className="absolute inset-0 -z-10 bg-grid opacity-70 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_100%,black,transparent)]" />
          <div aria-hidden className="absolute -bottom-40 start-1/2 -z-10 size-[36rem] -translate-x-1/2 rounded-full blur-3xl rtl:translate-x-1/2" style={{ background: "radial-gradient(closest-side, var(--glow-a), transparent)" }} />
          <h2 className="display mx-auto max-w-3xl text-[clamp(2rem,4.6vw,3.4rem)] text-ink">{rich("home.cta.title", { em })}</h2>
          <p className="mt-4 text-lg text-muted">{t("home.cta.subtitle")}</p>
          <div className="mt-9">
            <HeroSearch compact />
          </div>
        </div>
      </Reveal>
    </Container>
  );
}
