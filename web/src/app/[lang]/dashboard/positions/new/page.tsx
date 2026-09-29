"use client";

import { PositionForm } from "@/components/dashboard/position-form";
import { PageHeader } from "@/components/ui/layout";
import { Alert } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export default function NewPosition() {
  const { t } = useI18n();
  const lab = useApi("my-lab", async () => {
    try {
      return await api.myLab();
    } catch {
      return null;
    }
  });

  return (
    <>
      <PageHeader title={t("dash.positions.newTitle")} description={t("dash.positions.newSubtitle")} />
      {lab.data === null ? (
        <Alert tone="warning">
          {t("dash.positions.needLab")}{" "}
          <Link href="/dashboard/lab" className="font-semibold underline">
            {t("dash.positions.createLab")}
          </Link>
        </Alert>
      ) : (
        <PositionForm />
      )}
    </>
  );
}
