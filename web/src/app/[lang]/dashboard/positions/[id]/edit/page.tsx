"use client";

import { useParams } from "next/navigation";
import { PositionForm } from "@/components/dashboard/position-form";
import { PageHeader } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n/provider";

export default function EditPosition() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const { data } = useApi(`position-${id}`, () => api.position(id));
  return (
    <>
      <PageHeader title={t("dash.positions.editTitle")} />
      {data ? <PositionForm position={data} /> : <Skeleton className="h-96" />}
    </>
  );
}
