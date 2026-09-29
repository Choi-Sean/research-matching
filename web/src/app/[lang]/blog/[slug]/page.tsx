import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { POSTS, postBySlug } from "@/content/blog";
import { LOCALES } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { ArticleView } from "./article-view";

export function generateStaticParams() {
  return LOCALES.flatMap((l) => POSTS.map((p) => ({ lang: l.code, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/blog/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = postBySlug(slug);
  if (!post) return {};
  return pageMetadata(lang, `/blog/${slug}`, { title: post.title, description: post.excerpt });
}

export default async function Page({ params }: PageProps<"/[lang]/blog/[slug]">) {
  const { slug } = await params;
  if (!postBySlug(slug)) notFound();
  return <ArticleView slug={slug} />;
}
