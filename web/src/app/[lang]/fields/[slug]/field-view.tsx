"use client";

import { ArrowLeft, ArrowRight, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Card } from "@/components/ui/surface";
import { PositionCard, PositionCardSkeleton } from "@/components/position/position-card";
import { ProfessorCard, ProfessorCardSkeleton } from "@/components/professor/professor-card";
import { fieldBySlug, FIELDS } from "@/content/fields";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export function FieldView({ slug }: { slug: string }) {
  const { t } = useI18n();
  const field = fieldBySlug(slug);
  const researchers = useApi(field ? `field-${slug}` : null, () => api.searchProfessors({ q: field!.query }));
  const positions = useApi(field ? `field-pos-${slug}` : null, () => api.positions({ q: field!.query.split(" ")[0], limit: 4 }));
  if (!field) return null;
  const name = t(`fields.names.${slug}` as MessageKey);
  const lower = name.toLowerCase();

  return (
    <Container className="py-10 sm:py-14">
      <Link href="/fields" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink pointer-coarse:-mt-3 pointer-coarse:mb-3 pointer-coarse:min-h-11">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("fields.backToAll")}
      </Link>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-text">
          <field.icon className="size-8" />
        </span>
        <div>
          <h1 className="display text-[clamp(2rem,4vw,3rem)] text-ink">{t("fields.pageTitle", { field: name })}</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">{t("fields.pageSubtitle", { field: lower })}</p>
        </div>
      </div>
      <Button asChild variant="brand" size="lg" className="mt-8">
        <Link href={`/discover?q=${encodeURIComponent(field.query)}`}>
          <Search /> {t("fields.searchNow", { field: lower })}
        </Link>
      </Button>

      <section className="mt-14">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {!researchers.data
            ? Array.from({ length: 3 }, (_, i) => <ProfessorCardSkeleton key={i} />)
            : researchers.data.items.slice(0, 6).map((p) => <ProfessorCard key={p.id} p={p} />)}
        </div>
        {researchers.data && researchers.data.total > 6 && (
          <div className="mt-6 text-center">
            <Button asChild variant="secondary">
              <Link href={`/discover?q=${encodeURIComponent(field.query)}`}>
                {t("common.viewAll")} <ArrowRight className="rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        )}
      </section>

      {positions.data && positions.data.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-ink">{t("fields.openPositions", { field: lower })}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {!positions.data ? <PositionCardSkeleton /> : positions.data.map((p) => <PositionCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      <Card className="mt-14 p-7">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{t("fields.tipsTitle", { field: lower })}</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {(["tip1", "tip2", "tip3", "tip4"] as const).map((k) => (
            <li key={k} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink/90">
              <Check className="mt-1 size-4 shrink-0 text-good" /> {t(`fields.${k}`)}
            </li>
          ))}
        </ul>
      </Card>

      <section className="mt-14">
        <h2 className="mb-4 text-sm font-semibold text-ink">{t("fields.related")}</h2>
        <div className="flex flex-wrap gap-2">
          {field.related.map((r) => {
            const rel = FIELDS.find((f) => f.slug === r);
            return rel ? (
              <Link key={r} href={`/fields/${r}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-muted transition-colors hover:border-brand/40 hover:text-brand-text pointer-coarse:py-2.5">
                <rel.icon className="size-4" /> {t(`fields.names.${r}` as MessageKey)}
              </Link>
            ) : null;
          })}
        </div>
      </section>
    </Container>
  );
}
