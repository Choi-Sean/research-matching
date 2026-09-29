"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { LogoMark, Wordmark } from "./logo";
import { Link } from "@/lib/i18n/navigation";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_1.05fr]">
      <div className="relative hidden overflow-hidden bg-deep p-12 text-deep-fg lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -bottom-32 -end-24 size-[34rem] rounded-full opacity-70 blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(84 104 255 / 0.4), transparent)" }} />
        <div aria-hidden className="absolute -top-24 -start-24 size-[22rem] rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(242 181 68 / 0.25), transparent)" }} />
        <div aria-hidden className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_20%,black,transparent)]" style={{ ["--grid" as string]: "rgb(255 255 255 / 0.07)" }} />
        <Link href="/" className="relative flex items-center gap-2.5 text-white">
          <LogoMark />
          <Wordmark />
        </Link>
        <div className="relative max-w-md">
          <h2 className="display text-[clamp(2rem,3.2vw,2.9rem)] text-white">{t("auth.shell.headline")}</h2>
          <ul className="mt-9 space-y-4">
            {(["p1", "p2", "p3"] as const).map((p) => (
              <li key={p} className="flex items-start gap-3 text-deep-muted">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-[#8b99ff]">
                  <Check className="size-3" />
                </span>
                {t(`auth.shell.${p}`)}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-deep-muted/80">{t("auth.shell.footer")}</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <h1 className="display text-[clamp(2rem,3.4vw,2.6rem)] text-ink">{title}</h1>
          <p className="mt-3 text-muted">{subtitle}</p>
          <div className="mt-9">{children}</div>
        </div>
      </div>
    </div>
  );
}
