import { cn } from "@/lib/cn";

/** Tiny dependency-free bar chart: publications per year. */
export function ActivityChart({ data, className }: { data: { year: number; works: number }[]; className?: string }) {
  const max = Math.max(1, ...data.map((d) => d.works));
  return (
    <div className={cn("flex h-28 gap-1.5", className)} dir="ltr" role="img" aria-label={data.map((d) => `${d.year}: ${d.works}`).join(", ")}>
      {data.map((d, i) => (
        <div key={d.year} className="group flex flex-1 flex-col items-center gap-1.5" title={`${d.year}: ${d.works}`}>
          <div className="flex w-full flex-1 items-end">
            <div
              className={cn("w-full rounded-t-md transition-colors", i === data.length - 1 ? "bg-brand" : "bg-brand/35 group-hover:bg-brand/60")}
              style={{ height: `${Math.max(4, (d.works / max) * 100)}%` }}
            />
          </div>
          <span className="text-[0.625rem] text-faint tabular-nums">{String(d.year).slice(2)}</span>
        </div>
      ))}
    </div>
  );
}
