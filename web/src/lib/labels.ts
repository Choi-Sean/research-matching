"use client";

import { useCallback } from "react";
import type { MessageKey } from "@/lib/i18n/core";
import { useI18n } from "@/lib/i18n/provider";

/** Translate enum-like values coming from the API. Unknown values fall back to the raw text. */
export function useLabels() {
  const { t, has } = useI18n();
  const label = useCallback(
    (group: string, value: string | null | undefined): string => {
      if (!value) return "";
      const key = `enums.${group}.${value}`;
      return has(key) ? t(key as MessageKey) : value;
    },
    [t, has],
  );
  return {
    compensation: (v: string) => label("compensation", v),
    term: (v: string | null | undefined) => label("term", v),
    location: (v: string | null | undefined) => label("location", v),
    appStatus: (v: string) => label("appStatus", v),
    invStatus: (v: string) => label("invStatus", v),
    outreach: (v: string) => label("outreach", v),
    materialKind: (v: string) => label("materialKind", v),
    role: (v: string) => label("role", v),
    /** "Sophomore" → localized; unknown text passes through. */
    year: (v: string | null | undefined) => (v ? label("year", v.toLowerCase().replace(/[^a-z]/g, "")) : ""),
    grade: (v: string) => label("grade", v),
    sort: (v: string) => label("sort", v),
  };
}

export const COMP_TONE = { paid: "good", credit: "brand", volunteer: "accent" } as const;
export const APP_TONE = { pending: "warn", accepted: "good", rejected: "bad", withdrawn: "neutral" } as const;
export const INV_TONE = { pending: "warn", accepted: "good", declined: "bad", withdrawn: "neutral" } as const;

export const kw = (s: string | null | undefined): string[] =>
  (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export const STYLE_KEYS = ["autonomy", "collaboration", "pace", "structure"] as const;
