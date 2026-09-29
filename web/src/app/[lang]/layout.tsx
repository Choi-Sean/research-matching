import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { BRAND } from "@/components/layout/logo";
import { Navbar } from "@/components/layout/navbar";
import { AppToaster } from "@/components/layout/toaster";
import { TooltipProvider } from "@/components/ui/overlay";
import { AuthProvider } from "@/lib/auth";
import { BookmarksProvider } from "@/lib/bookmarks";
import { LOCALES, SITE_URL, isLocale, localeInfo } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/i18n/provider";
import { getI18n } from "@/lib/i18n/server";
import { ThemeProvider, ThemeScript } from "@/lib/theme";
import "../globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin", "latin-ext", "vietnamese"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export function generateStaticParams() {
  return LOCALES.map((l) => ({ lang: l.code }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { t } = await getI18n(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("meta.homeTitle"), template: `%s · ${BRAND}` },
    description: t("meta.homeDescription"),
    applicationName: BRAND,
    openGraph: { siteName: BRAND, type: "website", locale: localeInfo(lang).intl.replace("-", "_") },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#090b11" },
  ],
  colorScheme: "light dark",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { messages } = await getI18n(lang);
  const info = localeInfo(lang);

  return (
    <html
      lang={lang}
      dir={info.dir}
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${newsreader.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider locale={lang} messages={messages}>
          <ThemeProvider>
            <AuthProvider>
              <BookmarksProvider>
                <TooltipProvider>
                  <Navbar />
                  <main id="main" className="flex-1">
                    {children}
                  </main>
                  <Footer />
                  <AppToaster />
                </TooltipProvider>
              </BookmarksProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
