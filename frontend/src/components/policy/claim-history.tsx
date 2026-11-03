import { CalendarDays, Info } from "lucide-react";

import { ClaimStatusBadge, EmptyState } from "@/components/ui/feedback";
import { DISRUPTION_META } from "@/lib/disruptions";
import { cn, formatDate, formatINR } from "@/lib/format";
import type { ClaimRecord } from "@/lib/storage";

export function ClaimHistory({ claims }: { claims: ClaimRecord[] }) {
  return (
    <div className="card-surface p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Claim history</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {claims.length === 0
              ? "No claims yet"
              : `${claims.length} ${claims.length === 1 ? "claim" : "claims"}`}
          </h2>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-[0.65rem] font-semibold text-muted">
          This browser
        </span>
      </div>

      {claims.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={CalendarDays}
            title="Nothing filed yet"
            description="When a disruption costs you working hours, file a claim and track its review status here."
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {claims.map((claim) => {
            const meta = DISRUPTION_META[claim.disruption];
            const Icon = meta.icon;

            return (
              <li
                key={claim.id}
                className="rounded-2xl border border-ink/10 bg-cream/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl",
                        meta.tone,
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {claim.disruption} disruption
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(claim.incidentDate)} · {claim.hoursLost}{" "}
                        hours lost
                      </p>
                    </div>
                  </div>
                  <ClaimStatusBadge status={claim.status} />
                </div>

                {claim.description ? (
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    {claim.description}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3 text-xs">
                  <span className="text-muted">Indicative payout</span>
                  <span className="font-semibold text-ink">
                    {formatINR(claim.payout, { decimals: 2 })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-cream/70 p-4 text-[0.68rem] leading-relaxed text-muted">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0 text-forest"
        />
        Claims filed here appear in the admin dashboard on this device. Approve
        or reject them there to complete the demo flow.
      </div>
    </div>
  );
}
