import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { ProfessorView } from "./professor-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/professors/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, `/professors/${id}`, { title: t("meta.professorTitle"), description: t("meta.professorDescription") });
}

export default async function ProfessorPage({ params }: PageProps<"/[lang]/professors/[id]">) {
  const { id } = await params;
  return <ProfessorView id={id} />;
}
