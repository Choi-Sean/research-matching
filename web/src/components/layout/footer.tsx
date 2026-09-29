"use client";

import { Container } from "@/components/ui/layout";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { Logo } from "./navbar";
import { LanguageSwitcher, ThemeSegmented } from "./preferences";

export function Footer() {
  const { t } = useI18n();
  const columns = [
    {
      title: t("footer.product"),
      links: [
        ["/discover", t("nav.discover")],
        ["/positions", t("nav.positions")],
        ["/ai-match", t("nav.aiMatch")],
        ["/pricing", t("nav.pricing")],
        ["/how-it-works", t("footer.howItWorks")],
      ],
    },
    {
      title: t("footer.tools"),
      links: [
        ["/tools/email-checker", t("nav.emailChecker")],
        ["/tools/follow-up", t("nav.followUp")],
        ["/framework", t("nav.framework")],
        ["/examples", t("nav.examples")],
      ],
    },
    {
      title: t("footer.resources"),
      links: [
        ["/blog", t("nav.blog")],
        ["/fields", t("nav.fields")],
        ["/feedback", t("nav.feedback")],
        ["/contact", t("footer.contact")],
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        ["/privacy", t("footer.privacy")],
        ["/terms", t("footer.terms")],
      ],
    },
  ] as const;

  return (
    <footer className="mt-12 border-t border-line bg-surface-2/50">
      <Container className="py-14">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">{t("footer.tagline")}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <LanguageSwitcher variant="full" />
              <ThemeSegmented />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="text-sm font-semibold text-ink">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-muted transition-colors hover:text-ink">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <p>
            {t("footer.dataBy")}{" "}
            <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
              OpenAlex
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
