import {
  ArrowRight,
  Check,
  CircleCheck,
  ShieldCheck,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { formatINR, formatSignedINR } from "@/lib/format";
import type { PolicyRecord } from "@/lib/storage";
import type { PricingEstimate } from "@/lib/types";

export function EstimatePanel({
  result,
  policy,
  isStale,
  onActivate,
}: {
  result: PricingEstimate | null;
  policy: PolicyRecord | null;
  isStale: boolean;
  onActivate: () => void;
}) {
  if (!result) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-dashed border-forest/25 bg-forest-light/40 p-6 sm:p-7">
        <p className="eyebrow">Your estimate</p>
        <p className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
          ₹49–₹99
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Pick your zone and working days, then calculate to see the full
          premium breakdown, including risk, location and experience
          adjustments.
        </p>

        <ul className="mt-6 space-y-3 text-sm text-muted">
          {[
            "Base premium from weekly income",
            "Risk loading from your estimated score",
            "Location and experience adjustments",
            "Final premium clamped to ₹49–₹99",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-forest text-cream">
                <Check aria-hidden="true" className="size-2.5" />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-7 rounded-2xl border border-forest/15 bg-paper/70 p-4 text-xs leading-relaxed text-muted">
          Your last saved estimate for this worker will appear here when you
          return.
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-forest p-6 text-cream shadow-soft sm:p-7">
      <div className="bg-grid-lines pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-lime">
            Your weekly estimate
          </p>
          {policy ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-2.5 py-1 text-[0.65rem] font-semibold text-lime">
              <span className="status-dot" />
              Policy active
            </span>
          ) : (
            <span className="rounded-full bg-cream/10 px-2.5 py-1 text-[0.65rem] font-semibold text-cream/65">
              Estimate
            </span>
          )}
        </div>

        <div className="mt-6 flex items-end gap-2">
          <span className="text-6xl font-semibold tracking-[-0.055em]">
            {formatINR(result.final_weekly_premium, { decimals: 2 })}
          </span>
          <span className="pb-2 text-sm text-cream/50">/ week</span>
        </div>
        <p className="mt-1 text-sm text-cream/55">
          Protecting {formatINR(result.weekly_income)} of weekly income
        </p>

        <div className="mt-6">
          <div className="flex items-center justify-between text-[0.65rem] text-cream/45">
            <span>₹49</span>
            <span>₹99</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream/10">
            <div
              className="h-full rounded-full bg-lime transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    4,
                    ((Number(result.final_weekly_premium) - 49) / 50) * 100,
                  ),
                )}%`,
              }}
            />
          </div>
          <p className="mt-2 text-[0.68rem] text-cream/45">
            Final premium is clamped to the ₹49–₹99 weekly range.
          </p>
        </div>

        {isStale ? (
          <div className="mt-5 rounded-xl border border-heat/25 bg-heat/10 px-3.5 py-2.5 text-[0.7rem] text-cream/75">
            Inputs changed. Recalculate to refresh this estimate.
          </div>
        ) : null}

        <dl className="mt-6 divide-y divide-cream/10 border-t border-cream/10 text-sm">
          <BreakdownRow
            label="Weekly income"
            value={formatINR(result.weekly_income, { decimals: 2 })}
          />
          <BreakdownRow
            label="Base premium (2%)"
            value={formatINR(result.base_premium, { decimals: 2 })}
          />
          <BreakdownRow
            label="Risk loading"
            value={formatSignedINR(result.risk_loading)}
          />
          <BreakdownRow
            label="Subtotal"
            value={formatINR(result.subtotal, { decimals: 2 })}
          />
          <BreakdownRow
            label="Location adjustment"
            value={formatSignedINR(result.location_adjustment)}
          />
          <BreakdownRow
            label="Experience adjustment"
            value={formatSignedINR(result.experience_adjustment)}
          />
          <BreakdownRow
            label="Raw premium"
            value={formatINR(result.raw_premium, { decimals: 2 })}
          />
          <div className="flex items-center justify-between gap-3 py-3.5">
            <dt className="font-semibold text-cream">Final weekly premium</dt>
            <dd className="text-lg font-semibold text-lime">
              {formatINR(result.final_weekly_premium, { decimals: 2 })}
            </dd>
          </div>
        </dl>

        {policy ? (
          <ButtonLink
            href="/policy"
            variant="lime"
            size="lg"
            className="mt-5 w-full"
          >
            View my policy
            <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        ) : (
          <Button
            variant="lime"
            size="lg"
            onClick={onActivate}
            disabled={isStale}
            className="mt-5 w-full"
          >
            <ShieldCheck aria-hidden="true" className="size-4" />
            {isStale ? "Recalculate to activate" : "Activate this cover"}
          </Button>
        )}

        <p className="mt-4 flex items-start gap-2 text-[0.68rem] leading-relaxed text-cream/45">
          <CircleCheck
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-lime/70"
          />
          Estimate saved in this browser. Activating creates a prototype policy
          for this worker.
        </p>
      </div>
    </section>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <dt className="text-cream/55">{label}</dt>
      <dd className="font-medium text-cream/90">{value}</dd>
    </div>
  );
}
