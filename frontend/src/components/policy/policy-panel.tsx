import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { DISRUPTIONS, DISRUPTION_META } from "@/lib/disruptions";
import { cn, firstName, formatDate, formatINR } from "@/lib/format";
import type { PolicyRecord, SavedEstimate } from "@/lib/storage";
import type { Worker } from "@/lib/types";

export function PolicyPanel({
  worker,
  policy,
  savedEstimate,
  onActivate,
}: {
  worker: Worker;
  policy: PolicyRecord | null;
  savedEstimate: SavedEstimate | null;
  onActivate: () => void;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl p-6 sm:p-7",
        policy ? "bg-forest text-cream shadow-soft" : "card-surface",
      )}
    >
      {policy ? (
        <>
          <div className="bg-grid-lines pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-lime">
                  Active weekly cover
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {policy.plan}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-3 py-1.5 text-[0.7rem] font-semibold text-lime">
                <span className="status-dot" />
                {policy.status}
              </span>
            </div>

            <div className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-4">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-cream/45">
                  Weekly premium
                </p>
                <p className="mt-1 text-4xl font-semibold tracking-[-0.04em]">
                  {formatINR(policy.premium, { decimals: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-cream/45">
                  Cover up to
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatINR(policy.coverageCap)}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 border-t border-cream/10 pt-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-cream/[0.055] p-3.5">
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-cream/40">
                  Cover started
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(policy.startedAt)}
                </p>
              </div>
              <div className="rounded-2xl bg-cream/[0.055] p-3.5">
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-cream/40">
                  Renews
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(policy.renewsAt)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {DISRUPTIONS.map((item) => {
                const meta = DISRUPTION_META[item];
                const Icon = meta.icon;
                return (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-cream/10 bg-cream/[0.055] px-3 py-1.5 text-[0.7rem] text-cream/70"
                  >
                    <Icon aria-hidden="true" className="size-3.5 text-lime/80" />
                    {item}
                  </span>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-cream/10 pt-5">
              <p className="font-mono text-[0.65rem] text-cream/35">
                POLICY {policy.id.slice(0, 12).toUpperCase()}
              </p>
              <Link
                href={`/dashboard/${worker.id}/premium`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime hover:underline"
              >
                Recalculate premium
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          </div>
        </>
      ) : savedEstimate ? (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Ready to activate</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Turn your estimate into cover.
              </h2>
            </div>
            <span className="rounded-full bg-lime-soft px-3 py-1 text-[0.65rem] font-semibold text-forest-dark">
              Estimate
            </span>
          </div>

          <div className="mt-6 flex items-end gap-2">
            <span className="text-4xl font-semibold tracking-[-0.04em]">
              {formatINR(savedEstimate.estimate.final_weekly_premium, {
                decimals: 2,
              })}
            </span>
            <span className="pb-1.5 text-sm text-muted">/ week</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your saved estimate for {firstName(worker.full_name)} is ready.
            Activate it to create a prototype weekly policy.
          </p>

          <div className="mt-5 grid gap-2.5 rounded-2xl bg-cream/70 p-4 text-sm sm:grid-cols-2">
            <p className="flex items-center justify-between gap-2">
              <span className="text-muted">Risk zone</span>
              <span className="font-semibold capitalize">
                {savedEstimate.locationRisk}
              </span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="text-muted">Working days</span>
              <span className="font-semibold">
                {savedEstimate.workDaysPerWeek} / week
              </span>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={onActivate} size="md">
              <ShieldCheck aria-hidden="true" className="size-4" />
              Activate policy
            </Button>
            <ButtonLink
              href={`/dashboard/${worker.id}/premium`}
              variant="secondary"
              size="md"
            >
              Review estimate
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div>
          <p className="eyebrow">No policy yet</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Calculate your weekly premium first.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Your policy needs a premium estimate. Choose your zone and working
            days, then come back to activate cover.
          </p>
          <ButtonLink
            href={`/dashboard/${worker.id}/premium`}
            size="md"
            className="mt-6"
          >
            Calculate premium
            <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        </div>
      )}
    </section>
  );
}
