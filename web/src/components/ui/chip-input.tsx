"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { fieldClass } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/provider";

/** Type, press Enter (or comma) to add; click × to remove. */
export function ChipInput({
  value,
  onChange,
  placeholder,
  max = 12,
  id,
  dir,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  max?: number;
  id?: string;
  dir?: "ltr" | "rtl" | "auto";
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const items = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
    if (items.length) onChange([...value, ...items].slice(0, max));
    setDraft("");
  };
  return (
    <div className={cn(fieldClass, "flex min-h-11 flex-wrap items-center gap-1.5 px-2.5 py-2 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15")}>
      {value.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-lg bg-brand-soft py-1 ps-2.5 pe-1.5 text-sm text-brand-text pointer-coarse:py-1.5">
          {v}
          <button
            type="button"
            aria-label={`${t("common.remove")}: ${v}`}
            onClick={() => onChange(value.filter((x) => x !== v))}
            // The visible circle stays small; on touch screens an invisible ::after widens the tap area to ~40px.
            className="relative grid size-4 place-items-center rounded-full hover:bg-brand/15 pointer-coarse:size-5 pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        dir={dir}
        value={draft}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft && add(draft)}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="min-w-24 flex-1 bg-transparent py-0.5 text-[0.9375rem] text-ink outline-none placeholder:text-faint"
      />
    </div>
  );
}
