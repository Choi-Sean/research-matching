"use client";

import { Bookmark, BookmarkCheck, Clock, MapPin, Timer } from "lucide-react";
import { Avatar, Badge, Chip } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import type { Position } from "@/lib/api";
import { useBookmarks } from "@/lib/bookmarks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { COMP_TONE, kw, useLabels } from "@/lib/labels";
import { useDeadline } from "@/lib/use-deadline";

export function PositionSaveButton({ p }: { p: Position }) {
  const { t } = useI18n();
  const { has, toggle } = useBookmarks();
  const saved = has("position", String(p.id));
  return (
    <Button
      variant={saved ? "soft" : "ghost"}
      size="iconSm"
      aria-pressed={saved}
      aria-label={saved ? t("discover.saved") : t("discover.save")}
      onClick={(e) => {
        e.preventDefault();
        void toggle("position", String(p.id), { title: p.title, lab: p.lab.name, university: p.lab.university });
      }}
    >
      {saved ? <BookmarkCheck /> : <Bookmark />}
    </Button>
  );
}

export function PositionCard({ p, badge }: { p: Position; badge?: React.ReactNode }) {
  const { t, fmt } = useI18n();
  const labels = useLabels();
  const deadline = useDeadline();
  const dl = deadline(p.deadline);
  const tags = kw(p.keywords).slice(0, 3);

  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-2 hover:shadow-pop">
      <div className="flex items-start gap-3">
        <Avatar name={p.lab.owner_name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{p.lab.name}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted">
            <MapPin className="size-3 shrink-0" /> {p.lab.university}
          </p>
        </div>
        <div className="relative z-10 -m-1 flex items-center gap-1">
          {badge}
          <PositionSaveButton p={p} />
        </div>
      </div>

      <h3 className="mt-4 text-base leading-snug font-semibold tracking-tight text-ink">
        <Link href={`/positions/${p.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
          {p.title}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{p.description}</p>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((k) => (
            <Chip key={k}>{k}</Chip>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <Badge tone={COMP_TONE[p.compensation]}>{labels.compensation(p.compensation)}</Badge>
        {p.hours_per_week && (
          <Badge>
            <Clock /> {t("common.hoursPerWeek", { n: p.hours_per_week })}
          </Badge>
        )}
        {p.term && <Badge>{labels.term(p.term)}</Badge>}
        {p.location_type && <Badge>{labels.location(p.location_type)}</Badge>}
        {dl && (
          <Badge tone={dl.urgent ? "bad" : "neutral"}>
            <Timer /> {dl.text}
          </Badge>
        )}
      </div>
      <span className="sr-only">{fmt.relative(p.created_at)}</span>
    </article>
  );
}

export function PositionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex gap-3">
        <div className="size-10 animate-shimmer rounded-full bg-surface-3" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-1/2 animate-shimmer rounded bg-surface-3" />
          <div className="h-3 w-1/3 animate-shimmer rounded bg-surface-3" />
        </div>
      </div>
      <div className="mt-5 h-4 w-4/5 animate-shimmer rounded bg-surface-3" />
      <div className="mt-3 h-3 w-full animate-shimmer rounded bg-surface-3" />
      <div className="mt-2 h-3 w-2/3 animate-shimmer rounded bg-surface-3" />
    </div>
  );
}
