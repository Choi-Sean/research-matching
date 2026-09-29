"use client";

import { Building2, ExternalLink, FlaskConical, ShieldCheck, Users } from "lucide-react";
import { MaterialList } from "@/components/position/materials";
import { PositionCard } from "@/components/position/position-card";
import { StyleDisplay } from "@/components/position/style-display";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Avatar, Card, Chip, EmptyState, Skeleton } from "@/components/ui/surface";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { kw } from "@/lib/labels";

export function LabView({ id }: { id: string }) {
  const { t } = useI18n();
  const lab = useApi(`lab-${id}`, () => api.lab(id));
  const materials = useApi(`lab-materials-${id}`, () => api.labMaterials(id));
  const positions = useApi(`lab-positions-${id}`, () => api.labPositions(id));
  const l = lab.data;

  if (lab.error)
    return (
      <Container className="py-24">
        <EmptyState
          icon={<FlaskConical />}
          title={t("lab.notFound")}
          action={
            <Button asChild variant="secondary">
              <Link href="/positions">{t("positions.backToAll")}</Link>
            </Button>
          }
        >
          {t("lab.notFoundBody")}
        </EmptyState>
      </Container>
    );
  if (!l)
    return (
      <Container className="space-y-4 py-12">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </Container>
    );

  const tags = kw(l.keywords);
  return (
    <>
      <div className="relative isolate overflow-hidden border-b border-line bg-surface-2/50">
        <div aria-hidden className="absolute -top-24 end-0 -z-10 size-[26rem] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, var(--glow-a), transparent)" }} />
        <Container className="py-12 sm:py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar name={l.owner_name} size={84} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="display text-[clamp(1.9rem,3.8vw,2.9rem)] text-ink">{l.name}</h1>
                {l.owner_verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-3 py-1 text-xs font-medium text-good-text">
                    <ShieldCheck className="size-3.5" /> {t("lab.verified")}
                  </span>
                )}
              </div>
              <p className="mt-2 text-muted">
                {l.owner_name} · <Building2 className="mb-0.5 inline size-4" /> {l.university}, {l.department}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {l.team_size && (
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <Users className="size-4" /> {t("lab.teamSize", { count: l.team_size })}
                  </span>
                )}
                {l.website && (
                  <a href={l.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand-text hover:underline pointer-coarse:min-h-11">
                    <ExternalLink className="size-4" /> {t("lab.website")}
                  </a>
                )}
              </div>
            </div>
          </div>
          {l.bio && <p className="mt-7 max-w-3xl text-lg leading-relaxed text-ink/85">{l.bio}</p>}
          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((k) => (
                <Chip key={k}>{k}</Chip>
              ))}
            </div>
          )}
        </Container>
      </div>

      <Container className="grid gap-12 py-12 lg:grid-cols-[1fr_24rem]">
        <section>
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-ink">{t("lab.openPositions")}</h2>
          {positions.data && positions.data.length === 0 ? (
            <EmptyState icon={<FlaskConical />} title={t("lab.noPositions")}>
              {t("lab.noPositionsBody")}
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {positions.data?.map((p) => <PositionCard key={p.id} p={p} />)}
            </div>
          )}
        </section>
        <aside className="space-y-8">
          {(l.culture || l.work_style) && (
            <Card className="p-6">
              <h2 className="mb-3 text-base font-semibold text-ink">{l.culture ? t("lab.culture") : t("lab.workStyle")}</h2>
              {l.culture && <p className="mb-5 text-sm leading-relaxed whitespace-pre-line text-muted">{l.culture}</p>}
              <StyleDisplay style={l.work_style} />
            </Card>
          )}
          <section>
            <h2 className="mb-4 text-base font-semibold text-ink">{t("lab.materials")}</h2>
            {materials.data ? <MaterialList items={materials.data} /> : <Skeleton className="h-24" />}
          </section>
        </aside>
      </Container>
    </>
  );
}
