import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { AdminView } from "./admin-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return { title: t("dash.admin.title"), robots: { index: false, follow: false } };
}

export default function Page() {
  return <AdminView />;
}
