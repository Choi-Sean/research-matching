"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n/provider";

/** Human-friendly deadline text in the visitor's language ("Closes in 3 days"). */
export function useDeadline() {
  const { t, fmt } = useI18n();
  return useCallback(
    (deadline: string | null): { text: string; urgent: boolean } | null => {
      if (!deadline) return null;
      const days = fmt.daysUntil(deadline);
      if (days < 0) return { text: t("positions.deadlinePassed"), urgent: true };
      if (days <= 14) return { text: t("positions.closes", { when: fmt.relative(new Date(`${deadline}T23:59:59`)) }), urgent: days <= 7 };
      return { text: t("positions.applyBy", { date: fmt.date(deadline, { month: "short", day: "numeric" }) }), urgent: false };
    },
    [t, fmt],
  );
}
