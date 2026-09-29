import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { PositionView } from "./position-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/positions/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, `/positions/${id}`, { title: t("meta.positionTitle"), description: t("meta.positionDescription") });
}

export default async function Page({ params }: PageProps<"/[lang]/positions/[id]">) {
  const { id } = await params;
  return <PositionView id={id} />;
}
