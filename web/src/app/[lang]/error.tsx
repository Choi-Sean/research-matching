"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <Container className="grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-warn-soft text-warn-text">
          <TriangleAlert className="size-8" />
        </span>
        <h1 className="display mt-8 text-4xl text-ink">{t("states.error.title")}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">{t("states.error.body")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>{t("states.error.retry")}</Button>
          <Button asChild variant="secondary">
            <Link href="/">{t("states.error.home")}</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
