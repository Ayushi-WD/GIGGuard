import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, ShieldCheck } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { DISRUPTIONS, DISRUPTION_META } from "@/lib/disruptions";
import { cn, firstName, formatDate, formatINR } from "@/lib/format";
import type { SavedEstimate } from "@/lib/storage";
import type { PolicyRecord, Worker } from "@/lib/types";

export function PolicyPanel({
  worker,
  policy,
  savedEstimate,
  onActivate,
  activating = false,
  error = null,
}: {
  worker: Worker;
  policy: PolicyRecord | null;
  savedEstimate: SavedEstimate | null;
  onActivate: () => void;
  activating?: boolean;
  error?: string | null;
}) {
  const isActive = policy?.status === "active";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-card border",
        isActive
          ? "bg-navy text-white border-teal/30"
          : "bg-white text-navy border-line",
      )}
    >
      {isActive ? (
        <>
          <div className="bg-grid-lines pointer-events-none absolute inset-0 opacity-30" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full border-[38px] border-teal/20"
          />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-teal-light">
                  <span className="size-1.5 rounded-full bg-teal-light animate-pulse" />
                  Active weekly cover
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  GIG-Guard Weekly Protection
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-light/20 border border-teal-light/40 px-3 py-1.5 text-xs font-semibold text-teal-light">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                Active
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-white/60">
                  Weekly premium
                </p>
                <p className="mt-1 text-4xl font-semibold tracking-[-0.04em] text-white">
                  {formatINR(policy.premium, { decimals: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-white/60">
                  Risk score
                </p>
                <p className="mt-1 text-2xl font-semibold text-teal-light">
                  {Number(policy.risk_score).toFixed(0)} / 100
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-white/60">
                  Coverage window
                </p>
                <p className="mt-1 text-sm font-medium text-white flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="size-4 text-teal-light" />
                  {formatDate(policy.week_start)} — {formatDate(policy.week_end)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-white/60">
                  Worker protected
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {worker.full_name} ({worker.city})
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/60 mb-2.5">
                Automatically triggered covered disruptions
              </p>
              <div className="flex flex-wrap gap-2">
                {DISRUPTIONS.map((item) => {
                  const meta = DISRUPTION_META[item];
                  const Icon = meta.icon;
                  return (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80"
                    >
                      <Icon aria-hidden="true" className="size-3.5 text-teal-light" />
                      {item}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
              <p className="font-mono text-[0.65rem] text-white/40">
                POLICY ID: {policy.id}
              </p>
              <Link
                href={`/dashboard/${worker.id}/premium`}
                className="inline-flex items-center gap-1.5 font-semibold text-teal-light hover:underline"
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
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-navy">
                Activate parametric coverage.
              </h2>
            </div>
            <span className="rounded-full bg-teal-light px-3 py-1 text-xs font-semibold text-teal-dark">
              Calculated estimate
            </span>
          </div>

          <div className="mt-6 flex items-end gap-2">
            <span className="text-4xl font-semibold tracking-[-0.04em] text-navy">
              {formatINR(savedEstimate.estimate.final_weekly_premium, {
                decimals: 2,
              })}
            </span>
            <span className="pb-1 text-sm text-muted">/ week</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your saved weekly estimate for {firstName(worker.full_name)} is ready.
            Activating this policy provides instant 7-day parametric protection against
            adverse weather and civic disruptions.
          </p>

          <div className="mt-5 grid gap-2.5 rounded-2xl bg-mist/70 border border-line p-4 text-sm sm:grid-cols-2">
            <p className="flex items-center justify-between gap-2">
              <span className="text-muted">Risk zone</span>
              <span className="font-semibold capitalize text-navy">
                {savedEstimate.locationRisk}
              </span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="text-muted">Working days</span>
              <span className="font-semibold text-navy">
                {savedEstimate.workDaysPerWeek} days / week
              </span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="text-muted">Derived risk score</span>
              <span className="font-semibold text-navy">
                {savedEstimate.riskScore} / 100
              </span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="text-muted">Coverage window</span>
              <span className="font-semibold text-navy">
                7 Days from activation
              </span>
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button onClick={onActivate} size="md" disabled={activating}>
              <ShieldCheck aria-hidden="true" className="size-4" />
              {activating ? "Activating cover…" : "Activate policy"}
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
          <p className="eyebrow">No active policy</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-navy">
            Calculate your weekly premium first.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Your policy needs a premium estimate. Choose your risk zone and working
            days, then activate parametric coverage.
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
