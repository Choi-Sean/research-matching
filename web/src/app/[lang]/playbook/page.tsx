import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { PlaybookView } from "./playbook-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/playbook">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/playbook", { title: t("meta.playbookTitle"), description: t("meta.playbookDescription") });
}

export default function Page() {
  return <PlaybookView />;
}
