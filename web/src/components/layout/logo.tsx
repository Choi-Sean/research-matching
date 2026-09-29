import { cn } from "@/lib/cn";

export const BRAND = "Labora";

/** Two overlapping circles — a student and a lab — and the match where they meet. */
export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <defs>
        <clipPath id="labora-lens">
          <circle cx="12" cy="16" r="9" />
        </clipPath>
      </defs>
      <circle cx="12" cy="16" r="9" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="20" cy="16" r="9" stroke="var(--brand)" strokeWidth="2.4" />
      <circle cx="20" cy="16" r="9" fill="var(--brand)" clipPath="url(#labora-lens)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-[family-name:var(--font-display)] text-[1.35rem] leading-none font-semibold tracking-[-0.02em]", className)}>
      {BRAND}
    </span>
  );
}
