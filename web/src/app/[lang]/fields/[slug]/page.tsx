import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fieldBySlug, FIELDS } from "@/content/fields";
import { LOCALES } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/core";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { FieldView } from "./field-view";

export function generateStaticParams() {
  return LOCALES.flatMap((l) => FIELDS.map((f) => ({ lang: l.code, slug: f.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/fields/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!fieldBySlug(slug)) return {};
  const { t } = await getI18n(lang);
  const name = t(`fields.names.${slug}` as MessageKey);
  return pageMetadata(lang, `/fields/${slug}`, { title: t("fields.pageTitle", { field: name }), description: t("fields.pageSubtitle", { field: name.toLowerCase() }) });
}

export default async function Page({ params }: PageProps<"/[lang]/fields/[slug]">) {
  const { slug } = await params;
  if (!fieldBySlug(slug)) notFound();
  return <FieldView slug={slug} />;
}
