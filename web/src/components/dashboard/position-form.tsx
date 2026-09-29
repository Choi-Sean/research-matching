"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/form";
import { Alert, Card } from "@/components/ui/surface";
import { api, type Compensation, type LocationType, type Position, type Term } from "@/lib/api";
import { useErrorText } from "@/lib/hooks";
import { useLocaleRouter } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { useLabels } from "@/lib/labels";

export function PositionForm({ position }: { position?: Position }) {
  const { t } = useI18n();
  const labels = useLabels();
  const errorText = useErrorText();
  const router = useLocaleRouter();
  const [f, setF] = useState({
    title: position?.title ?? "",
    description: position?.description ?? "",
    requirements: position?.requirements ?? "",
    required_skills: position?.required_skills ?? "",
    keywords: position?.keywords ?? "",
    compensation: (position?.compensation ?? "paid") as Compensation,
    hours_per_week: position?.hours_per_week?.toString() ?? "",
    term: (position?.term ?? "") as Term | "",
    location_type: (position?.location_type ?? "") as LocationType | "",
    slots: position?.slots?.toString() ?? "",
    deadline: position?.deadline ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const n = (s: string) => s.trim() || null;
    const body = {
      title: f.title.trim(),
      description: f.description.trim(),
      requirements: n(f.requirements),
      required_skills: n(f.required_skills),
      keywords: n(f.keywords),
      compensation: f.compensation,
      hours_per_week: f.hours_per_week ? Number(f.hours_per_week) : null,
      term: f.term || null,
      location_type: f.location_type || null,
      slots: f.slots ? Number(f.slots) : null,
      deadline: f.deadline || null,
    };
    try {
      const saved = position ? await api.updatePosition(position.id, body) : await api.createPosition(body);
      toast.success(t("dash.positions.form.saved"));
      router.push(`/dashboard/positions/${saved.id}`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <Card className="max-w-3xl p-6">
      <form onSubmit={submit} className="space-y-5">
        <Field label={t("dash.positions.form.title")}>
          <Input required value={f.title} onChange={set("title")} placeholder={t("dash.positions.form.titlePlaceholder")} />
        </Field>
        <Field label={t("dash.positions.form.description")} hint={t("dash.positions.form.descriptionHint")}>
          <Textarea required value={f.description} onChange={set("description")} className="min-h-40" />
        </Field>
        <Field label={t("dash.positions.form.requirements")} hint={t("dash.positions.form.requirementsHint")}>
          <Textarea value={f.requirements} onChange={set("requirements")} className="min-h-24" />
        </Field>
        <Field label={t("dash.positions.form.skills")} hint={t("dash.positions.form.skillsHint")}>
          <Input value={f.required_skills} onChange={set("required_skills")} placeholder="python, pytorch, linear algebra" dir="ltr" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={t("dash.positions.form.compensation")}>
            <NativeSelect value={f.compensation} onChange={set("compensation")}>
              {(["paid", "credit", "volunteer"] as const).map((k) => (
                <option key={k} value={k}>
                  {labels.compensation(k)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("dash.positions.form.hours")}>
            <Input type="number" min={1} max={60} value={f.hours_per_week} onChange={set("hours_per_week")} />
          </Field>
          <Field label={t("dash.positions.form.slots")}>
            <Input type="number" min={1} max={50} value={f.slots} onChange={set("slots")} />
          </Field>
          <Field label={t("dash.positions.form.term")}>
            <NativeSelect value={f.term} onChange={set("term")}>
              <option value="">{t("dash.positions.form.notSpecified")}</option>
              {(["fall", "spring", "summer", "year_round", "flexible"] as const).map((k) => (
                <option key={k} value={k}>
                  {labels.term(k)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("dash.positions.form.location")}>
            <NativeSelect value={f.location_type} onChange={set("location_type")}>
              <option value="">{t("dash.positions.form.notSpecified")}</option>
              {(["on_site", "remote", "hybrid"] as const).map((k) => (
                <option key={k} value={k}>
                  {labels.location(k)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("dash.positions.form.deadline")}>
            <Input type="date" value={f.deadline} onChange={set("deadline")} />
          </Field>
        </div>
        <Field label={t("dash.positions.form.keywords")} hint={t("dash.positions.form.keywordsHint")}>
          <Input value={f.keywords} onChange={set("keywords")} placeholder="computer vision, robotics" />
        </Field>
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" size="lg" loading={busy}>
            {position ? t("dash.positions.form.saveChanges") : t("dash.positions.form.publish")}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
