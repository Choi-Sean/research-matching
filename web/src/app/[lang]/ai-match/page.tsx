import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { AiMatchView } from "./ai-match-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/ai-match">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/ai-match", { title: t("meta.aiMatchTitle"), description: t("meta.aiMatchDescription") });
}

export default function Page() {
  return <AiMatchView />;
}
