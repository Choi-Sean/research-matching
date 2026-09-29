"use client";

import { ChevronDown } from "lucide-react";
import { Slider as SliderPrimitive, Switch as SwitchPrimitive } from "radix-ui";
import {
  cloneElement,
  isValidElement,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/provider";

export const fieldClass =
  "w-full rounded-xl border border-line-2 bg-surface px-3.5 text-[0.9375rem] text-ink shadow-xs " +
  "placeholder:text-faint transition-[border-color,box-shadow] duration-150 " +
  "hover:border-faint/60 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-bad";

// ComponentProps (unlike InputHTMLAttributes) includes `ref`, which React 19 passes to function components as a plain prop.
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldClass, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-28 py-3 leading-relaxed", className)} {...props} />;
}

export function NativeSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(fieldClass, "h-11 appearance-none pe-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
    </div>
  );
}

interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export function Field({
  label,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: string;
  className?: string;
  /** A single form control (it receives id / aria props automatically), or a render function. */
  children: ReactElement | ((props: FieldControlProps) => ReactNode);
}) {
  const id = useId();
  const describedBy = hint || error ? `${id}-desc` : undefined;
  const controlProps: FieldControlProps = { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined };
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-medium text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-faint">{optional}</span>}
      </label>
      {typeof children === "function"
        ? children(controlProps)
        : isValidElement(children)
          ? cloneElement(children as ReactElement<FieldControlProps>, controlProps)
          : children}
      {(hint || error) && (
        <p id={describedBy} className={cn("text-xs leading-relaxed", error ? "text-bad-text" : "text-faint")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}) {
  const auto = useId();
  const sid = id ?? auto;
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={sid} className="cursor-pointer">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-sm leading-relaxed text-muted">{description}</span>}
      </label>
      <SwitchPrimitive.Root
        id={sid}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full bg-surface-3 transition-colors data-[state=checked]:bg-brand pointer-coarse:after:absolute pointer-coarse:after:-inset-y-2.5 pointer-coarse:after:inset-x-0"
      >
        <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-200 data-[state=checked]:translate-x-[1.375rem] rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-[1.375rem]" />
      </SwitchPrimitive.Root>
    </div>
  );
}

/** A 1–5 dial with labelled ends — used for working-style preferences. */
export function Dial({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
}) {
  const { t } = useI18n();
  const id = useId();
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t("common.clear")}
            className="-my-1.5 -me-2 grid size-8 place-items-center rounded-lg text-base leading-none text-faint transition-colors hover:bg-surface-2 hover:text-ink pointer-coarse:-my-3 pointer-coarse:size-11"
          >
            ×
          </button>
        ) : null}
      </div>
      <SliderPrimitive.Root
        min={1}
        max={5}
        step={1}
        value={[value ?? 3]}
        onValueChange={([v]) => onChange(v)}
        className="relative flex h-5 w-full touch-none items-center select-none"
      >
        <SliderPrimitive.Track className="relative h-1.5 grow rounded-full bg-surface-3">
          <SliderPrimitive.Range className={cn("absolute h-full rounded-full", value ? "bg-brand" : "bg-transparent")} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          id={id}
          aria-label={label}
          className={cn(
            "block size-5 rounded-full border-2 bg-surface shadow-md outline-none transition-colors focus-visible:ring-4 focus-visible:ring-brand/20",
            value ? "border-brand" : "border-line-2",
          )}
        />
      </SliderPrimitive.Root>
      <div className="flex justify-between gap-3 text-xs text-faint">
        <span>{low}</span>
        <span className="text-end">{high}</span>
      </div>
    </div>
  );
}
