"use client";

import { ArrowRight, Clock } from "lucide-react";
import { useState } from "react";
import { Container, PageHeader } from "@/components/ui/layout";
import { Badge } from "@/components/ui/surface";
import { CATEGORIES, POSTS, type Category } from "@/content/blog";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export function BlogView() {
  const { t, fmt, locale } = useI18n();
  const [cat, setCat] = useState<Category | "all">("all");
  const posts = POSTS.filter((p) => cat === "all" || p.category === cat);
  const [featured, ...rest] = posts;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow={t("blog.eyebrow")} title={t("blog.title")} description={t("blog.subtitle")} />
      {locale !== "en" && <p className="-mt-4 mb-8 text-sm text-faint">{t("blog.englishNote")}</p>}

      <div className="mb-10 flex flex-wrap gap-2">
        {(["all", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              cat === c ? "border-brand bg-brand-soft text-brand-text" : "border-line text-muted hover:border-line-2 hover:text-ink",
            )}
          >
            {c === "all" ? t("blog.all") : t(`blog.cat.${c}` as MessageKey)}
          </button>
        ))}
      </div>

      {featured && (
        <Link
          href={`/blog/${featured.slug}`}
          className="group relative mb-6 block overflow-hidden rounded-3xl border border-line bg-surface p-8 shadow-card transition-shadow hover:shadow-pop sm:p-12"
        >
          <div aria-hidden className="absolute -end-20 -top-20 size-80 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, var(--glow-a), transparent)" }} />
          <div className="relative max-w-2xl">
            <Badge tone="brand">{t(`blog.cat.${featured.category}` as MessageKey)}</Badge>
            <h2 className="display mt-5 text-[clamp(1.7rem,3.4vw,2.6rem)] text-ink" lang="en" dir="ltr">
              {featured.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted" lang="en" dir="ltr">
              {featured.excerpt}
            </p>
            <p className="mt-6 flex items-center gap-4 text-sm text-faint">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" /> {t("blog.minRead", { minutes: featured.minutes })}
              </span>
              <span>{fmt.date(featured.date)}</span>
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text">
              {t("blog.read")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
            </span>
          </div>
        </Link>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-card transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-pop"
          >
            <Badge tone="neutral" className="self-start">
              {t(`blog.cat.${p.category}` as MessageKey)}
            </Badge>
            <h3 className="mt-4 text-lg leading-snug font-semibold tracking-tight text-ink group-hover:text-brand-text" lang="en" dir="ltr">
              {p.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted" lang="en" dir="ltr">
              {p.excerpt}
            </p>
            <p className="mt-5 flex items-center gap-3 text-xs text-faint">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" /> {t("blog.minRead", { minutes: p.minutes })}
              </span>
              <span>{fmt.date(p.date)}</span>
            </p>
          </Link>
        ))}
      </div>
    </Container>
  );
}
