"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./api";
import { useI18n } from "./i18n/provider";
import type { MessageKey } from "./i18n/core";

interface Result<T> {
  key: string;
  data?: T;
  error?: unknown;
}

/**
 * Fetch when `key` changes (pass `null` to skip). Keeps the previous data while refetching, so lists don't flash empty.
 * `reload()` refetches with the same key; `setData()` patches the cache for optimistic updates.
 */
export function useApi<T>(key: string | null, fn: (signal: AbortSignal) => Promise<T>) {
  const [res, setRes] = useState<Result<T> | null>(null);
  const [tick, setTick] = useState(0);
  const fullKey = key === null ? null : `${key}#${tick}`;
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (fullKey === null) return;
    const ctrl = new AbortController();
    fnRef
      .current(ctrl.signal)
      .then((data) => setRes({ key: fullKey, data }))
      .catch((error: unknown) => {
        if ((error as Error)?.name === "AbortError") return;
        setRes({ key: fullKey, error });
      });
    return () => ctrl.abort();
  }, [fullKey]);

  const setData = useCallback((updater: (prev: T | undefined) => T | undefined) => {
    setRes((r) => (r ? { ...r, data: updater(r.data) } : r));
  }, []);

  return {
    data: res?.data,
    error: res?.key === fullKey ? res?.error : undefined,
    loading: fullKey !== null && res?.key !== fullKey,
    reload: useCallback(() => setTick((t) => t + 1), []),
    setData,
  };
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Turn any thrown value into a sentence in the visitor's language. */
export function useErrorText() {
  const { t, has } = useI18n();
  return useCallback(
    (e: unknown): string => {
      if (e instanceof ApiError) {
        if (has(`errors.${e.code}`)) return t(`errors.${e.code}` as MessageKey, e.extra as Record<string, string | number>);
        if (e.status === 0) return t("errors.network");
        if (e.code === "validation" && e.message) return e.message;
      }
      return t("errors.unknown");
    },
    [t, has],
  );
}
