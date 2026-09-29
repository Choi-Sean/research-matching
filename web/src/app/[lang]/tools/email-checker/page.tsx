import type { Metadata } from "next";
import { Suspense } from "react";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { CheckerView } from "./checker-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/tools/email-checker">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/tools/email-checker", { title: t("meta.checkerTitle"), description: t("meta.checkerDescription") });
}

export default function Page() {
  return (
    <Suspense>
      <CheckerView />
    </Suspense>
  );
}
