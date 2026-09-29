import type { Metadata } from "next";
import { Suspense } from "react";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { DiscoverView } from "./discover-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/discover">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/discover", { title: t("meta.discoverTitle"), description: t("meta.discoverDescription") });
}

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverView />
    </Suspense>
  );
}
