"use client";

import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useLocaleRouter } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/core";

const EXAMPLES = ["ml", "neuro", "genomics", "climate", "quantum", "psych"] as const;

export function HeroSearch({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const router = useLocaleRouter();
  const [mode, setMode] = useState<"interest" | "name">("interest");
  const [q, setQ] = useState("");
  const [uni, setUni] = useState("");

  const go = (query: string, university: string, m = mode) => {
    const sp = new URLSearchParams();
    if (query.trim()) sp.set("q", query.trim());
    if (university.trim()) sp.set("university", university.trim());
    if (m === "name") sp.set("mode", "name");
    router.push(`/discover${sp.size ? `?${sp}` : ""}`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      {!compact && (
        <div role="tablist" aria-label={t("home.hero.modeLabel")} className="mb-3 flex justify-center">
          <div className="inline-flex rounded-full border border-line bg-surface p-1 shadow-sm">
            {(["interest", "name"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "h-8 rounded-full px-4 text-sm font-medium transition-colors",
                  mode === m ? "bg-ink text-canvas" : "text-muted hover:text-ink",
                )}
              >
                {m === "interest" ? t("home.hero.modeInterest") : t("home.hero.modeName")}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q, uni);
        }}
        className="rounded-[1.6rem] border border-line bg-surface p-2 shadow-pop"
      >
        <div className="grid gap-1 sm:grid-cols-[1.7fr_1fr_auto]">
          <label className="group flex flex-col justify-center rounded-[1.15rem] px-4 py-2.5 transition-colors focus-within:bg-surface-2 hover:bg-surface-2/60">
            <span className="text-[0.6875rem] font-semibold tracking-wider text-faint uppercase">
              {mode === "interest" ? t("home.hero.interestLabel") : t("home.hero.nameLabel")}
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={mode === "interest" ? t("home.hero.interestPlaceholder") : t("home.hero.namePlaceholder")}
              className="mt-0.5 w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
              autoComplete="off"
            />
          </label>
          <label className="group flex flex-col justify-center rounded-[1.15rem] px-4 py-2.5 transition-colors focus-within:bg-surface-2 hover:bg-surface-2/60 sm:border-s sm:border-line">
            <span className="text-[0.6875rem] font-semibold tracking-wider text-faint uppercase">{t("home.hero.universityLabel")}</span>
            <input
              value={uni}
              onChange={(e) => setUni(e.target.value)}
              placeholder={t("home.hero.universityPlaceholder")}
              className="mt-0.5 w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
              autoComplete="off"
            />
          </label>
          <Button type="submit" variant="brand" size="lg" className="w-full rounded-[1.15rem] sm:w-auto sm:px-6">
            <Search className="!size-[1.05rem]" />
            <span className="sm:hidden lg:inline">{t("home.hero.search")}</span>
            <ArrowRight className="hidden rtl:rotate-180 sm:max-lg:block" />
          </Button>
        </div>
      </form>

      {!compact && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-faint">{t("home.hero.try")}</span>
          {EXAMPLES.map((k) => (
            <button
              key={k}
              onClick={() => go(t(`home.hero.ex.${k}` as MessageKey), "", "interest")}
              className="rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-brand/40 hover:text-brand-text"
            >
              {t(`home.hero.ex.${k}` as MessageKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
