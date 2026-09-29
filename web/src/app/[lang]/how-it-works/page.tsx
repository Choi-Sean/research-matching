import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { HowView } from "./how-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/how-it-works">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/how-it-works", { title: t("meta.howTitle"), description: t("meta.howDescription") });
}

export default function Page() {
  return <HowView />;
}
