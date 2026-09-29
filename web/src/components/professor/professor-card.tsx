"use client";

import { Bookmark, BookmarkCheck, MapPin } from "lucide-react";
import { Avatar, Badge, Chip } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import type { ProfessorCard as Prof } from "@/lib/api";
import { useBookmarks } from "@/lib/bookmarks";
import { cn } from "@/lib/cn";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export function SaveButton({ p, className }: { p: Pick<Prof, "id" | "name" | "institution">; className?: string }) {
  const { t } = useI18n();
  const { has, toggle } = useBookmarks();
  const saved = has("professor", p.id);
  return (
    <Button
      variant={saved ? "soft" : "ghost"}
      size="iconSm"
      aria-pressed={saved}
      aria-label={saved ? t("discover.saved") : t("discover.save")}
      onClick={(e) => {
        e.preventDefault();
        void toggle("professor", p.id, { name: p.name, institution: p.institution?.name ?? null });
      }}
      className={className}
    >
      {saved ? <BookmarkCheck /> : <Bookmark />}
    </Button>
  );
}

export function ProfessorCard({ p, matchScore, children }: { p: Prof; matchScore?: number; children?: React.ReactNode }) {
  const { t, fmt } = useI18n();
  return (
    <article className="group relative flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-2 hover:shadow-pop">
      <div className="flex items-start gap-3.5">
        <Avatar name={p.name} size={46} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold tracking-tight text-ink">
            <Link href={`/professors/${p.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
              {p.name}
            </Link>
          </h3>
          {p.institution && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted">
              <MapPin className="size-3.5 shrink-0 text-faint" />
              <span className="truncate">{p.institution.name}</span>
              {p.institution.country && <span className="shrink-0 text-faint">· {fmt.country(p.institution.country)}</span>}
            </p>
          )}
        </div>
        <div className="relative z-10 -m-1">
          <SaveButton p={p} />
        </div>
      </div>

      {p.topics.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.topics.slice(0, 3).map((topic) => (
            <Chip key={topic}>{topic}</Chip>
          ))}
        </div>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
        {[
          [fmt.number(p.h_index), t("discover.hIndex")],
          [fmt.compact(p.works_count), t("discover.papers")],
          [fmt.compact(p.cited_by_count), t("discover.citations")],
        ].map(([v, l]) => (
          <div key={l}>
            <dd className="text-lg font-semibold tabular-nums text-ink">{v}</dd>
            <dt className="text-xs text-faint">{l}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {matchScore !== undefined && <Badge tone={matchScore >= 75 ? "good" : matchScore >= 50 ? "brand" : "neutral"}>{matchScore}%</Badge>}
        {p.works_in_topic != null && (
          <Badge tone="brand">
            {t("discover.onTopic")}: {p.works_in_topic}
          </Badge>
        )}
        {p.recent_works > 0 && (
          <Badge>
            {t("discover.recentWorks")}: {p.recent_works}
          </Badge>
        )}
        {p.on_platform_lab_id && (
          <Link
            href={`/labs/${p.on_platform_lab_id}`}
            className={cn("relative z-10 inline-flex items-center gap-1 rounded-full bg-good-soft px-2.5 py-1 text-xs font-medium text-good-text hover:opacity-80 pointer-coarse:min-h-9 pointer-coarse:px-3")}
          >
            ● {t("discover.onLabora")}
          </Link>
        )}
      </div>
      {children}
    </article>
  );
}

export function ProfessorCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex gap-3.5">
        <div className="size-[46px] animate-shimmer rounded-full bg-surface-3" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-4 w-2/3 animate-shimmer rounded bg-surface-3" />
          <div className="h-3 w-1/2 animate-shimmer rounded bg-surface-3" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-6 w-20 animate-shimmer rounded-lg bg-surface-3" />
        <div className="h-6 w-24 animate-shimmer rounded-lg bg-surface-3" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="mx-auto h-9 w-12 animate-shimmer rounded bg-surface-3" />
        ))}
      </div>
    </div>
  );
}
