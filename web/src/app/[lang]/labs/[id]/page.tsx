import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { LabView } from "./lab-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/labs/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, `/labs/${id}`, { title: t("meta.labTitle"), description: t("meta.labDescription") });
}

export default async function Page({ params }: PageProps<"/[lang]/labs/[id]">) {
  const { id } = await params;
  return <LabView id={id} />;
}
