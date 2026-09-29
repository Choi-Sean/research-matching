"use client";

import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/ui/layout";
import { Alert, Badge, Card } from "@/components/ui/surface";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

// Fictional emails written to illustrate the patterns. Each paragraph is paired with a translated note.
const EXAMPLES = [
  {
    key: "e1" as const,
    subject: "Question about your variable-star paper",
    paragraphs: [
      "Hi Professor Hale,\n\nI'm a first-year student planning to major in astronomy. Over the past few months I've been teaching myself Python by analysing public Sloan Digital Sky Survey data, and your recent paper on detecting variable stars in sparse light curves caught my attention — I've been wrestling with exactly that problem in a small project of my own.",
      "Section 4 made me wonder: does the periodogram approach you describe still hold up when a star has fewer than about 30 observations?",
      "I'd love to get involved in any way I can, even as a volunteer for a few hours a week this fall. If you aren't taking students right now, is there someone in your group you'd recommend I contact?\n\nThank you for your time,\nMaya Chen",
    ],
  },
  {
    key: "e2" as const,
    subject: "Adaptive artifact removal — a question and an offer",
    paragraphs: [
      "Hi Professor Ibarra,\n\nI'm a junior studying biomedical engineering. This semester I've been analysing a public EEG dataset for a side project (filtering, then classifying sleep stages with a simple random forest), and your recent paper on adaptive artifact removal caught my eye — especially the choice to update the filter weights online instead of in batches.",
      "I was curious whether that choice made a measurable difference on short recordings. Has your lab tried the approach on ambulatory data, where artifacts are messier?",
      "I'd love to contribute to your lab this summer, even in a volunteer capacity — I can commit about 12 hours a week. If your group is full, would you recommend anyone else in the department working on similar problems?\n\nBest regards,\nDaniel Ortiz",
    ],
  },
  {
    key: "e3" as const,
    subject: "Your article on classification in shipping records",
    paragraphs: [
      "Hello Professor Lindqvist,\n\nI'm a sophomore majoring in history and took your department's course on migration and labour in the 1920s last term. In the port-authority ledgers we read, I noticed occupations were recorded differently before and after 1924, and I've been curious whether that reflects the law or the clerks.",
      "Your recent article on classification practices in shipping records seems to address exactly this. Did you find the change in categories showed up first in some ports rather than others?",
      "I'd be glad to help with archival coding or transcription a few hours a week this fall — I have experience with spreadsheets and basic R from a statistics course. If there's no room in your project, I'd welcome a pointer to a colleague working with similar sources.\n\nThank you,\nTomás Reyes",
    ],
  },
];

export function ExamplesView() {
  const { t } = useI18n();
  return (
    <Container className="max-w-5xl py-10 sm:py-14">
      <PageHeader title={t("tools.examples.title")} description={t("tools.examples.subtitle")} />
      <Alert tone="info" className="mb-10">
        <span className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0" /> {t("tools.examples.disclaimer")}
        </span>
      </Alert>

      <div className="space-y-12">
        {EXAMPLES.map((ex, n) => (
          <Card key={ex.key} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2/60 px-6 py-4">
              <div className="flex items-center gap-3">
                <Badge tone="brand">{t("tools.examples.example", { n: n + 1 })}</Badge>
                <span className="text-sm font-medium text-ink">{t(`tools.examples.${ex.key}.label` as MessageKey)}</span>
              </div>
              <span className="text-xs text-faint">{t("common.illustrative")}</span>
            </div>
            <div className="border-b border-line px-6 py-3 text-sm" dir="ltr" lang="en">
              <span className="text-faint">Subject: </span>
              <span className="font-medium text-ink">{ex.subject}</span>
            </div>
            <div className="divide-y divide-line">
              {ex.paragraphs.map((p, i) => (
                <div key={i} className="grid gap-4 p-6 md:grid-cols-[1.5fr_1fr] md:gap-8">
                  <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line text-ink/90" dir="ltr" lang="en">
                    {p}
                  </p>
                  <div className="flex items-start gap-3 rounded-xl bg-good-soft/70 p-4">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-good text-xs font-bold text-white">{i + 1}</span>
                    <p className="text-sm leading-relaxed text-good-text">{t(`tools.examples.${ex.key}.note${i + 1}` as MessageKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-14 text-center">
        <Button asChild size="lg" variant="brand">
          <Link href="/tools/email-checker">
            {t("tools.examples.cta")} <ArrowRight className="rtl:rotate-180" />
          </Link>
        </Button>
      </div>
    </Container>
  );
}
