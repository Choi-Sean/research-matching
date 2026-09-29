"use client";

import { Direction } from "radix-ui";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createFormatter, createTranslator, type Formatter, type Translator } from "./core";

type Tree = { [k: string]: string | Tree };
export type I18n = Translator & { fmt: Formatter };

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Tree;
  children: ReactNode;
}) {
  const value = useMemo<I18n>(
    () => ({ ...createTranslator(locale, messages), fmt: createFormatter(locale) }),
    [locale, messages],
  );
  return (
    <I18nContext.Provider value={value}>
      <Direction.Provider dir={value.dir}>{children}</Direction.Provider>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
