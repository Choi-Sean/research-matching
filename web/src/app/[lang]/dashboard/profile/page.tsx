"use client";

import { Eye } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { WorkStyleEditor } from "@/components/dashboard/work-style-editor";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Switch, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/layout";
import { Alert, Card, Chip, Progress, Skeleton } from "@/components/ui/surface";
import { api, type StudentProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi, useErrorText } from "@/lib/hooks";
import type { MessageKey } from "@/lib/i18n/core";
import { useI18n } from "@/lib/i18n/provider";
import { kw } from "@/lib/labels";

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Master's", "PhD"];

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileInner />
    </Suspense>
  );
}

function ProfileInner() {
  const { t } = useI18n();
  const { user } = useAuth();
  const welcome = useSearchParams().get("welcome");
  const profile = useApi(user?.role === "student" ? "student-profile" : null, () => api.studentProfile());
  const strength = useApi(user?.role === "student" ? "profile-strength" : null, () => api.profileStrength());
  if (user && user.role !== "student") return <p className="text-muted">{t("errors.student_only")}</p>;
  return (
    <>
      <PageHeader title={t("dash.profile.title")} description={t("dash.profile.subtitle")} />
      {welcome && <Alert tone="info" className="mb-6">{t("dash.profile.welcome")}</Alert>}
      {profile.data ? <ProfileForm initial={profile.data} score={strength.data?.score ?? 0} onSaved={strength.reload} /> : <Skeleton className="h-[40rem]" />}
    </>
  );
}

type Form = {
  university: string;
  major: string;
  year: string;
  bio: string;
  skills: string;
  interests: string;
  experience: string;
  resume_url: string;
  website_url: string;
  github_url: string;
  availability_hours: string;
  work_style: StudentProfile["work_style"];
  discoverable: boolean;
};

function ProfileForm({ initial, score, onSaved }: { initial: StudentProfile; score: number; onSaved: () => void }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const [f, setF] = useState<Form>({
    university: initial.university ?? "",
    major: initial.major ?? "",
    year: initial.year ?? "",
    bio: initial.bio ?? "",
    skills: initial.skills ?? "",
    interests: initial.interests ?? "",
    experience: initial.experience ?? "",
    resume_url: initial.resume_url ?? "",
    website_url: initial.website_url ?? "",
    github_url: initial.github_url ?? "",
    availability_hours: initial.availability_hours?.toString() ?? "",
    work_style: initial.work_style ?? null,
    discoverable: initial.discoverable,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const text = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const n = (s: string) => s.trim() || null;
    try {
      await api.updateStudentProfile({
        university: n(f.university),
        major: n(f.major),
        year: n(f.year),
        bio: n(f.bio),
        skills: n(f.skills),
        interests: n(f.interests),
        experience: n(f.experience),
        resume_url: n(f.resume_url),
        website_url: n(f.website_url),
        github_url: n(f.github_url),
        availability_hours: f.availability_hours ? Number(f.availability_hours) : null,
        work_style: f.work_style,
        discoverable: f.discoverable,
      });
      toast.success(t("dash.profile.saved"));
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <Card className="p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ink">{t("dash.profile.strength")}</span>
          <span className="tabular-nums text-muted">{score}%</span>
        </div>
        <Progress value={score} className="mt-2.5" />
      </Card>

      <Card className="p-6">
        <h2 className="mb-5 text-base font-semibold text-ink">{t("dash.profile.basics")}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("dash.profile.university")}>
            <Input value={f.university} onChange={text("university")} />
          </Field>
          <Field label={t("dash.profile.major")}>
            <Input value={f.major} onChange={text("major")} />
          </Field>
          <Field label={t("dash.profile.year")}>
            <NativeSelect value={f.year} onChange={text("year")}>
              <option value="">{t("dash.profile.selectYear")}</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {t(`enums.year.${y.toLowerCase().replace(/[^a-z]/g, "")}` as MessageKey)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("dash.profile.availability")}>
            <Input type="number" min={1} max={60} value={f.availability_hours} onChange={text("availability_hours")} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-5 p-6">
        <h2 className="text-base font-semibold text-ink">{t("dash.profile.about")}</h2>
        <Field label={t("dash.profile.bio")} hint={t("dash.profile.bioHint")}>
          <Textarea value={f.bio} onChange={text("bio")} />
        </Field>
        <Field label={t("dash.profile.skills")} hint={t("dash.profile.skillsHint")}>
          <Input value={f.skills} onChange={text("skills")} />
        </Field>
        {kw(f.skills).length > 0 && <div className="-mt-2 flex flex-wrap gap-1.5">{kw(f.skills).map((s) => <Chip key={s}>{s}</Chip>)}</div>}
        <Field label={t("dash.profile.interests")} hint={t("dash.profile.interestsHint")}>
          <Textarea value={f.interests} onChange={text("interests")} className="min-h-24" />
        </Field>
        <Field label={t("dash.profile.experience")} hint={t("dash.profile.experienceHint")}>
          <Textarea value={f.experience} onChange={text("experience")} className="min-h-32" />
        </Field>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-ink">{t("dash.profile.workStyle")}</h2>
        <p className="mt-1 mb-6 text-sm text-muted">{t("dash.profile.workStyleHint")}</p>
        <WorkStyleEditor value={f.work_style} onChange={(v) => set("work_style", v)} />
      </Card>

      <Card className="space-y-5 p-6">
        <h2 className="text-base font-semibold text-ink">{t("dash.profile.links")}</h2>
        <Field label={t("dash.profile.resume")} hint={t("dash.profile.resumeHint")}>
          <Input type="url" value={f.resume_url} onChange={text("resume_url")} placeholder="https://" dir="ltr" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("dash.profile.website")}>
            <Input type="url" value={f.website_url} onChange={text("website_url")} placeholder="https://" dir="ltr" />
          </Field>
          <Field label={t("dash.profile.github")}>
            <Input type="url" value={f.github_url} onChange={text("github_url")} placeholder="https://github.com/…" dir="ltr" />
          </Field>
        </div>
      </Card>

      <Card id="visibility" className="scroll-mt-28 border-brand/25 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink">
          <Eye className="size-4 text-brand-text" /> {t("dash.profile.visibility")}
        </h2>
        <Switch checked={f.discoverable} onCheckedChange={(v) => set("discoverable", v)} label={t("dash.profile.discoverable")} description={t("dash.profile.discoverableDesc")} />
      </Card>

      {error && <Alert>{error}</Alert>}
      <Button type="submit" size="lg" loading={busy}>
        {t("dash.profile.save")}
      </Button>
    </form>
  );
}
