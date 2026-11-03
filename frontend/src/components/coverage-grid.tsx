import { Check } from "lucide-react";

import { DISRUPTIONS, DISRUPTION_META } from "@/lib/disruptions";
import { cn } from "@/lib/format";

export function CoverageGrid({
  variant = "card",
}: {
  variant?: "inline" | "card";
}) {
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      {DISRUPTIONS.map((item) => {
        const meta = DISRUPTION_META[item];
        const Icon = meta.icon;
        const inline = variant === "inline";

        return (
          <div
            key={item}
            className={cn(
              "rounded-2xl border border-ink/10 bg-cream/50 p-4",
              inline && "flex items-start gap-3",
            )}
          >
            <span
              className={cn(
                "grid size-10 place-items-center rounded-xl",
                meta.tone,
                inline && "shrink-0",
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className={inline ? undefined : "mt-3"}>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{item}</h3>
                {inline ? (
                  <span className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-forest">
                    Covered
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {meta.description}
              </p>
              {inline ? null : (
                <p className="mt-3 inline-flex items-center gap-1 text-[0.65rem] font-semibold text-forest">
                  <Check aria-hidden="true" className="size-3" />
                  Covered when a policy is active
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
