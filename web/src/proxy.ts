import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_CODES, LOCALE_COOKIE, negotiateLocale } from "@/lib/i18n/config";

/** Every page lives under /<locale>/… — send bare paths to the visitor's language. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (LOCALE_CODES.includes(first)) {
    const res = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      res.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return res;
  }

  const locale = negotiateLocale(request.headers.get("accept-language"), request.cookies.get(LOCALE_COOKIE)?.value);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals and any path with a file extension (icons, robots.txt, sitemap.xml, images…)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
