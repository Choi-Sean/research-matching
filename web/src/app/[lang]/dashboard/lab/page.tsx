"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WorkStyleEditor } from "@/components/dashboard/work-style-editor";
import { MaterialItem } from "@/components/position/materials";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/layout";
import { Alert, Card, Skeleton } from "@/components/ui/surface";
import { api, type Lab, type MaterialKind } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi, useErrorText } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n/provider";

export default function LabPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const lab = useApi(user?.role === "professor" ? "my-lab" : null, async () => {
    try {
      return await api.myLab();
    } catch {
      return null;
    }
  });

  if (user && user.role !== "professor") return <p className="text-muted">{t("errors.professor_only")}</p>;
  return (
    <>
      <PageHeader title={t("dash.lab.title")} description={t("dash.lab.subtitle")} />
      {user && !user.verified && (
        <Alert tone="warning" title={t("dash.lab.verificationTitle")} className="mb-6">
          {t("dash.lab.verificationBody")}
        </Alert>
      )}
      {lab.data === undefined ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="max-w-3xl space-y-8">
          <LabForm key={lab.data?.id ?? "new"} lab={lab.data} onSaved={lab.reload} />
          {lab.data && <Materials labId={lab.data.id} />}
        </div>
      )}
    </>
  );
}

function LabForm({ lab, onSaved }: { lab: Lab | null; onSaved: () => void }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const [f, setF] = useState({
    name: lab?.name ?? "",
    university: lab?.university ?? "",
    department: lab?.department ?? "",
    website: lab?.website ?? "",
    bio: lab?.bio ?? "",
    keywords: lab?.keywords ?? "",
    culture: lab?.culture ?? "",
    team_size: lab?.team_size?.toString() ?? "",
    openalex_author_id: lab?.openalex_author_id ?? "",
    work_style: lab?.work_style ?? null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const n = (s: string) => s.trim() || null;
    const body = {
      name: f.name.trim(),
      university: f.university.trim(),
      department: f.department.trim(),
      website: n(f.website),
      bio: n(f.bio),
      keywords: n(f.keywords),
      culture: n(f.culture),
      team_size: f.team_size ? Number(f.team_size) : null,
      openalex_author_id: n(f.openalex_author_id),
      work_style: f.work_style,
    };
    try {
      if (lab) await api.updateLab(body);
      else await api.createLab(body);
      toast.success(lab ? t("dash.lab.updated") : t("dash.lab.created"));
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="space-y-5 p-6">
        <h2 className="text-base font-semibold text-ink">{lab ? t("dash.lab.profileTitle") : t("dash.lab.createTitle")}</h2>
        <Field label={t("dash.lab.name")}>
          <Input required value={f.name} onChange={set("name")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("dash.lab.university")}>
            <Input required value={f.university} onChange={set("university")} />
          </Field>
          <Field label={t("dash.lab.department")}>
            <Input required value={f.department} onChange={set("department")} />
          </Field>
        </div>
        <Field label={t("dash.lab.description")} hint={t("dash.lab.descriptionHint")}>
          <Textarea value={f.bio} onChange={set("bio")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("dash.lab.keywords")} hint={t("dash.lab.keywordsHint")}>
            <Input value={f.keywords} onChange={set("keywords")} />
          </Field>
          <Field label={t("dash.lab.website")}>
            <Input type="url" value={f.website} onChange={set("website")} placeholder="https://" dir="ltr" />
          </Field>
        </div>
        <Field label={t("dash.lab.culture")} hint={t("dash.lab.cultureHint")}>
          <Textarea value={f.culture} onChange={set("culture")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("dash.lab.teamSize")}>
            <Input type="number" min={1} max={500} value={f.team_size} onChange={set("team_size")} />
          </Field>
          <Field label={t("dash.lab.openalex")} hint={t("dash.lab.openalexHint")}>
            <Input value={f.openalex_author_id} onChange={set("openalex_author_id")} placeholder="A5081808595" dir="ltr" />
          </Field>
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-base font-semibold text-ink">{t("dash.lab.workStyle")}</h2>
        <p className="mt-1 mb-6 text-sm text-muted">{t("dash.lab.workStyleHint")}</p>
        <WorkStyleEditor value={f.work_style} onChange={(v) => setF((s) => ({ ...s, work_style: v }))} />
      </Card>
      {error && <Alert>{error}</Alert>}
      <Button type="submit" size="lg" loading={busy}>
        {lab ? t("dash.lab.saveLab") : t("dash.lab.createLab")}
      </Button>
    </form>
  );
}

function Materials({ labId }: { labId: number }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const list = useApi(`lab-materials-${labId}`, () => api.labMaterials(labId));
  const [f, setF] = useState({ title: "", description: "", kind: "paper" as MaterialKind, url: "" });
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.addMaterial({ ...f, description: f.description.trim() || null });
      setF({ title: "", description: "", kind: "paper", url: "" });
      list.reload();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: number) => {
    if (!confirm(t("dash.lab.removeMaterial"))) return;
    try {
      await api.deleteMaterial(id);
      list.reload();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-ink">{t("dash.lab.materials")}</h2>
      <p className="mt-1 mb-5 text-sm text-muted">{t("dash.lab.materialsHint")}</p>
      <div className="mb-6 space-y-3">
        {list.data?.length === 0 && <p className="text-sm text-muted">{t("dash.lab.nothingShared")}</p>}
        {list.data?.map((m) => (
          <MaterialItem
            key={m.id}
            m={m}
            action={
              <Button variant="ghost" size="iconSm" onClick={() => remove(m.id)} aria-label={t("common.remove")}>
                <Trash2 className="text-bad" />
              </Button>
            }
          />
        ))}
      </div>
      <form onSubmit={add} className="space-y-4 rounded-2xl bg-surface-2/70 p-5">
        <p className="text-sm font-medium text-ink">{t("dash.lab.addMaterial")}</p>
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <Field label={t("dash.lab.materialTitle")}>
            <Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </Field>
          <Field label={t("dash.lab.materialType")}>
            <NativeSelect value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as MaterialKind })}>
              {(["paper", "dataset", "poster", "other"] as const).map((k) => (
                <option key={k} value={k}>
                  {t(`enums.materialKind.${k}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field label={t("dash.lab.materialLink")} hint={t("dash.lab.materialLinkHint")}>
          <Input type="url" required value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://" dir="ltr" />
        </Field>
        <Field label={t("dash.lab.materialDescription")} optional={t("common.optional")}>
          <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <Button type="submit" variant="secondary" loading={busy}>
          <Plus /> {t("dash.lab.addMaterial")}
        </Button>
      </form>
    </Card>
  );
}
