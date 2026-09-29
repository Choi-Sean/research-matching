"use client";

import { Compass, Info, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { InstitutionCombobox } from "@/components/professor/institution-combobox";
import { ProfessorCard, ProfessorCardSkeleton } from "@/components/professor/professor-card";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/form";
import { Container, PageHeader } from "@/components/ui/layout";
import { Alert, EmptyState } from "@/components/ui/surface";
import { api, type Institution, type ProfessorCard as Prof, type ProfessorSearch } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useErrorText } from "@/lib/hooks";
import { useLocaleRouter } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { useLabels } from "@/lib/labels";

interface Query {
  q: string;
  university: string;
  institution_id: string;
  mode: "interest" | "name";
  sort: "relevance" | "cited" | "recent";
  min_h: number;
}

export function DiscoverView() {
  const { t, tp, fmt } = useI18n();
  const labels = useLabels();
  const errorText = useErrorText();
  const router = useLocaleRouter();
  const sp = useSearchParams();

  const initial: Query = {
    q: sp.get("q") ?? "",
    university: sp.get("university") ?? "",
    institution_id: sp.get("institution_id") ?? "",
    mode: sp.get("mode") === "name" ? "name" : "interest",
    sort: (["cited", "recent"].includes(sp.get("sort") ?? "") ? sp.get("sort") : "relevance") as Query["sort"],
    min_h: Number(sp.get("min_h") ?? 0) || 0,
  };
  const [form, setForm] = useState(initial);
  const [active, setActive] = useState<Query | null>(initial.q.trim().length >= 2 ? initial : null);
  const [pages, setPages] = useState<Prof[]>([]);
  const [meta, setMeta] = useState<Pick<ProfessorSearch, "total" | "has_more" | "institution"> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(initial.q.trim().length >= 2);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Start with the cursor in the search box on desktop; on phones that would throw the keyboard over the page before anyone asked for it.
  const qRef = useRef<HTMLInputElement>(null);
  const startedEmpty = useRef(!initial.q);
  useEffect(() => {
    if (startedEmpty.current && !window.matchMedia("(pointer: coarse)").matches) qRef.current?.focus();
  }, []);

  // Fetch whenever the active query or page changes (submit / load-more mark the request as pending before they change either).
  useEffect(() => {
    if (!active) return;
    const ctrl = new AbortController();
    api
      .searchProfessors(
        {
          q: active.q.trim(),
          mode: active.mode,
          institution_id: active.institution_id || undefined,
          university: active.institution_id ? undefined : active.university.trim() || undefined,
          sort: active.sort,
          min_h: active.min_h || undefined,
          page,
        },
        ctrl.signal,
      )
      .then((r) => {
        setPages((prev) => (page === 1 ? r.items : [...prev, ...r.items]));
        setMeta({ total: r.total, has_more: r.has_more, institution: r.institution });
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setError(errorText(e));
      })
      .finally(() => {
        // An aborted request belongs to a query that has been replaced; the newer one owns the loading state.
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [active, page, errorText]);

  const submit = (next: Query) => {
    const query = { ...next, q: next.q.trim() };
    if (query.q.length < 2) return;
    setLoading(true);
    setError(null);
    setPage(1);
    setActive(query);
    const params = new URLSearchParams({ q: query.q });
    if (query.institution_id) params.set("institution_id", query.institution_id);
    if (query.university) params.set("university", query.university);
    if (query.mode === "name") params.set("mode", "name");
    if (query.sort !== "relevance") params.set("sort", query.sort);
    if (query.min_h) params.set("min_h", String(query.min_h));
    router.replace(`/discover?${params}`);
  };

  const set = <K extends keyof Query>(k: K, v: Query[K]) => setForm((f) => ({ ...f, [k]: v }));
  const onPick = (inst: Institution | null) => setForm((f) => ({ ...f, institution_id: inst?.id ?? "" }));

  const heading = useMemo(() => {
    if (!active) return "";
    const base = t("discover.resultsFor", { q: active.q });
    const uni = meta?.institution?.name ?? (active.university || "");
    return uni ? `${base} ${t("discover.resultsAt", { university: uni })}` : base;
  }, [active, meta, t]);

  const refine = (patch: Partial<Query>) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (active) submit(next);
  };

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader title={t("discover.title")} description={t("discover.subtitle")} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(form);
        }}
        className="rounded-3xl border border-line bg-surface p-4 shadow-card sm:p-5"
      >
        <div role="tablist" aria-label={t("home.hero.modeLabel")} className="mb-4 inline-flex rounded-full border border-line bg-surface-2 p-1">
          {(["interest", "name"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={form.mode === m}
              onClick={() => set("mode", m)}
              className={cn(
                "h-8 rounded-full px-4 text-sm font-medium transition-colors pointer-coarse:h-10",
                form.mode === m ? "bg-ink text-canvas" : "text-muted hover:text-ink",
              )}
            >
              {m === "interest" ? t("discover.modeInterest") : t("discover.modeName")}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
          <Field label={form.mode === "interest" ? t("discover.interestLabel") : t("discover.nameLabel")}>
            <Input
              value={form.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder={form.mode === "interest" ? t("discover.interestPlaceholder") : t("discover.namePlaceholder")}
              ref={qRef}
              enterKeyHint="search"
            />
          </Field>
          <Field label={t("discover.universityLabel")}>
            <InstitutionCombobox
              value={form.university}
              onChange={(v) => set("university", v)}
              onPick={onPick}
              placeholder={t("discover.universityPlaceholder")}
            />
          </Field>
          <Button type="submit" variant="brand" size="md" className="h-11 md:px-7" loading={loading && page === 1}>
            <Search /> {t("discover.search")}
          </Button>
        </div>
      </form>

      {/* results */}
      <div className="mt-10">
        {!active ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <EmptyState icon={<Compass />} title={t("discover.startTitle")}>
              {t("discover.startBody")}
            </EmptyState>
            <RankingNote />
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-ink">{heading}</h2>
                <p className="mt-0.5 text-sm text-muted" aria-live="polite">
                  {loading && pages.length === 0 ? t("discover.searching") : meta ? tp("discover.resultsCount", meta.total) : ""}
                </p>
              </div>
              <div className="flex items-end gap-3 max-sm:w-full max-sm:flex-wrap">
                <Button variant="secondary" size="sm" className="sm:hidden" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((o) => !o)}>
                  <SlidersHorizontal /> {t("discover.filters")}
                </Button>
                {/* Phones: the two selects share a row under the button; from sm up they sit inline. */}
                <div className={cn("items-end gap-3 max-sm:w-full max-sm:grid-cols-2", filtersOpen ? "max-sm:grid sm:flex" : "hidden sm:flex")}>
                  <Field label={t("discover.sortBy")} className="sm:w-40">
                    <NativeSelect value={form.sort} onChange={(e) => refine({ sort: e.target.value as Query["sort"] })}>
                      {(["relevance", "cited", "recent"] as const).map((s) => (
                        <option key={s} value={s}>
                          {labels.sort(s)}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label={t("discover.minH")} className="sm:w-36">
                    <NativeSelect value={form.min_h} onChange={(e) => refine({ min_h: Number(e.target.value) })}>
                      <option value={0}>{t("discover.minHAny")}</option>
                      {[5, 10, 20, 30, 50].map((n) => (
                        <option key={n} value={n}>
                          ≥ {fmt.number(n)}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>
              </div>
            </div>

            {error && <Alert>{error}</Alert>}

            {loading && pages.length === 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <ProfessorCardSkeleton key={i} />
                ))}
              </div>
            ) : pages.length === 0 && !error ? (
              <EmptyState
                icon={<Search />}
                title={t("discover.noResults")}
                action={
                  <Button variant="secondary" onClick={() => refine({ university: "", institution_id: "", min_h: 0 })}>
                    {t("discover.clearFilters")}
                  </Button>
                }
              >
                {t("discover.noResultsBody")}
              </EmptyState>
            ) : (
              <>
                <div className={cn("grid gap-4 transition-opacity md:grid-cols-2 xl:grid-cols-3", loading && "opacity-60")}>
                  {pages.map((p) => (
                    <ProfessorCard key={p.id} p={p} />
                  ))}
                </div>
                {meta?.has_more && (
                  <div className="mt-8 text-center">
                    <Button
                      variant="secondary"
                      size="lg"
                      loading={loading}
                      onClick={() => {
                        setLoading(true);
                        setError(null);
                        setPage((n) => n + 1);
                      }}
                    >
                      {t("discover.loadMore")}
                    </Button>
                  </div>
                )}
                <div className="mt-10 grid gap-4 md:grid-cols-2">
                  <RankingNote />
                  <p className="flex items-start gap-3 rounded-2xl border border-line bg-surface/60 p-4 text-sm leading-relaxed text-muted">
                    <Info className="mt-0.5 size-4 shrink-0 text-faint" />
                    {t("discover.disclaimer")}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Container>
  );
}

function RankingNote() {
  const { t } = useI18n();
  return (
    <aside className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h3 className="text-sm font-semibold text-ink">{t("discover.noteTitle")}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t("discover.noteBody")}</p>
    </aside>
  );
}
