import { Fragment, type ReactNode } from "react";
import type en from "@/messages/en.json";
import { localeInfo } from "./config";

// ---------------------------------------------------------------------------------------------
// Typed message keys — derived from the English catalogue, so a typo is a compile error.
// ---------------------------------------------------------------------------------------------
export type Messages = typeof en;
type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
export type MessageKey = Paths<Messages>;
export type PluralKey = MessageKey extends infer K ? (K extends `${infer B}_other` ? B : never) : never;

export type Params = Record<string, string | number>;
export type Tags = Record<string, (chunks: ReactNode) => ReactNode>;

type Tree = { [k: string]: string | Tree };

export function lookup(messages: Tree, key: string): string | undefined {
  let cur: string | Tree | undefined = messages;
  for (const part of key.split(".")) {
    if (cur === undefined || typeof cur === "string") return undefined;
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));
}

const TAG = /<(\/?)([a-zA-Z][\w-]*)\s*(\/?)>/g;

/** Render `Hello <b>world</b> <link>here</link>` with React nodes. Unknown tags render their children. */
export function renderRich(template: string, tags: Tags): ReactNode {
  type Frame = { name: string | null; children: ReactNode[] };
  const stack: Frame[] = [{ name: null, children: [] }];
  let last = 0;
  let key = 0;
  const top = () => stack[stack.length - 1];
  for (const m of template.matchAll(TAG)) {
    if (m.index! > last) top().children.push(template.slice(last, m.index));
    last = m.index! + m[0].length;
    const [, closing, name, selfClosing] = m;
    if (selfClosing) {
      top().children.push(<Fragment key={key++}>{tags[name]?.(null) ?? null}</Fragment>);
    } else if (closing) {
      if (stack.length > 1) {
        const frame = stack.pop()!;
        const inner = frame.children;
        top().children.push(<Fragment key={key++}>{tags[frame.name!] ? tags[frame.name!](inner) : inner}</Fragment>);
      }
    } else {
      stack.push({ name, children: [] });
    }
  }
  if (last < template.length) top().children.push(template.slice(last));
  while (stack.length > 1) {
    const frame = stack.pop()!;
    top().children.push(...frame.children);
  }
  return stack[0].children;
}

export interface Translator {
  locale: string;
  dir: "ltr" | "rtl";
  t: (key: MessageKey, params?: Params) => string;
  /** Plural-aware: looks up `<key>_one`, `<key>_few`… then `<key>_other`, with `{count}` filled in. */
  tp: (key: PluralKey, count: number, params?: Params) => string;
  rich: (key: MessageKey, tags: Tags, params?: Params) => ReactNode;
  has: (key: string) => boolean;
}

export function createTranslator(locale: string, messages: Tree): Translator {
  const info = localeInfo(locale);
  let rules: Intl.PluralRules | null = null;
  const plural = (n: number) => {
    try {
      rules ??= new Intl.PluralRules(info.intl);
      return rules.select(n);
    } catch {
      return "other";
    }
  };
  const t: Translator["t"] = (key, params) => interpolate(lookup(messages, key) ?? key, params);
  return {
    locale,
    dir: info.dir,
    t,
    tp: (key, count, params) => {
      const raw = lookup(messages, `${key}_${plural(count)}`) ?? lookup(messages, `${key}_other`) ?? key;
      return interpolate(raw, { count: new Intl.NumberFormat(info.intl).format(count), ...params });
    },
    rich: (key, tags, params) => renderRich(interpolate(lookup(messages, key) ?? key, params), tags),
    has: (key) => lookup(messages, key) !== undefined,
  };
}

/** Deep-merge `over` on top of `base` (used to overlay a translation on the English fallback). */
export function mergeMessages(base: Tree, over: Tree): Tree {
  const out: Tree = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    out[k] = typeof v === "string" || typeof b !== "object" ? v : mergeMessages(b as Tree, v as Tree);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Number / date / list formatting — always through Intl so every locale gets its own conventions.
// ---------------------------------------------------------------------------------------------
export function createFormatter(locale: string) {
  const tag = localeInfo(locale).intl;
  const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();
  const nf = (opts?: Intl.NumberFormatOptions) => {
    const k = `n${JSON.stringify(opts ?? {})}`;
    if (!cache.has(k)) cache.set(k, new Intl.NumberFormat(tag, opts));
    return cache.get(k) as Intl.NumberFormat;
  };
  const df = (opts?: Intl.DateTimeFormatOptions) => {
    const k = `d${JSON.stringify(opts ?? {})}`;
    if (!cache.has(k)) cache.set(k, new Intl.DateTimeFormat(tag, opts));
    return cache.get(k) as Intl.DateTimeFormat;
  };
  const toDate = (v: string | number | Date) => {
    if (v instanceof Date) return v;
    // Backend timestamps are naive UTC; bare dates (YYYY-MM-DD) are calendar days.
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00`);
    if (typeof v === "string" && !/[zZ]|[+-]\d\d:?\d\d$/.test(v)) return new Date(`${v}Z`);
    return new Date(v);
  };
  return {
    tag,
    number: (n: number, opts?: Intl.NumberFormatOptions) => nf(opts).format(n),
    compact: (n: number) => nf({ notation: "compact", maximumFractionDigits: 1 }).format(n),
    percent: (n: number) => nf({ style: "percent", maximumFractionDigits: 0 }).format(n),
    currency: (cents: number, currency = "USD") =>
      nf({ style: "currency", currency, maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100),
    date: (v: string | number | Date, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) =>
      df(opts).format(toDate(v)),
    /** "3 days ago" / "in 2 days" — picks the largest sensible unit. */
    relative: (v: string | number | Date, now = Date.now()) => {
      const diff = toDate(v).getTime() - now;
      const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
      const abs = Math.abs(diff);
      const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ["year", 31536e6], ["month", 2592e6], ["week", 6048e5], ["day", 864e5], ["hour", 36e5], ["minute", 6e4],
      ];
      for (const [unit, ms] of units) {
        if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
      }
      return rtf.format(0, "second");
    },
    /** Whole days from today (negative = past). */
    daysUntil: (v: string | Date) => {
      const d = toDate(v);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();
      return Math.ceil((end - Date.now()) / 864e5);
    },
    list: (items: string[]) => new Intl.ListFormat(tag, { style: "long", type: "conjunction" }).format(items),
    country: (code?: string | null) => {
      if (!code) return "";
      try {
        return new Intl.DisplayNames(tag, { type: "region" }).of(code.toUpperCase()) ?? code;
      } catch {
        return code;
      }
    },
  };
}
export type Formatter = ReturnType<typeof createFormatter>;
