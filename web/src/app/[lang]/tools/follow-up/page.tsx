import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { FollowUpView } from "./followup-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/tools/follow-up">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/tools/follow-up", { title: t("meta.followUpTitle"), description: t("meta.followUpDescription") });
}

export default function Page() {
  return <FollowUpView />;
}
