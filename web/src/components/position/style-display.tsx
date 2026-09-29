"use client";

import type { WorkStyle } from "@/lib/api";
import { useI18n } from "@/lib/i18n/provider";
import { STYLE_KEYS } from "@/lib/labels";
import type { MessageKey } from "@/lib/i18n/core";

/** Read-only view of the four working-style dials (a lab's, a candidate's, or yours). */
export function StyleDisplay({ style, other, otherLabel }: { style: WorkStyle | null | undefined; other?: WorkStyle | null; otherLabel?: string }) {
  const { t } = useI18n();
  const keys = STYLE_KEYS.filter((k) => style?.[k]);
  if (keys.length === 0) return null;
  return (
    <div className="space-y-4">
      {keys.map((k) => (
        <div key={k}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-ink">{t(`enums.style.${k}` as MessageKey)}</span>
            <span className="text-xs text-faint">
              {(style![k] as number) <= 2 ? t(`enums.style.${k}Low` as MessageKey) : (style![k] as number) >= 4 ? t(`enums.style.${k}High` as MessageKey) : ""}
            </span>
          </div>
          <div className="relative h-2 rounded-full bg-surface-3">
            <span
              className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-brand bg-surface shadow"
              style={{ insetInlineStart: `calc(${(((style![k] as number) - 1) / 4) * 100}% - 8px)` }}
            />
            {other?.[k] ? (
              <span
                title={otherLabel}
                className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-accent/85"
                style={{ insetInlineStart: `calc(${(((other[k] as number) - 1) / 4) * 100}% - 7px)` }}
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
