"use client";

import { BookOpen, Bookmark, Check, Mail, MapPin, PenLine, Sparkles, UserPlus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar, Badge, ScoreRing } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/provider";

/**
 * Product previews used on marketing pages. Everything here is fictional and labelled as illustrative —
 * no real researcher, student or outcome is depicted.
 */

const PEOPLE = [
  { name: "Dr. Alex Rivera", inst: "Northfield University", topics: ["Computer vision", "Robotics"], h: 41, papers: 128 },
  { name: "Dr. Mei Tanaka", inst: "Lakeshore Institute of Technology", topics: ["Machine learning", "Vision"], h: 33, papers: 96 },
  { name: "Prof. Samuel Okoye", inst: "Riverside University", topics: ["Robotics", "Control"], h: 29, papers: 77 },
];

function Frame({ children, className, url = "labora.app" }: { children: ReactNode; className?: string; url?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[1.4rem] border border-line bg-surface shadow-pop", className)}>
      <div className="flex items-center gap-3 border-b border-line bg-surface-2/70 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-line-2" />
          <span className="size-2.5 rounded-full bg-line-2" />
          <span className="size-2.5 rounded-full bg-line-2" />
        </div>
        <div className="mx-auto flex h-6 max-w-64 flex-1 items-center justify-center rounded-md bg-surface px-3 text-[0.6875rem] text-faint ring-1 ring-line" dir="ltr">
          {url}
        </div>
        <div className="w-10" aria-hidden />
      </div>
      {children}
    </div>
  );
}

