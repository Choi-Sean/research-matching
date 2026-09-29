"use client";

import { Check, Lightbulb, Sparkles, TriangleAlert } from "lucide-react";
import { Badge, Progress } from "@/components/ui/surface";
import type { MatchReason } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/core";
import { useI18n } from "@/lib/i18n/provider";

/** Translate one reason (rule-based codes are localised here; AI text is already in the visitor's language). */
export function useReasonText() {
  const { t, has, fmt } = useI18n();
  return (r: MatchReason): string => {
    if (r.text) return r.text;
    const key = `match.reasons.${r.code}`;
    if (!has(key)) return r.items.join(", ");
    const styleDims = r.code === "style_aligned" || r.code === "style_differs";
    const items = styleDims ? r.items.map((i) => (has(`enums.style.${i}`) ? t(`enums.style.${i}` as MessageKey) : i)) : r.items;
    return t(key as MessageKey, { items: fmt.list(items) });
  };
}

export function ReasonList({ reasons, gaps }: { reasons: MatchReason[]; gaps: MatchReason[] }) {
  const { t } = useI18n();
  const text = useReasonText();
  if (reasons.length === 0 && gaps.length === 0) return null;
  return (
    <div className="space-y-3">
      {reasons.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wider text-faint uppercase">{t("match.why")}</p>
          <ul className="space-y-1.5">
            {reasons.map((r, i) => (
              <li key={`${r.code}-${i}`} className="flex gap-2.5 text-sm leading-relaxed text-ink/90" dir="auto">
                <Check className="mt-1 size-3.5 shrink-0 text-good" /> {text(r)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {gaps.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wider text-faint uppercase">{t("match.gaps")}</p>
          <ul className="space-y-1.5">
            {gaps.map((r, i) => (
              <li key={`${r.code}-${i}`} className="flex gap-2.5 text-sm leading-relaxed text-warn-text" dir="auto">
                <TriangleAlert className="mt-1 size-3.5 shrink-0" /> {text(r)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Tip({ children }: { children: string }) {
  const { t } = useI18n();
  return (
    <p className="flex gap-2.5 rounded-xl bg-accent-soft/70 p-3.5 text-sm leading-relaxed text-ink/90" dir="auto">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-text" />
      <span>
        <span className="font-semibold text-accent-text">{t("match.tip")}: </span>
        {children}
      </span>
    </p>
  );
}

export function Breakdown({ data }: { data: Record<string, number> }) {
  const { t, has } = useI18n();
  const entries = Object.entries(data).filter(([k]) => has(`match.breakdown.${k}`));
  if (entries.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-4">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt className="flex justify-between text-xs text-muted">
            <span>{t(`match.breakdown.${k}` as MessageKey)}</span>
            <span className="tabular-nums">{v}</span>
          </dt>
          <dd>
            <Progress value={v} className="mt-1 h-1.5" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function MatchLabel({ score, ai }: { score: number; ai: boolean }) {
  const { t } = useI18n();
  const key = score >= 75 ? "strong" : score >= 50 ? "good" : "partial";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={score >= 75 ? "good" : score >= 50 ? "brand" : "neutral"} className={cn(score < 50 && "opacity-90")}>
        {t(`match.${key}` as MessageKey)}
      </Badge>
      <Badge tone={ai ? "accent" : "neutral"}>
        {ai && <Sparkles />} {ai ? t("match.aiRefined") : t("match.explainable")}
      </Badge>
    </div>
  );
}
