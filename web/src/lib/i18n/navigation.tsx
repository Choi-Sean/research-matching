"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { forwardRef, useCallback, useMemo, type ComponentProps } from "react";
import { LOCALE_CODES, LOCALE_COOKIE } from "./config";
import { useI18n } from "./provider";

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** "/discover?q=x" → "/ko/discover?q=x". Leaves external URLs, hashes and already-prefixed paths alone. */
export function localizeHref(href: string, locale: string): string {
  if (!href.startsWith("/") || EXTERNAL.test(href)) return href;
  const first = href.split(/[/?#]/)[1];
  if (first && LOCALE_CODES.includes(first)) return href;
  if (href === "/") return `/${locale}`;
  return `/${locale}${href}`;
}

export function stripLocale(pathname: string): string {
  const first = pathname.split("/")[1];
  if (first && LOCALE_CODES.includes(first)) {
    const rest = pathname.slice(first.length + 1);
    return rest === "" ? "/" : rest;
  }
  return pathname;
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & { href: string };

/** Drop-in for next/link that keeps the visitor in their language. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, ...rest }, ref) {
  const { locale } = useI18n();
  return <NextLink ref={ref} href={localizeHref(href, locale)} {...rest} />;
});

export function usePathnameNoLocale(): string {
  return stripLocale(usePathname());
}

export function useLocaleRouter() {
  const router = useRouter();
  const { locale } = useI18n();
  return useMemo(
    () => ({
      push: (href: string) => router.push(localizeHref(href, locale)),
      replace: (href: string) => router.replace(localizeHref(href, locale)),
      prefetch: (href: string) => router.prefetch(localizeHref(href, locale)),
      back: () => router.back(),
      refresh: () => router.refresh(),
    }),
    [router, locale],
  );
}

/** Switch language while staying on the same page (path, query and hash are preserved). */
export function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (code: string) => {
      document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
      const rest = stripLocale(pathname);
      const search = window.location.search;
      const hash = window.location.hash;
      router.push(`/${code}${rest === "/" ? "" : rest}${search}${hash}`);
    },
    [router, pathname],
  );
}
