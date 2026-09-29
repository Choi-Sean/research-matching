"use client";

import { Database, ExternalLink, FileText, Image as ImageIcon, Paperclip } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/surface";
import type { Material, MaterialKind } from "@/lib/api";
import { useI18n } from "@/lib/i18n/provider";
import { useLabels } from "@/lib/labels";

const ICONS: Record<MaterialKind, typeof FileText> = { paper: FileText, dataset: Database, poster: ImageIcon, other: Paperclip };

export function MaterialItem({ m, action }: { m: Material; action?: ReactNode }) {
  const labels = useLabels();
  const Icon = ICONS[m.kind];
  return (
    <div className="group flex items-start gap-3.5 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-2">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-text">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-brand-text">
          <span className="truncate">{m.title}</span>
          <ExternalLink className="size-3.5 shrink-0 opacity-50" />
        </a>
        {m.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{m.description}</p>}
        <div className="mt-2">
          <Badge tone="brand">{labels.materialKind(m.kind)}</Badge>
        </div>
      </div>
      {action}
    </div>
  );
}

export function MaterialList({ items }: { items: Material[] }) {
  const { t } = useI18n();
  if (items.length === 0) return <p className="text-sm text-muted">{t("positions.noMaterials")}</p>;
  return (
    <div className="space-y-3">
      {items.map((m) => (
        <MaterialItem key={m.id} m={m} />
      ))}
    </div>
  );
}
