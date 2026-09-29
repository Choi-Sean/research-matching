"use client";

import { ArrowRight } from "lucide-react";
import { Container, PageHeader } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { FIELDS } from "@/content/fields";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export function FieldsView() {
  const { t } = useI18n();
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow={t("fields.eyebrow")} title={t("fields.title")} description={t("fields.subtitle")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((f, i) => {
          const name = t(`fields.names.${f.slug}` as MessageKey);
          return (
            <Reveal key={f.slug} delay={(i % 3) * 70}>
              <Link
                href={`/fields/${f.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-2 hover:shadow-pop"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-text">
                  <f.icon className="size-5" />
                </span>
                <h2 className="mt-5 text-lg font-semibold tracking-tight text-ink">{name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t("fields.blurb", { field: name.toLowerCase() })}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-text">
                  {t("fields.cta", { field: name.toLowerCase() })}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </Container>
  );
}
