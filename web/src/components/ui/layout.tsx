import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-5 sm:px-8", className)}>{children}</div>;
}

export function Section({
  className,
  children,
  id,
  tone = "canvas",
}: {
  className?: string;
  children: ReactNode;
  id?: string;
  tone?: "canvas" | "subtle";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-24 py-20 sm:py-28",
        tone === "subtle" && "border-y border-line bg-surface-2/60",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-start", className)}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="display text-[clamp(2rem,4.4vw,3.25rem)] text-ink">{title}</h2>
      {description && <p className="mt-5 text-lg leading-relaxed text-muted text-pretty">{description}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="display text-[clamp(1.85rem,3.6vw,2.6rem)] text-ink">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted text-pretty">{description}</p>}
      </div>
      {action}
    </div>
  );
}
