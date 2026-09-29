"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { Slot } from "radix-ui";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Text sizes use min-height so a long label (German, Russian …) can wrap on a phone instead of running off the screen;
// on touch screens every size grows to a comfortable 44px target.
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium select-none max-sm:text-center max-sm:whitespace-normal sm:whitespace-nowrap",
    "transition-[background-color,color,box-shadow,transform,border-color] duration-200 ease-out",
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-ink text-canvas shadow-sm hover:bg-ink/88",
        brand: "bg-brand text-brand-fg shadow-[0_10px_28px_-12px_var(--brand)] hover:bg-brand-2",
        secondary: "border border-line-2 bg-surface text-ink shadow-sm hover:bg-surface-2",
        soft: "bg-brand-soft text-brand-text hover:bg-brand-soft/60",
        ghost: "text-muted hover:bg-surface-2 hover:text-ink",
        danger: "bg-bad-soft text-bad-text hover:bg-bad-soft/70",
        link: "h-auto rounded-md p-0 text-brand-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "min-h-9 px-3.5 py-1.5 text-sm pointer-coarse:min-h-11",
        md: "min-h-11 px-5 py-2.5 text-sm",
        lg: "min-h-[3.25rem] px-7 py-3 text-base",
        icon: "size-10 shrink-0 pointer-coarse:size-11",
        iconSm: "size-8 shrink-0 rounded-lg pointer-coarse:size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({ className, variant, size, asChild, loading, disabled, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}
