import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { BlogView } from "./blog-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/blog">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return pageMetadata(lang, "/blog", { title: t("meta.blogTitle"), description: t("meta.blogDescription") });
}

export default function Page() {
  return <BlogView />;
}
