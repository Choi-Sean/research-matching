import "server-only";
import { cache } from "react";
import { createFormatter, createTranslator, mergeMessages } from "./core";
import { DEFAULT_LOCALE, isLocale } from "./config";

type Tree = { [k: string]: string | Tree };

// Bundlers need static import paths. To add a language: add a row to LOCALES in config.ts,
// add its file to src/messages/, and add one line here.
const catalogues: Record<string, () => Promise<{ default: unknown }>> = {
  en: () => import("@/messages/en.json"),
  ko: () => import("@/messages/ko.json"),
  ja: () => import("@/messages/ja.json"),
  zh: () => import("@/messages/zh.json"),
  "zh-TW": () => import("@/messages/zh-TW.json"),
  es: () => import("@/messages/es.json"),
  fr: () => import("@/messages/fr.json"),
  de: () => import("@/messages/de.json"),
  pt: () => import("@/messages/pt.json"),
  it: () => import("@/messages/it.json"),
  ru: () => import("@/messages/ru.json"),
  ar: () => import("@/messages/ar.json"),
  hi: () => import("@/messages/hi.json"),
  vi: () => import("@/messages/vi.json"),
  tr: () => import("@/messages/tr.json"),
  id: () => import("@/messages/id.json"),
};

/** English overlaid with the requested language, so a missing translation shows English instead of a raw key. */
export const getMessages = cache(async (locale: string): Promise<Tree> => {
  const english = (await catalogues[DEFAULT_LOCALE]()).default as Tree;
  if (locale === DEFAULT_LOCALE || !isLocale(locale)) return english;
  try {
    const localised = (await catalogues[locale]()).default as Tree;
    return mergeMessages(english, localised);
  } catch {
    return english;
  }
});

export const getI18n = cache(async (locale: string) => {
  const messages = await getMessages(locale);
  return { ...createTranslator(locale, messages), fmt: createFormatter(locale), messages };
});
