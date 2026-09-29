"use client";

import { FlaskConical, Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PositionCard, PositionCardSkeleton } from "@/components/position/position-card";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/form";
import { Container, PageHeader } from "@/components/ui/layout";
import { Alert, EmptyState } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useApi, useDebounced, useErrorText } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { useLabels } from "@/lib/labels";

export function PositionsView() {
  const { t, tp } = useI18n();
  const labels = useLabels();
  const errorText = useErrorText();
  const [q, setQ] = useState(useSearchParams().get("q") ?? "");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [compensation, setCompensation] = useState("");
  const [location, setLocation] = useState("");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);

  const dq = useDebounced(q);
  const du = useDebounced(university);
  const dd = useDebounced(department);
  const { data, loading, error } = useApi(JSON.stringify([dq, du, dd, compensation, location, term]), () =>
    api.positions({ q: dq, university: du, department: dd, compensation, location_type: location, term }),
  );

  const active = [university, department, compensation, location, term].filter(Boolean).length;
  const clear = () => {
    setQ("");
    setUniversity("");
    setDepartment("");
    setCompensation("");
    setLocation("");
    setTerm("");
  };

  const chips = (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2.5 text-sm font-medium text-ink">{t("positions.compensation")}</legend>
        <div className="flex flex-wrap gap-2">
          {["", "paid", "credit", "volunteer"].map((v) => (
            <button
              key={v}
              onClick={() => setCompensation(v)}
              aria-pressed={compensation === v}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors pointer-coarse:py-2.5",
                compensation === v ? "border-brand bg-brand-soft text-brand-text" : "border-line text-muted hover:border-line-2 hover:text-ink",
              )}
            >
              {v ? labels.compensation(v) : t("positions.any")}
            </button>
          ))}
        </div>
      </fieldset>
      <Field label={t("positions.location")}>
        <NativeSelect value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">{t("positions.any")}</option>
          {["on_site", "remote", "hybrid"].map((v) => (
            <option key={v} value={v}>
              {labels.location(v)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label={t("positions.term")}>
        <NativeSelect value={term} onChange={(e) => setTerm(e.target.value)}>
          <option value="">{t("positions.any")}</option>
          {["fall", "spring", "summer", "year_round", "flexible"].map((v) => (
            <option key={v} value={v}>
              {labels.term(v)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label={t("positions.university")}>
        <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder={t("positions.universityPlaceholder")} />
      </Field>
      <Field label={t("positions.department")}>
        <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder={t("positions.departmentPlaceholder")} />
      </Field>
      {(active > 0 || q) && (
        <Button variant="ghost" size="sm" onClick={clear}>
          <X /> {t("positions.clear")}
        </Button>
      )}
    </div>
  );

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader title={t("positions.title")} description={t("positions.subtitle")} />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-[1.15rem] -translate-y-1/2 text-faint" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("positions.searchPlaceholder")}
            aria-label={t("positions.searchLabel")}
            className="h-13 ps-11 text-base"
          />
        </div>
        <Button variant="secondary" className="h-13 lg:hidden" onClick={() => setOpen((o) => !o)}>
          <SlidersHorizontal /> {t("positions.filters")}
          {active > 0 && ` (${active})`}
        </Button>
      </div>
      {open && <div className="mt-4 rounded-2xl border border-line bg-surface p-5 lg:hidden">{chips}</div>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{chips}</div>
        </aside>
        <section aria-live="polite">
          <p className="mb-4 text-sm text-muted">{loading && !data ? t("positions.searching") : tp("positions.count", data?.length ?? 0)}</p>
          {error ? (
            <Alert>{errorText(error)}</Alert>
          ) : !data ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, i) => (
                <PositionCardSkeleton key={i} />
              ))}
            </div>
          ) : data.length === 0 ? (
            <EmptyState
              icon={<FlaskConical />}
              title={t("positions.noResults")}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="secondary" onClick={clear}>
                    {t("positions.clear")}
                  </Button>
                  <Button asChild variant="brand">
                    <Link href="/discover">{t("positions.discoverCta")}</Link>
                  </Button>
                </div>
              }
            >
              {t("positions.noResultsBody")}
            </EmptyState>
          ) : (
            <div className={cn("grid gap-4 transition-opacity sm:grid-cols-2", loading && "opacity-60")}>
              {data.map((p) => (
                <PositionCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
