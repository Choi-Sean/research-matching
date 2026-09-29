"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api, type Bookmark } from "./api";
import { useAuth } from "./auth";
import { useErrorText } from "./hooks";
import { useLocaleRouter } from "./i18n/navigation";
import { useI18n } from "./i18n/provider";

interface BookmarksValue {
  items: Bookmark[];
  loaded: boolean;
  has: (kind: Bookmark["kind"], ref: string) => boolean;
  toggle: (kind: Bookmark["kind"], ref: string, snapshot?: Record<string, unknown>) => Promise<void>;
}

const Ctx = createContext<BookmarksValue | null>(null);

/** One shared list of saved professors / positions, so every card can show its star without its own request. */
export function BookmarksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const errorText = useErrorText();
  const router = useLocaleRouter();
  // The list is tagged with the user it belongs to, so signing out (or switching accounts) empties it instantly.
  const [state, setState] = useState<{ uid: number | null; items: Bookmark[] }>({ uid: null, items: [] });
  const uid = user?.id ?? null;
  const items = useMemo(() => (state.uid === uid ? state.items : []), [state, uid]);
  const loaded = uid !== null && state.uid === uid;

  useEffect(() => {
    if (uid === null) return;
    let cancelled = false;
    api
      .bookmarks()
      .then((b) => !cancelled && setState({ uid, items: b }))
      .catch(() => !cancelled && setState({ uid, items: [] }));
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const has = useCallback((kind: Bookmark["kind"], ref: string) => items.some((b) => b.kind === kind && b.ref === ref), [items]);

  const toggle = useCallback<BookmarksValue["toggle"]>(
    async (kind, ref, snapshot) => {
      if (!user) {
        toast(t("discover.signInToSave"), { action: { label: t("nav.signIn"), onClick: () => router.push("/login") } });
        return;
      }
      const existing = items.find((b) => b.kind === kind && b.ref === ref);
      const patch = (fn: (prev: Bookmark[]) => Bookmark[]) => setState((s) => ({ uid: user.id, items: fn(s.uid === user.id ? s.items : []) }));
      try {
        if (existing) {
          patch((prev) => prev.filter((b) => b !== existing)); // optimistic
          await api.removeBookmark(kind, ref);
          toast(t("discover.removedToast"));
        } else {
          const created = await api.addBookmark({ kind, ref, snapshot });
          patch((prev) => [created, ...prev]);
          toast.success(t("discover.savedToast"));
        }
      } catch (e) {
        if (existing) patch((prev) => [existing, ...prev]);
        toast.error(errorText(e));
      }
    },
    [items, user, t, router, errorText],
  );

  const value = useMemo(() => ({ items, loaded, has, toggle }), [items, loaded, has, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBookmarks(): BookmarksValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBookmarks must be used inside <BookmarksProvider>");
  return ctx;
}
