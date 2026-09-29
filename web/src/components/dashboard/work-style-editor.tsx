"use client";

import { Dial } from "@/components/ui/form";
import type { WorkStyle } from "@/lib/api";
import type { MessageKey } from "@/lib/i18n/core";
import { useI18n } from "@/lib/i18n/provider";
import { STYLE_KEYS } from "@/lib/labels";

export function WorkStyleEditor({ value, onChange }: { value: WorkStyle | null; onChange: (v: WorkStyle | null) => void }) {
  const { t } = useI18n();
  const set = (k: (typeof STYLE_KEYS)[number], v: number | null) => {
    const next = { ...(value ?? {}), [k]: v };
    onChange(STYLE_KEYS.some((x) => next[x]) ? next : null);
  };
  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {STYLE_KEYS.map((k) => (
        <Dial
          key={k}
          label={t(`enums.style.${k}` as MessageKey)}
          low={t(`enums.style.${k}Low` as MessageKey)}
          high={t(`enums.style.${k}High` as MessageKey)}
          value={value?.[k] ?? null}
          onChange={(v) => set(k, v)}
        />
      ))}
    </div>
  );
}
