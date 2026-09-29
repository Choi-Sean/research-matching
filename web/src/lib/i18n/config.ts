export interface LocaleInfo {
  code: string;
  /** Name in its own language — shown in the language switcher */
  native: string;
  /** English name — used for search and AI prompts */
  english: string;
  dir: "ltr" | "rtl";
  /** BCP-47 tag handed to Intl.* */
  intl: string;
}

// Add a language by adding a row here and dropping `src/messages/<code>.json` next to the others.
// Missing keys fall back to English, so a partial translation never breaks the site.
export const LOCALES: readonly LocaleInfo[] = [
  { code: "en", native: "English", english: "English", dir: "ltr", intl: "en-US" },
  { code: "ko", native: "한국어", english: "Korean", dir: "ltr", intl: "ko-KR" },
  { code: "ja", native: "日本語", english: "Japanese", dir: "ltr", intl: "ja-JP" },
  { code: "zh", native: "简体中文", english: "Chinese (Simplified)", dir: "ltr", intl: "zh-CN" },
  { code: "zh-TW", native: "繁體中文", english: "Chinese (Traditional)", dir: "ltr", intl: "zh-TW" },
  { code: "es", native: "Español", english: "Spanish", dir: "ltr", intl: "es-ES" },
  { code: "fr", native: "Français", english: "French", dir: "ltr", intl: "fr-FR" },
  { code: "de", native: "Deutsch", english: "German", dir: "ltr", intl: "de-DE" },
  { code: "pt", native: "Português", english: "Portuguese (Brazil)", dir: "ltr", intl: "pt-BR" },
  { code: "it", native: "Italiano", english: "Italian", dir: "ltr", intl: "it-IT" },
  { code: "ru", native: "Русский", english: "Russian", dir: "ltr", intl: "ru-RU" },
  { code: "ar", native: "العربية", english: "Arabic", dir: "rtl", intl: "ar-u-nu-latn" },
  { code: "hi", native: "हिन्दी", english: "Hindi", dir: "ltr", intl: "hi-IN" },
  { code: "vi", native: "Tiếng Việt", english: "Vietnamese", dir: "ltr", intl: "vi-VN" },
  { code: "tr", native: "Türkçe", english: "Turkish", dir: "ltr", intl: "tr-TR" },
  { code: "id", native: "Bahasa Indonesia", english: "Indonesian", dir: "ltr", intl: "id-ID" },
];

export const LOCALE_CODES = LOCALES.map((l) => l.code);
export type Locale = string;
export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "labora_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && LOCALE_CODES.includes(value);
}

export function localeInfo(code: string): LocaleInfo {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

/** Pick the best supported locale from an Accept-Language header (and an earlier explicit choice). */
export function negotiateLocale(acceptLanguage: string | null | undefined, preferred?: string | null): Locale {
  if (isLocale(preferred)) return preferred;
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const wanted = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .filter((x) => x.tag && x.tag !== "*")
    .sort((a, b) => b.q - a.q);
  for (const { tag } of wanted) {
    const exact = LOCALE_CODES.find((c) => c.toLowerCase() === tag);
    if (exact) return exact;
    if (tag.startsWith("zh")) return /tw|hk|mo|hant/.test(tag) ? "zh-TW" : "zh";
    if (tag.startsWith("pt")) return "pt";
    if (tag === "nb" || tag === "no") continue;
    const base = tag.split("-")[0];
    const byBase = LOCALE_CODES.find((c) => c.toLowerCase() === base);
    if (byBase) return byBase;
  }
  return DEFAULT_LOCALE;
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
