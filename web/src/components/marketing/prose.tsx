import { Lightbulb } from "lucide-react";
import type { Block } from "@/content/blog";

/** Renders a structured article body with the editorial prose styles. */
export function Prose({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-labora" lang="en" dir="ltr">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h2":
            return <h2 key={i}>{b.text}</h2>;
          case "p":
            return <p key={i}>{b.text}</p>;
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {b.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            );
          case "quote":
            return <blockquote key={i}>{b.text}</blockquote>;
          case "callout":
            return (
              <div key={i} className="not-prose flex gap-3 rounded-2xl border border-accent/30 bg-accent-soft/60 p-5 text-[0.9375rem] leading-relaxed text-ink/90">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-accent-text" />
                <p>{b.text}</p>
              </div>
            );
        }
      })}
    </div>
  );
}
