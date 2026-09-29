import type { MetadataRoute } from "next";
import { POSTS } from "@/content/blog";
import { FIELDS } from "@/content/fields";
import { LOCALES, SITE_URL } from "@/lib/i18n/config";

const STATIC = ["", "/discover", "/positions", "/ai-match", "/pricing", "/how-it-works", "/tools/email-checker", "/tools/follow-up", "/framework", "/examples", "/fields", "/blog", "/playbook", "/feedback", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...STATIC, ...FIELDS.map((f) => `/fields/${f.slug}`), ...POSTS.map((p) => `/blog/${p.slug}`)];
  return paths.flatMap((path) =>
    LOCALES.map((l) => ({
      url: `${SITE_URL}/${l.code}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" || path === "/blog" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path.split("/").length > 2 ? 0.5 : 0.7,
      alternates: { languages: Object.fromEntries(LOCALES.map((x) => [x.code, `${SITE_URL}/${x.code}${path}`])) },
    })),
  );
}
