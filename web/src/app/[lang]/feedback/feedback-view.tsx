"use client";

import { ArrowBigUp, Bug, Lightbulb, MessageCircle, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/form";
import { Container, PageHeader } from "@/components/ui/layout";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/overlay";
import { Alert, Badge, Card, EmptyState, Skeleton } from "@/components/ui/surface";
import { api, type FeedbackPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useApi, useErrorText } from "@/lib/hooks";
import type { MessageKey } from "@/lib/i18n/core";
import { Link } from "@/lib/i18n/navigation";
import { useI18n } from "@/lib/i18n/provider";

const KIND_ICON = { feature: Lightbulb, bug: Bug, general: MessageCircle } as const;
const STATUS_TONE = { open: "neutral", planned: "brand", in_progress: "warn", done: "good" } as const;

export function FeedbackView() {
  const { t, tp, fmt } = useI18n();
  const { user } = useAuth();
  const errorText = useErrorText();
  const [sort, setSort] = useState<"votes" | "new">("votes");
  const [kind, setKind] = useState<"" | "feature" | "bug" | "general">("");
  const posts = useApi(`feedback-${sort}-${kind}`, () => api.feedback({ sort, kind: kind || undefined }));
  const [open, setOpen] = useState(false);

  const vote = async (p: FeedbackPost) => {
    if (!user) return toast(t("community.feedback.signIn"));
    try {
      const updated = await api.voteFeedback(p.id);
      posts.setData((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <PageHeader
        title={t("community.feedback.title")}
        description={t("community.feedback.subtitle")}
        action={
          user ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="brand">
                  <Plus /> {t("community.feedback.newPost")}
                </Button>
              </DialogTrigger>
              <DialogContent title={t("community.feedback.newPost")} closeLabel={t("common.close")}>
                <PostForm
                  onPosted={(p) => {
                    setOpen(false);
                    toast.success(t("community.feedback.posted"));
                    posts.setData((prev) => [p, ...(prev ?? [])]);
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Button asChild variant="secondary">
              <Link href="/login?next=/feedback">{t("community.feedback.signIn")}</Link>
            </Button>
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["", "feature", "bug", "general"] as const).map((k) => (
            <button
              key={k || "all"}
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors pointer-coarse:py-2.5",
                kind === k ? "border-brand bg-brand-soft text-brand-text" : "border-line text-muted hover:border-line-2 hover:text-ink",
              )}
            >
              {k ? t(`community.feedback.kind.${k}` as MessageKey) : t("community.feedback.filterAll")}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-xl border border-line bg-surface-2 p-1 text-sm">
          {(["votes", "new"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn("rounded-lg px-3 py-1.5 font-medium pointer-coarse:py-2.5", sort === s ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}
            >
              {s === "votes" ? t("community.feedback.sortVotes") : t("community.feedback.sortNew")}
            </button>
          ))}
        </div>
      </div>

      {posts.error != null && <Alert>{errorText(posts.error)}</Alert>}
      {!posts.data ? (
        <Skeleton className="h-64" />
      ) : posts.data.length === 0 ? (
        <EmptyState icon={<MessageCircle />} title={t("community.feedback.empty")} />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">{tp("community.feedback.count", posts.data.length)}</p>
          <div className="space-y-3">
            {posts.data.map((p) => {
              const Icon = KIND_ICON[p.kind];
              return (
                <Card key={p.id} className="flex gap-4 p-5">
                  <button
                    onClick={() => vote(p)}
                    aria-pressed={p.voted}
                    aria-label={p.voted ? t("community.feedback.voted") : t("community.feedback.vote")}
                    className={cn(
                      "flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border transition-colors",
                      p.voted ? "border-brand bg-brand-soft text-brand-text" : "border-line text-muted hover:border-line-2 hover:text-ink",
                    )}
                  >
                    <ArrowBigUp className={cn("size-6", p.voted && "fill-current")} />
                    <span className="text-sm font-semibold tabular-nums">{p.votes}</span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>
                        <Icon /> {t(`community.feedback.kind.${p.kind}` as MessageKey)}
                      </Badge>
                      <Badge tone={STATUS_TONE[p.status]}>{t(`community.feedback.status.${p.status}` as MessageKey)}</Badge>
                    </div>
                    <h3 className="mt-2 font-semibold text-ink" dir="auto">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted" dir="auto">
                      {p.body}
                    </p>
                    <p className="mt-2 text-xs text-faint">
                      {t("community.feedback.by", { name: p.author_name })} · {fmt.relative(p.created_at)}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </Container>
  );
}

function PostForm({ onPosted }: { onPosted: (p: FeedbackPost) => void }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const [kind, setKind] = useState<"feature" | "bug" | "general">("feature");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onPosted(await api.postFeedback({ kind, title: title.trim(), body: body.trim() }));
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t("community.feedback.kind.general")}>
        <NativeSelect value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          {(["feature", "bug", "general"] as const).map((k) => (
            <option key={k} value={k}>
              {t(`community.feedback.kind.${k}` as MessageKey)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label={t("community.feedback.postTitle")}>
        <Input required minLength={3} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("community.feedback.postTitlePlaceholder")} />
      </Field>
      <Field label={t("community.feedback.postBody")}>
        <Textarea required minLength={3} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("community.feedback.postBodyPlaceholder")} />
      </Field>
      {error && <Alert>{error}</Alert>}
      <Button type="submit" variant="brand" loading={busy} className="w-full">
        {t("community.feedback.post")}
      </Button>
    </form>
  );
}
