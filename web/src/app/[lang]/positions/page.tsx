import type { Metadata } from "next";
import { Suspense } from "react";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { PositionsView } from "./positions-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/positions">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/positions", { title: t("meta.positionsTitle"), description: t("meta.positionsDescription") });
}

export default function Page() {
  return (
    <Suspense>
      <PositionsView />
    </Suspense>
  );
}
