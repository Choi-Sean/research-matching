import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { TERMS } from "@/content/legal";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/terms", { title: t("legal.termsTitle") });
}

export default function Page() {
  return <LegalPage kind="terms" blocks={TERMS} />;
}
