import type { Metadata } from "next";
import {
  CompareSection,
  FaqSection,
  FeatureBento,
  FinalCta,
  Hero,
  HowSection,
  LogoMarquee,
  MatchSection,
  PricingTeaser,
  ProblemSection,
  ProfessorsBand,
  StatsSection,
} from "@/components/marketing/sections";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getI18n(lang);
  return { ...pageMetadata(lang, "/", { description: t("meta.homeDescription") }), title: { absolute: t("meta.homeTitle") } };
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <ProblemSection />
      <FeatureBento />
      <HowSection />
      <MatchSection />
      <CompareSection />
      <ProfessorsBand />
      <StatsSection />
      <PricingTeaser />
      <FaqSection />
      <FinalCta />
    </>
  );
}
