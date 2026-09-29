"use client";

import { Bookmark, GraduationCap, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { Avatar, Card, EmptyState } from "@/components/ui/surface";
import { useBookmarks } from "@/lib/bookmarks";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

export default function SavedPage() {
  const { t } = useI18n();
  const { items, toggle } = useBookmarks();
  const professors = items.filter((b) => b.kind === "professor");
  const positions = items.filter((b) => b.kind === "position");

  const rows = (list: typeof items, hrefBase: string) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {list.map((b) => {
        const name = String(b.snapshot?.name ?? b.snapshot?.title ?? b.ref);
        const sub = String(b.snapshot?.institution ?? b.snapshot?.lab ?? "");
        return (
          <Card key={b.id} className="flex items-center gap-3.5 p-4">
            <Avatar name={name} size={42} />
            <div className="min-w-0 flex-1">
              <Link href={`${hrefBase}/${b.ref}`} className="block truncate font-medium text-ink hover:text-brand-text">
                {name}
              </Link>
              {sub && <p className="truncate text-sm text-muted">{sub}</p>}
            </div>
            <Button variant="ghost" size="iconSm" aria-label={t("common.remove")} onClick={() => toggle(b.kind, b.ref)}>
              <Trash2 />
            </Button>
          </Card>
        );
      })}
    </div>
  );

  return (
    <>
      <PageHeader title={t("dash.saved.title")} description={t("dash.saved.subtitle")} />
      <Tabs defaultValue="professors">
        <TabsList>
          <TabsTrigger value="professors">
            <Bookmark /> {t("dash.saved.professors")} ({professors.length})
          </TabsTrigger>
          <TabsTrigger value="positions">
            <GraduationCap /> {t("dash.saved.positions")} ({positions.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="professors">
          {professors.length === 0 ? (
            <EmptyState icon={<Bookmark />} title={t("dash.saved.emptyProfessors")}>
              {t("dash.saved.emptyProfessorsBody")}
            </EmptyState>
          ) : (
            rows(professors, "/professors")
          )}
        </TabsContent>
        <TabsContent value="positions">
          {positions.length === 0 ? (
            <EmptyState icon={<GraduationCap />} title={t("dash.saved.emptyPositions")}>
              {t("dash.saved.emptyPositionsBody")}
            </EmptyState>
          ) : (
            rows(positions, "/positions")
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
