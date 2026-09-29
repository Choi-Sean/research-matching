"use client";

import { Toaster } from "sonner";
import { useI18n } from "@/lib/i18n/provider";
import { useTheme } from "@/lib/theme";

export function AppToaster() {
  const { dir } = useI18n();
  const { resolved } = useTheme();
  return (
    <Toaster
      dir={dir}
      theme={resolved}
      position="bottom-center"
      closeButton
      toastOptions={{
        style: {
          background: "var(--surface)",
          color: "var(--ink)",
          border: "1px solid var(--line-2)",
          boxShadow: "var(--shadow-pop)",
          borderRadius: "14px",
          fontFamily: "var(--font-inter), var(--sans-fallback)",
        },
      }}
    />
  );
}
