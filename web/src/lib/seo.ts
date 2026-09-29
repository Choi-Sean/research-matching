import type { Metadata } from "next";
import { BRAND } from "@/components/layout/logo";
import { LOCALES, SITE_URL, localeInfo } from "@/lib/i18n/config";

/** Per-page metadata with canonical + hreflang alternates for every supported language. */
export function pageMetadata(
  lang: string,
  path: string,
  { title, description }: { title?: string; description?: string },
): Metadata {
  const suffix = path === "/" ? "" : path;
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: {
      canonical: `/${lang}${suffix}`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l.code, `/${l.code}${suffix}`])),
        "x-default": `/en${suffix}`,
      },
    },
    openGraph: {
      title: title ? `${title} · ${BRAND}` : BRAND,
      description,
      url: `${SITE_URL}/${lang}${suffix}`,
      siteName: BRAND,
      locale: localeInfo(lang).intl.replace("-", "_"),
      type: "website",
    },
  };
}
