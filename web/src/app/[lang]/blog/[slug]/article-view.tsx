"use client";

import { ArrowLeft, Clock } from "lucide-react";
import { Prose } from "@/components/marketing/prose";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Badge } from "@/components/ui/surface";
import { POSTS, postBySlug } from "@/content/blog";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export function ArticleView({ slug }: { slug: string }) {
  const { t, fmt, locale } = useI18n();
  const post = postBySlug(slug);
  if (!post) return null;
  const more = POSTS.filter((p) => p.slug !== slug && p.category === post.category).concat(POSTS.filter((p) => p.slug !== slug && p.category !== post.category)).slice(0, 2);

  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <Link href="/blog" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink pointer-coarse:-mt-3 pointer-coarse:mb-5 pointer-coarse:min-h-11">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("blog.back")}
      </Link>
      <article>
        <header>
          <Badge tone="brand">{t(`blog.cat.${post.category}` as MessageKey)}</Badge>
          <h1 className="display mt-5 text-[clamp(2rem,4.4vw,3.2rem)] text-ink" lang="en" dir="ltr">
            {post.title}
          </h1>
          <p className="mt-5 flex items-center gap-4 text-sm text-faint">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" /> {t("blog.minRead", { minutes: post.minutes })}
            </span>
            <span suppressHydrationWarning>{fmt.date(post.date)}</span>
          </p>
          {locale !== "en" && <p className="mt-3 text-sm text-faint">{t("blog.englishNote")}</p>}
        </header>
        <div className="mt-10">
          <Prose blocks={post.blocks} />
        </div>
      </article>

      <div className="mt-14 rounded-3xl border border-line bg-gradient-to-br from-brand-soft/60 via-surface to-surface p-8 text-center shadow-card">
        <h2 className="display text-[clamp(1.5rem,3vw,2rem)] text-ink">{t("blog.ctaTitle")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">{t("blog.ctaBody")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="brand">
            <Link href="/discover">{t("blog.ctaFind")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/tools/email-checker">{t("blog.ctaCheck")}</Link>
          </Button>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="mb-4 text-sm font-semibold text-ink">{t("blog.keepReading")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {more.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="rounded-2xl border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-pop">
              <p className="font-semibold text-ink" lang="en" dir="ltr">{p.title}</p>
              <p className="mt-1.5 line-clamp-2 text-sm text-muted" lang="en" dir="ltr">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
