import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { ContactView } from "./contact-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/contact", { title: t("meta.contactTitle"), description: t("meta.contactDescription") });
}

export default function Page() {
  return <ContactView />;
}
