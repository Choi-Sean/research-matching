import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { FieldsView } from "./fields-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/fields">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/fields", { title: t("meta.fieldsTitle"), description: t("meta.fieldsDescription") });
}

export default function Page() {
  return <FieldsView />;
}
