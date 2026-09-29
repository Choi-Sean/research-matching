import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { FrameworkView } from "./framework-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/framework">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/framework", { title: t("meta.frameworkTitle"), description: t("meta.frameworkDescription") });
}

export default function Page() {
  return <FrameworkView />;
}
