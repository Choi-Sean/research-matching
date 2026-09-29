"use client";

import { Building2, Check, Loader2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { fieldClass } from "@/components/ui/form";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/overlay";
import { api, type Institution } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useApi, useDebounced } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n/provider";

/** Autocomplete over 140,000 institutions (OpenAlex). Free text is also accepted — the API resolves it. */
export function InstitutionCombobox({
  value,
  onChange,
  onPick,
  placeholder,
  id,
  className,
}: {
  value: string;
  onChange: (text: string) => void;
  onPick: (inst: Institution | null) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}) {
  const { t, fmt } = useI18n();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState(false);
  const debounced = useDebounced(value, 250);
  const q = debounced.trim();
  const inputRef = useRef<HTMLInputElement>(null);
  const idle = picked || q.length < 2;
  const search = useApi(idle ? null : `institutions-${q}`, (signal) => api.institutions(q, signal));
  const items: Institution[] = idle ? [] : (search.data ?? []);
  const loading = !idle && search.loading;

  const choose = (inst: Institution) => {
    setPicked(true);
    onChange(inst.name);
    onPick(inst);
    setOpen(false);
  };

  const showList = open && !picked && (items.length > 0 || loading);

  return (
    <Popover open={showList} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn("relative", className)}>
          <Building2 className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            value={value}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setPicked(false);
              setActive(0);
              onPick(null);
              onChange(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (!showList) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && items[active]) {
                e.preventDefault();
                choose(items[active]);
              } else if (e.key === "Escape") setOpen(false);
            }}
            className={cn(fieldClass, "h-11 ps-10", value && "pe-9 pointer-coarse:pe-12")}
          />
          {loading ? (
            <Loader2 className="absolute end-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-faint" aria-hidden />
          ) : (
            value && (
              <button
                type="button"
                aria-label={t("common.clear")}
                onClick={() => {
                  setPicked(false);
                  onChange("");
                  onPick(null);
                  inputRef.current?.focus();
                }}
                className="absolute end-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-faint hover:bg-surface-2 hover:text-ink pointer-coarse:size-9"
              >
                <X className="size-3.5" />
              </button>
            )
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[var(--radix-popover-trigger-width)] min-w-64 p-1.5"
      >
        <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto">
          {loading && items.length === 0 && <li className="px-3 py-2.5 text-sm text-faint">{t("discover.lookingUp")}</li>}
          {items.map((inst, i) => (
            <li
              key={inst.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(inst);
              }}
              className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5", i === active && "bg-surface-2")}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{inst.name}</p>
                <p className="truncate text-xs text-faint">
                  {[fmt.country(inst.country), inst.works_count ? `${fmt.compact(inst.works_count)} ${t("discover.papers")}` : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {inst.name === value && <Check className="size-4 text-brand-text" />}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
