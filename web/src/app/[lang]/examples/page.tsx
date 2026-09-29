import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { ExamplesView } from "./examples-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/examples">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/examples", { title: t("meta.examplesTitle"), description: t("meta.examplesDescription") });
}

export default function Page() {
  return <ExamplesView />;
}
