"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This page hydrates client-only localStorage records after the worker loads. */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  CalendarDays,
  Check,
  Clock3,
  CloudRain,
  FileText,
  Flame,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wind,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import {
  ErrorState,
  LoadingState,
  PlatformBadge,
} from "@/components/ui/feedback";
import {
  formatDate,
  formatExperience,
  formatINR,
  firstName,
  initials,
} from "@/lib/format";
import {
  activatePolicy,
  getClaimsForWorker,
  getPolicy,
  getSavedEstimate,
  type PolicyRecord,
  type SavedEstimate,
} from "@/lib/storage";
import { LOCATION_RISK_COPY } from "@/lib/types";
import { useWorker } from "@/lib/use-worker";

const coverage = [
  {
    icon: CloudRain,
    title: "Heavy rain",
    description: "Lost delivery hours due to waterlogging",
    tone: "bg-rain/10 text-rain",
  },
  {
    icon: Flame,
    title: "Extreme heat",
    description: "Safety pauses during heat advisories",
    tone: "bg-heat/10 text-heat",
  },
  {
    icon: Wind,
    title: "Severe pollution",
    description: "Unsafe AQI levels that stop outdoor work",
    tone: "bg-smog/10 text-smog",
  },
];

export default function WorkerDashboardPage() {
  const params = useParams<{ workerId: string }>();
  const router = useRouter();
  const workerId = params.workerId;
  const { worker, loading, error, reload } = useWorker(workerId);

  const [savedEstimate, setSavedEstimate] = useState<SavedEstimate | null>(
    null,
  );
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [claimCount, setClaimCount] = useState(0);

  useEffect(() => {
    if (!worker) {
      return;
    }

    setSavedEstimate(getSavedEstimate(worker.id));
    setPolicy(getPolicy(worker.id));
    setClaimCount(getClaimsForWorker(worker.id).length);
  }, [worker]);

  function handleActivate() {
    if (!worker || !savedEstimate) {
      return;
    }

    const activated = activatePolicy(worker, savedEstimate);
    setPolicy(activated);
    router.push("/policy");
  }

  if (loading) {
    return (
      <div className="page-container py-10 sm:py-16">
        <LoadingState label="Loading your worker profile…" />
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="page-container py-10 sm:py-16">
        <ErrorState
          title="Could not load this worker"
          message={
            error ??
            "The worker profile was not found. It may have been removed from the database."
          }
          onRetry={reload}
        />
        <ButtonLink href="/dashboard" variant="secondary" className="mt-4">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to profiles
        </ButtonLink>
      </div>
    );
  }

  const premium = savedEstimate
    ? Number(savedEstimate.estimate.final_weekly_premium)
    : null;

  return (
    <div className="page-container py-10 sm:py-16">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        All worker profiles
      </Link>

      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            Worker dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Namaste, {firstName(worker.full_name)}.
          </h1>
          <p className="mt-2 text-sm text-muted">
            Here is your profile and weekly cover snapshot.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink
            href={`/dashboard/${worker.id}/premium`}
            size="md"
          >
            <Sparkles aria-hidden="true" className="size-4" />
            {savedEstimate ? "Recalculate premium" : "Calculate premium"}
          </ButtonLink>
          <ButtonLink href="/policy" variant="secondary" size="md">
            <FileText aria-hidden="true" className="size-4" />
            Policy & claims
          </ButtonLink>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
        <section className="card-surface p-6 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-forest-light text-lg font-semibold text-forest">
                {initials(worker.full_name)}
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {worker.full_name}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <PlatformBadge platform={worker.platform} />
                  <span className="text-xs text-muted">
                    Member since {formatDate(worker.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-forest-light px-3 py-1.5 text-[0.7rem] font-semibold text-forest">
              <Check aria-hidden="true" className="size-3.5" />
              Verified profile
            </span>
          </div>

          <dl className="mt-7 grid gap-4 border-t border-ink/10 pt-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-cream/70 p-4">
              <dt className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                <MapPin aria-hidden="true" className="size-3.5" />
                City
              </dt>
              <dd className="mt-1.5 text-base font-semibold">{worker.city}</dd>
            </div>
            <div className="rounded-2xl bg-cream/70 p-4">
              <dt className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                <BadgeIndianRupee aria-hidden="true" className="size-3.5" />
                Daily income
              </dt>
              <dd className="mt-1.5 text-base font-semibold">
                {formatINR(worker.average_daily_income)}
                <span className="ml-1 text-xs font-normal text-muted">
                  / day
                </span>
              </dd>
            </div>
            <div className="rounded-2xl bg-cream/70 p-4">
              <dt className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                <Clock3 aria-hidden="true" className="size-3.5" />
                Experience
              </dt>
              <dd className="mt-1.5 text-base font-semibold">
                {formatExperience(worker.experience_days)}
              </dd>
            </div>
            <div className="rounded-2xl bg-cream/70 p-4">
              <dt className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                Worker ID
              </dt>
              <dd className="mt-1.5 truncate font-mono text-xs font-medium text-muted">
                {worker.id}
              </dd>
            </div>
          </dl>
        </section>

        <section
          className={
            savedEstimate
              ? "relative overflow-hidden rounded-3xl bg-forest p-6 text-cream shadow-soft sm:p-7"
              : "relative overflow-hidden rounded-3xl border border-dashed border-forest/25 bg-forest-light/40 p-6 sm:p-7"
          }
        >
          {savedEstimate ? (
            <>
              <div className="bg-grid-lines pointer-events-none absolute inset-0 opacity-50" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-lime">
                    Your weekly premium
                  </p>
                  {policy ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-2.5 py-1 text-[0.65rem] font-semibold text-lime">
                      <span className="status-dot" />
                      Active cover
                    </span>
                  ) : (
                    <span className="rounded-full bg-cream/10 px-2.5 py-1 text-[0.65rem] font-semibold text-cream/70">
                      Estimate
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-[-0.05em]">
                    {formatINR(premium ?? 0, { decimals: 2 })}
                  </span>
                  <span className="pb-1.5 text-sm text-cream/50">/ week</span>
                </div>
                <p className="mt-1 text-xs text-cream/50">
                  Final premium is always within ₹49–₹99
                </p>

                <dl className="mt-6 space-y-2.5 border-t border-cream/10 pt-5 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-cream/55">Location risk</dt>
                    <dd className="font-medium">
                      {LOCATION_RISK_COPY[savedEstimate.locationRisk].label}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-cream/55">Simulated risk score</dt>
                    <dd className="font-medium">
                      {savedEstimate.riskScore.toFixed(0)} / 100
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-cream/55">Working days</dt>
                    <dd className="font-medium">
                      {savedEstimate.workDaysPerWeek} days / week
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap gap-2">
                  <ButtonLink
                    href={`/dashboard/${worker.id}/premium`}
                    variant="lime"
                    size="sm"
                  >
                    Recalculate
                  </ButtonLink>
                  {policy ? (
                    <ButtonLink
                      href="/policy"
                      variant="inverse"
                      size="sm"
                    >
                      View policy
                    </ButtonLink>
                  ) : (
                    <Button
                      variant="inverse"
                      size="sm"
                      onClick={handleActivate}
                    >
                      Activate cover
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col justify-between">
              <div>
                <p className="eyebrow">Weekly premium</p>
                <p className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
                  ₹49–₹99
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Your exact premium depends on location risk, simulated risk
                  score and the number of days you work.
                </p>
              </div>
              <ButtonLink
                href={`/dashboard/${worker.id}/premium`}
                size="md"
                className="mt-6 w-full"
              >
                Calculate my premium
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
            </div>
          )}
        </section>
      </div>

      <section className="mt-5 card-surface p-6 sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Cover snapshot</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Built around three disruption types
            </h2>
          </div>
          <p className="text-xs text-muted">
            {policy
              ? `Cover renews on ${formatDate(policy.renewsAt)}`
              : "Activate a policy to start your weekly cover"}
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {coverage.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-cream/50 p-4"
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.tone}`}
              >
                <item.icon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <span className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-forest">
                    Covered
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl bg-forest-light/60 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-paper text-forest">
              <FileText aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {claimCount === 0
                  ? "No claims filed yet"
                  : `${claimCount} ${claimCount === 1 ? "claim" : "claims"} filed`}
              </p>
              <p className="text-xs text-muted">
                File and track disruption claims from the policy page.
              </p>
            </div>
          </div>
          <Link
            href="/policy"
            className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
          >
            Go to policy & claims
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
