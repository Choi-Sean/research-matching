"use client";

import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <Container className="grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand-soft text-brand-text">
          <Compass className="size-8" />
        </span>
        <p className="display mt-8 text-7xl text-brand-text tabular-nums">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">{t("states.notFound.title")}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">{t("states.notFound.body")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="primary">
            <Link href="/">{t("states.notFound.home")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/discover">{t("states.notFound.search")}</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