function PersonRow({ p, active }: { p: (typeof PEOPLE)[number]; active?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition-colors",
        active ? "border-brand/35 bg-brand-soft/60" : "border-transparent",
      )}
    >
      <Avatar name={p.name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted">
          <MapPin className="size-3 shrink-0" /> {p.inst}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {p.topics.map((t) => (
            <span key={t} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[0.6875rem] text-muted ring-1 ring-line">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const p = PEOPLE[0];
  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size={48} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{p.name}</p>
            <p className="text-xs text-muted">{p.inst}</p>
          </div>
          <div className="hidden gap-4 text-center sm:flex">
            <div>
              <p className="text-base font-semibold tabular-nums text-ink">{p.h}</p>
              <p className="text-[0.6875rem] text-faint">{t("home.mock.hIndex")}</p>
            </div>
            <div>
              <p className="text-base font-semibold tabular-nums text-ink">{p.papers}</p>
              <p className="text-[0.6875rem] text-faint">{t("home.mock.papers")}</p>
            </div>
          </div>
        </div>
      )}
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-text">
          <Sparkles className="size-3.5 text-accent" /> {t("home.mock.summary")}
        </div>
        <p className="text-sm leading-relaxed text-ink/90">{t("home.mock.summaryBody")}</p>
      </div>
      <div className="rounded-xl border border-accent/30 bg-accent-soft/60 p-3.5">
        <p className="text-[0.6875rem] font-semibold tracking-wider text-accent-text uppercase">{t("home.mock.keyFinding")}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink/90">{t("home.mock.keyFindingBody")}</p>
      </div>
      {!compact && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted">{t("home.mock.starters")}</p>
          <ul className="space-y-1.5 text-sm text-ink/85">
            {(["starter1", "starter2"] as const).map((k) => (
              <li key={k} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-brand" />
                {t(`home.mock.${k}`)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------------------ hero composition */

export function HeroPreview() {
  const { t } = useI18n();
  return (
    <figure className="relative mx-auto mt-16 w-full max-w-5xl text-start sm:mt-20">
      <figcaption className="sr-only">{t("home.mock.preview")}</figcaption>
      <div aria-hidden className="pointer-events-none absolute -inset-x-10 -top-10 -bottom-16 -z-10 rounded-[3rem] bg-gradient-to-b from-brand/10 via-transparent to-transparent blur-2xl" />
      <Frame url="labora.app/discover">
        <div aria-hidden className="grid md:grid-cols-[minmax(0,19rem)_1fr]">
          <div className="border-b border-line bg-canvas/40 p-3 md:border-e md:border-b-0">
            <p className="px-2 pt-1 pb-2 text-xs font-semibold text-faint">{t("home.mock.results")}</p>
            <div className="space-y-1">
              {PEOPLE.map((p, i) => (
                <PersonRow key={p.name} p={p} active={i === 0} />
              ))}
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <SummaryPanel />
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex h-9 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-canvas">
                <PenLine className="size-4" /> {t("home.mock.writeEmail")}
              </span>
              <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-line-2 bg-surface px-4 text-sm font-medium text-ink">
                <Bookmark className="size-4" /> {t("home.mock.save")}
              </span>
            </div>
          </div>
        </div>
      </Frame>

      {/* floating: email score */}
      <div
        aria-hidden
        className="absolute -start-3 -top-8 hidden animate-float rounded-2xl border border-line bg-surface p-3 shadow-pop md:flex md:items-center md:gap-3 lg:-start-10"
      >
        <ScoreRing score={86} size={46} stroke={5} />
        <div className="pe-1">
          <p className="text-xs font-semibold text-ink">{t("home.mock.emailScore")}</p>
          <p className="text-[0.6875rem] text-muted">{t("home.mock.emailFlags")}</p>
        </div>
      </div>

      {/* floating: match */}
      <div
        aria-hidden
        className="absolute -end-3 -bottom-10 hidden w-64 rounded-2xl border border-line bg-surface p-4 shadow-pop [animation-delay:-3s] md:block lg:-end-10 animate-float"
      >
        <div className="flex items-center gap-3">
          <ScoreRing score={92} size={52} stroke={5} />
          <div>
            <p className="flex items-center gap-1 text-xs font-semibold text-brand-text">
              <Sparkles className="size-3.5 text-accent" /> {t("home.mock.match")}
            </p>
            <p className="text-[0.6875rem] text-muted">{t("home.mock.whyFit")}</p>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5 text-[0.6875rem] leading-snug text-ink/85">
          <li className="flex gap-1.5">
            <Check className="mt-0.5 size-3 shrink-0 text-good" /> {t("home.mock.reasonTopics")}
          </li>
          <li className="flex gap-1.5">
            <Check className="mt-0.5 size-3 shrink-0 text-good" /> {t("home.mock.reasonStyle")}
          </li>
          <li className="flex gap-1.5 text-warn-text">
            <span className="mt-0.5 size-3 shrink-0 text-center leading-none">△</span> {t("home.mock.gap")}
          </li>
        </ul>
      </div>
      <p className="mt-6 text-center text-xs text-faint md:mt-14">{t("home.mock.preview")}</p>
    </figure>
  );
}

/* ------------------------------------------------------------------------------------ bento mini-mocks */

export function MockDiscover() {
  return (
    <div aria-hidden className="space-y-1.5 rounded-2xl border border-line bg-canvas/50 p-2.5">
      {PEOPLE.map((p, i) => (
        <PersonRow key={p.name} p={p} active={i === 0} />
      ))}
    </div>
  );
}

export function MockSummary() {
  return (
    <div aria-hidden className="rounded-2xl border border-line bg-canvas/50 p-4">
      <SummaryPanel compact />
    </div>
  );
}

export function MockEmail() {
  const { t } = useI18n();
  return (
    <div aria-hidden className="rounded-2xl border border-line bg-canvas/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Mail className="size-3.5" /> Dear Professor Rivera,
        </div>
        <ScoreRing score={64} size={40} stroke={4.5} />
      </div>
      <p className="text-[0.8125rem] leading-relaxed text-ink/85" dir="ltr">
        I found your work{" "}
        <mark className="rounded bg-bad-soft px-1 text-bad-text">fascinating and groundbreaking</mark>. I&apos;m a{" "}
        <mark className="rounded bg-warn-soft px-1 text-warn-text">highly motivated</mark> student and would love to learn from you…
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="bad">{t("home.mock.flagFlattery")}</Badge>
        <Badge tone="warn">{t("home.mock.flagGeneric")}</Badge>
      </div>
    </div>
  );
}

export function MockMatch() {
  const { t } = useI18n();
  return (
    <div aria-hidden className="rounded-2xl border border-line bg-canvas/50 p-4">
      <div className="flex items-center gap-3">
        <ScoreRing score={92} size={56} stroke={5.5} />
        <div>
          <p className="text-sm font-semibold text-ink">{PEOPLE[0].name}</p>
          <p className="text-xs text-muted">{PEOPLE[0].inst}</p>
        </div>
      </div>
      <ul className="mt-3.5 space-y-1.5 text-xs leading-snug text-ink/85">
        <li className="flex gap-1.5">
          <Check className="mt-0.5 size-3.5 shrink-0 text-good" /> {t("home.mock.reasonTopics")}
        </li>
        <li className="flex gap-1.5">
          <Check className="mt-0.5 size-3.5 shrink-0 text-good" /> {t("home.mock.reasonStyle")}
        </li>
      </ul>
    </div>
  );
}

export function MockPositions() {
  const { t } = useI18n();
  const rows = [
    { title: "Undergraduate RA: Self-supervised Vision", lab: "Vision & Learning Lab", tone: "good" as const, comp: "$", hrs: 10 },
    { title: "Research Assistant: fMRI Data Processing", lab: "Neuroimaging Lab", tone: "brand" as const, comp: "✓", hrs: 12 },
  ];
  return (
    <div aria-hidden className="space-y-2 rounded-2xl border border-line bg-canvas/50 p-2.5">
      {rows.map((r) => (
        <div key={r.title} className="rounded-xl border border-line bg-surface p-3">
          <p className="text-[0.8125rem] font-semibold leading-snug text-ink" dir="ltr">{r.title}</p>
          <p className="mt-0.5 text-xs text-muted" dir="ltr">{r.lab}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={r.tone}>{r.hrs} h</Badge>
            <span className="ms-auto inline-flex h-7 items-center rounded-lg bg-ink px-3 text-xs font-medium text-canvas">{t("home.mock.apply")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MockTracker() {
  const { t, fmt } = useI18n();
  const [soonDate] = useState(() => new Date(Date.now() + 3 * 864e5));
  const soon = fmt.date(soonDate, { month: "short", day: "numeric" });
  const rows = [
    { n: "Dr. Mei Tanaka", s: "sent", tone: "warn" as const },
    { n: "Dr. Alex Rivera", s: "replied", tone: "good" as const },
    { n: "Prof. Samuel Okoye", s: "drafted", tone: "neutral" as const },
  ];
  return (
    <div aria-hidden className="space-y-1.5 rounded-2xl border border-line bg-canvas/50 p-2.5">
      {rows.map((r) => (
        <div key={r.n} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
          <Avatar name={r.n} size={30} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-medium text-ink" dir="ltr">{r.n}</p>
            {r.s === "sent" && <p className="text-[0.6875rem] text-faint">{t("home.mock.followUpOn", { date: soon })}</p>}
          </div>
          <Badge tone={r.tone}>{t(`enums.outreach.${r.s}` as "enums.outreach.sent")}</Badge>
        </div>
      ))}
    </div>
  );
}

/** Professor-side: an ideal-candidate profile and ranked students. */
export function MockPersona() {
  const { t } = useI18n();
  const cands = [
    { n: "Student A", s: 94, m: "Computer Science · Junior" },
    { n: "Student B", s: 88, m: "Math & CS · Junior" },
    { n: "Student C", s: 81, m: "Physics · Sophomore" },
  ];
  return (
    <div aria-hidden className="space-y-3 rounded-2xl border border-line bg-canvas/50 p-3.5">
      <div className="rounded-xl border border-line bg-surface p-3.5">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-text">
          <Sparkles className="size-3.5 text-accent" /> {t("home.mock.idealStudent")}
        </p>
        <p className="mb-1 text-[0.6875rem] font-semibold text-faint">{t("home.mock.mustHave")}</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {["Python", "PyTorch", "Linear algebra"].map((s) => (
            <Badge key={s} tone="brand" dir="ltr">{s}</Badge>
          ))}
        </div>
        <p className="mb-1 text-[0.6875rem] font-semibold text-faint">{t("home.mock.niceToHave")}</p>
        <div className="flex flex-wrap gap-1.5">
          {["CUDA", "Robotics"].map((s) => (
            <Badge key={s} tone="neutral" dir="ltr">{s}</Badge>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        {cands.map((c) => (
          <div key={c.n} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
            <ScoreRing score={c.s} size={38} stroke={4} />
            <div className="min-w-0 flex-1">
              <p className="text-[0.8125rem] font-medium text-ink" dir="ltr">{c.n}</p>
              <p className="truncate text-[0.6875rem] text-muted" dir="ltr">{c.m}</p>
            </div>
            <span className="inline-flex h-7 items-center gap-1 rounded-lg bg-brand-soft px-2.5 text-xs font-medium text-brand-text">
              <UserPlus className="size-3.5" /> {t("home.mock.invite")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Student-side: working-style dials next to a match. */
export function MockStyle() {
  const { t } = useI18n();
  const dims = [
    { k: "autonomy", you: 4, lab: 4 },
    { k: "collaboration", you: 3, lab: 4 },
    { k: "pace", you: 4, lab: 4 },
    { k: "structure", you: 2, lab: 2 },
  ] as const;
  return (
    <div aria-hidden className="space-y-3 rounded-2xl border border-line bg-canvas/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-faint">{t("home.match.styleTitle")}</p>
        <p className="flex items-center gap-3 text-[0.6875rem] text-faint">
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-full border-2 border-brand" />{t("home.match.you")}</span>
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-accent/85" />{t("home.match.lab")}</span>
        </p>
      </div>
      {dims.map((d) => (
        <div key={d.k}>
          <p className="mb-1.5 text-xs font-medium text-ink">{t(`enums.style.${d.k}` as "enums.style.autonomy")}</p>
          <div className="relative h-1.5 rounded-full bg-surface-3">
            <span className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full border-2 border-brand bg-surface" style={{ insetInlineStart: `calc(${((d.you - 1) / 4) * 100}% - 7px)` }} />
            <span className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-accent/85" style={{ insetInlineStart: `calc(${((d.lab - 1) / 4) * 100}% - 7px)` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BookIcon() {
  return <BookOpen className="size-5" />;
}
