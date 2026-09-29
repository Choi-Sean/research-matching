import type { Metadata } from "next";
import { Suspense } from "react";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { PricingView } from "./pricing-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/pricing">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/pricing", { title: t("meta.pricingTitle"), description: t("meta.pricingDescription") });
}

export default function Page() {
  return (
    <Suspense>
      <PricingView />
    </Suspense>
  );
}
