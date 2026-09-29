import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { FeedbackView } from "./feedback-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/feedback">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/feedback", { title: t("meta.feedbackTitle"), description: t("meta.feedbackDescription") });
}

export default function Page() {
  return <FeedbackView />;
}
