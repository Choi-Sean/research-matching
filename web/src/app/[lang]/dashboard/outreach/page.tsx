"use client";

import { CalendarClock, ExternalLink, Repeat, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/layout";
import { Alert, Avatar, Badge, Card, EmptyState, Skeleton } from "@/components/ui/surface";
import { api, type OutreachEntry, type OutreachStatus } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useApi, useErrorText } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { useLabels } from "@/lib/labels";

const STATUSES: OutreachStatus[] = ["saved", "drafted", "sent", "replied", "meeting", "positive", "no_reply", "declined"];
const TONE: Record<OutreachStatus, "neutral" | "warn" | "good" | "brand" | "bad"> = {
  saved: "neutral", drafted: "neutral", sent: "warn", replied: "good", meeting: "brand", positive: "good", no_reply: "bad", declined: "bad",
};
const FILTERS = ["all", "active", "replied", "closed"] as const;

export default function OutreachPage() {
  const { t, fmt } = useI18n();
  const labels = useLabels();
  const errorText = useErrorText();
  const { data, error, setData } = useApi("outreach-all", () => api.outreach());
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const list = data ?? [];
  const isDue = (e: OutreachEntry) => e.follow_up_on && fmt.daysUntil(e.follow_up_on) <= 0 && e.status === "sent";
  const stats = [
    [t("dash.outreach.stats.total"), list.length],
    [t("dash.outreach.stats.sent"), list.filter((e) => ["sent", "replied", "meeting", "positive", "no_reply", "declined"].includes(e.status)).length],
    [t("dash.outreach.stats.replied"), list.filter((e) => ["replied", "meeting", "positive"].includes(e.status)).length],
    [t("dash.outreach.stats.due"), list.filter(isDue).length],
  ] as const;

  const shown = list.filter((e) =>
    filter === "all" ? true : filter === "active" ? ["saved", "drafted", "sent"].includes(e.status) : filter === "replied" ? ["replied", "meeting", "positive"].includes(e.status) : ["no_reply", "declined"].includes(e.status),
  );

  const update = async (e: OutreachEntry, patch: Parameters<typeof api.patchOutreach>[1]) => {
    try {
      const u = await api.patchOutreach(e.id, patch);
      setData((prev) => (prev ?? []).map((x) => (x.id === u.id ? u : x)));
    } catch (err) {
      toast.error(errorText(err));
    }
  };
  const remove = async (e: OutreachEntry) => {
    if (!confirm(t("dash.outreach.removeConfirm"))) return;
    try {
      await api.deleteOutreach(e.id);
      setData((prev) => (prev ?? []).filter((x) => x.id !== e.id));
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <>
      <PageHeader
        title={t("dash.outreach.title")}
        description={t("dash.outreach.subtitle")}
        action={
          <Button asChild variant="secondary">
            <Link href="/discover">
              <Search /> {t("dash.outreach.find")}
            </Link>
          </Button>
        }
      />
      {error != null && <Alert>{errorText(error)}</Alert>}

      {!data ? (
        <Skeleton className="h-64" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Repeat />}
          title={t("dash.outreach.emptyTitle")}
          action={
            <Button asChild>
              <Link href="/discover">{t("dash.outreach.find")}</Link>
            </Button>
          }
        >
          {t("dash.outreach.emptyBody")}
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(([label, value]) => (
              <Card key={label} className="p-4">
                <p className="text-2xl font-semibold tabular-nums text-ink">{value}</p>
                <p className="text-xs text-muted">{label}</p>
              </Card>
            ))}
          </div>

          <div className="my-6 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                  filter === f ? "border-brand bg-brand-soft text-brand-text" : "border-line text-muted hover:border-line-2 hover:text-ink",
                )}
              >
                {f === "all" ? t("discover.minHAny") : f === "active" ? t("enums.outreach.sent") : f === "replied" ? t("enums.outreach.replied") : t("enums.outreach.no_reply")}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {shown.map((e) => (
              <Card key={e.id} className="p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar name={e.professor_name} size={42} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/professors/${e.openalex_id}`} className="font-semibold text-ink hover:text-brand-text">
                      {e.professor_name}
                    </Link>
                    <p className="truncate text-sm text-muted">{e.institution}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-faint">
                      {e.sent_on && <span>{t("dash.outreach.sentOn", { date: fmt.date(e.sent_on) })}</span>}
                      {e.replied_on && <span>· {t("dash.outreach.repliedOn", { date: fmt.date(e.replied_on) })}</span>}
                      {e.follow_up_on && e.status === "sent" && (
                        <Badge tone={isDue(e) ? "bad" : "warn"}>
                          <CalendarClock /> {isDue(e) ? t("dash.outreach.overdue") : t("dash.outreach.followUpDue", { when: fmt.relative(new Date(`${e.follow_up_on}T00:00:00`)) })}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={TONE[e.status]} className="hidden sm:inline-flex">
                      {labels.outreach(e.status)}
                    </Badge>
                    <div className="w-40">
                      <NativeSelect aria-label={t("dash.outreach.status")} value={e.status} onChange={(ev) => update(e, { status: ev.target.value as OutreachStatus })} className="h-9 text-sm">
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {labels.outreach(s)}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <Textarea
                    defaultValue={e.notes ?? ""}
                    placeholder={t("dash.outreach.notesPlaceholder")}
                    aria-label={t("dash.outreach.notes")}
                    className="min-h-16 text-sm"
                    onBlur={(ev) => ev.target.value !== (e.notes ?? "") && update(e, { notes: ev.target.value })}
                  />
                  <div className="flex gap-1.5">
                    {e.status === "sent" && (
                      <Button asChild variant="soft" size="sm">
                        <Link href="/tools/follow-up">
                          <ExternalLink /> {t("dash.outreach.planFollowUp")}
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => remove(e)} aria-label={t("dash.outreach.remove")}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-8 rounded-2xl border border-line bg-surface/60 p-4 text-sm leading-relaxed text-muted">
            <span className="font-semibold text-ink">{t("dash.outreach.helpTitle")} </span>
            {t("dash.outreach.helpBody")}
          </p>
        </>
      )}
    </>
  );
}
