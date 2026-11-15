import {
  ArrowLeft,
  BadgeInfo,
  Calculator,
  Info,
  Sparkles,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { formatINR, formatSignedINR } from "@/lib/format";
import type { PricingEstimate } from "@/lib/types";

const EXAMPLE = {
  base: 72,
  risk: 54,
  location: 12.6,
  experience: -10.08,
  raw: 128.52,
  final: 99,
};

export function EstimatePanel({
  result,
  isStale,
  dashboardHref,
}: {
  result: PricingEstimate | null;
  isStale: boolean;
  dashboardHref: string;
}) {
  const finalPremium = result
    ? Number(result.final_weekly_premium)
    : EXAMPLE.final;

  const rows = result
    ? [
        { label: "Base premium", value: formatINR(result.base_premium, { decimals: 2 }) },
        { label: "Risk loading", value: formatSignedINR(result.risk_loading) },
        {
          label: "Location adjustment",
          value: formatSignedINR(result.location_adjustment),
        },
        {
          label: "Experience adjustment",
          value: formatSignedINR(result.experience_adjustment),
        },
        { label: "Raw premium", value: formatINR(result.raw_premium, { decimals: 2 }) },
        {
          label: "Capped premium",
          value: formatINR(result.final_weekly_premium, { decimals: 2 }),
          emphasis: true,
        },
      ]
    : [
        { label: "Base premium", value: formatINR(EXAMPLE.base, { decimals: 2 }) },
        { label: "Risk loading", value: formatSignedINR(EXAMPLE.risk) },
        {
          label: "Location adjustment",
          value: formatSignedINR(EXAMPLE.location),
        },
        {
          label: "Experience adjustment",
          value: formatSignedINR(EXAMPLE.experience),
        },
        { label: "Raw premium", value: formatINR(EXAMPLE.raw, { decimals: 2 }) },
        {
          label: "Capped premium",
          value: formatINR(EXAMPLE.final, { decimals: 2 }),
          emphasis: true,
        },
      ];

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className="relative overflow-hidden bg-navy p-6 text-white sm:p-7">
        <div className="bg-grid-lines pointer-events-none absolute inset-0 opacity-40" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full border-[32px] border-teal/20"
        />

        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-teal-light">
              Your Premium Estimate
            </p>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-white/75">
              {result ? "Estimate" : "Example"}
            </span>
          </div>

          <div className="mt-6 flex items-end gap-2">
            <span className="text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
              {formatINR(finalPremium, { decimals: 2 })}
            </span>
            <span className="pb-2 text-sm text-white/60">/ week</span>
          </div>
          <p className="mt-1 text-sm text-white/55">
            {result
              ? `Estimated from ${formatINR(result.weekly_income)} of weekly income`
              : "Illustrative sample: high-risk zone, 6 working days"}
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between text-[0.65rem] text-white/60">
              <span>₹49</span>
              <span>₹99</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-teal-light transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(4, ((finalPremium - 49) / 50) * 100),
                  )}%`,
                }}
              />
            </div>
            <p className="mt-2 text-[0.68rem] text-white/60">
              The prototype caps every estimate between ₹49 and ₹99.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7">
        {isStale ? (
          <div className="mb-4 rounded-xl border border-warning/25 bg-warning/10 px-3.5 py-2.5 text-xs text-warning">
            Inputs changed. Calculate again to refresh this estimate.
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-navy">
            Premium breakdown
          </h2>
          <span className="inline-flex items-center gap-1 text-[0.65rem] text-muted">
            <Calculator aria-hidden="true" className="size-3" />
            {result ? "Your inputs" : "Illustrative figures"}
          </span>
        </div>

        <table className="mt-3 w-full text-sm">
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr
                key={row.label}
                className={row.emphasis ? "bg-teal-light/40" : undefined}
              >
                <th
                  scope="row"
                  className={`py-3 pr-3 text-left font-normal ${
                    row.emphasis
                      ? "pl-3 font-semibold text-navy"
                      : "text-muted"
                  }`}
                >
                  {row.label}
                </th>
                <td
                  className={`py-3 text-right font-medium ${
                    row.emphasis
                      ? "pr-3 text-base font-semibold text-teal-dark"
                      : "text-navy"
                  }`}
                >
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!result ? (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-mist px-3.5 py-2.5 text-xs leading-relaxed text-muted">
            <BadgeInfo
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0 text-teal"
            />
            These are illustrative figures. Choose your zone and working days,
            then calculate to replace them with your own estimate.
          </p>
        ) : null}

        <div className="mt-5 rounded-2xl border border-line bg-mist/70 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-navy">
            <Info aria-hidden="true" className="size-3.5 text-teal" />
            How each line is calculated
          </p>
          <ul className="mt-2.5 space-y-1.5 text-[0.7rem] leading-relaxed text-muted">
            <li>
              <strong className="text-navy">Base premium:</strong> calculated
              using weekly income.
            </li>
            <li>
              <strong className="text-navy">Risk loading:</strong> depends on
              the predicted risk score.
            </li>
            <li>
              <strong className="text-navy">Location adjustment:</strong>{" "}
              reflects the selected location-risk category.
            </li>
            <li>
              <strong className="text-navy">Experience adjustment:</strong>{" "}
              reflects worker experience.
            </li>
            <li>
              <strong className="text-navy">Raw premium:</strong> base premium
              plus the risk, location and experience adjustments.
            </li>
            <li>
              <strong className="text-navy">Capped premium:</strong> the raw
              premium limited to the prototype&apos;s ₹49–₹99 range.
            </li>
          </ul>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-warning/20 bg-warning/5 p-3.5 text-xs leading-relaxed text-muted">
          <Sparkles
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-warning"
          />
          <p>
            This is an estimated premium. It is not proof that an insurance
            policy has been issued, and no payment is taken.
          </p>
        </div>

        <ButtonLink
          href={dashboardHref}
          variant="secondary"
          size="md"
          className="mt-4 w-full"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to dashboard
        </ButtonLink>
      </div>
    </section>
  );
}
