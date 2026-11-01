"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This page hydrates client-only policies, estimates and claims after the worker list loads. */

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  CalendarDays,
  Check,
  CircleAlert,
  CloudRain,
  FileText,
  Flame,
  Info,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Wind,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import {
  ClaimStatusBadge,
  EmptyState,
  ErrorState,
  LoadingState,
  PlatformBadge,
} from "@/components/ui/feedback";
import {
  cn,
  firstName,
  formatDate,
  formatINR,
  initials,
  todayISO,
} from "@/lib/format";
import {
  activatePolicy,
  createClaim,
  DISRUPTIONS,
  estimatedPayout,
  getActiveWorkerId,
  getClaimsForWorker,
  getPolicy,
  getSavedEstimate,
  rememberWorker,
  type ClaimRecord,
  type Disruption,
  type PolicyRecord,
  type SavedEstimate,
} from "@/lib/storage";
import { useWorkers } from "@/lib/use-worker";

const disruptionMeta: Record<
  Disruption,
  { icon: typeof CloudRain; tone: string; description: string }
> = {
  Rain: {
    icon: CloudRain,
    tone: "bg-rain/10 text-rain",
    description: "Heavy rain or waterlogging",
  },
  Heat: {
    icon: Flame,
    tone: "bg-heat/10 text-heat",
    description: "Heat advisory or unsafe temperature",
  },
  Pollution: {
    icon: Wind,
    tone: "bg-smog/10 text-smog",
    description: "Severe air quality (AQI spike)",
  },
};

export default function PolicyPage() {
  const { workers, loading, error, reload } = useWorkers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [savedEstimate, setSavedEstimate] = useState<SavedEstimate | null>(
    null,
  );
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [justActivated, setJustActivated] = useState(false);

  const [disruption, setDisruption] = useState<Disruption>("Rain");
  const [incidentDate, setIncidentDate] = useState(todayISO());
  const [hoursLost, setHoursLost] = useState(4);
  const [description, setDescription] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const selectedWorker =
    workers.find((worker) => worker.id === selectedId) ?? workers[0] ?? null;

  useEffect(() => {
    const activeId = getActiveWorkerId();
    if (activeId) {
      setSelectedId(activeId);
    } else if (workers.length > 0) {
      setSelectedId(workers[0].id);
    }
  }, [workers]);

  useEffect(() => {
    if (!selectedWorker) {
      setPolicy(null);
      setSavedEstimate(null);
      setClaims([]);
      return;
    }

    setPolicy(getPolicy(selectedWorker.id));
    setSavedEstimate(getSavedEstimate(selectedWorker.id));
    setClaims(getClaimsForWorker(selectedWorker.id));
  }, [selectedWorker]);

  useEffect(() => {
    if (!justActivated) {
      return;
    }

    const timer = window.setTimeout(() => setJustActivated(false), 4000);
    return () => window.clearTimeout(timer);
  }, [justActivated]);

  function handleWorkerChange(workerId: string) {
    setSelectedId(workerId);
    rememberWorker(workerId);
    setJustActivated(false);
    setClaimSuccess(false);
    setClaimError(null);
  }

  function handleActivate() {
    if (!selectedWorker || !savedEstimate) {
      return;
    }

    const activated = activatePolicy(selectedWorker, savedEstimate);
    setPolicy(activated);
    setJustActivated(true);
    rememberWorker(selectedWorker.id);
  }

  function handleFileClaim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClaimError(null);
    setClaimSuccess(false);

    if (!selectedWorker || !policy) {
      setClaimError("Activate a policy before filing a claim.");
      return;
    }

    if (!Number.isFinite(hoursLost) || hoursLost <= 0 || hoursLost > 12) {
      setClaimError("Hours lost must be between 1 and 12.");
      return;
    }

    if (!incidentDate) {
      setClaimError("Choose the date the disruption happened.");
      return;
    }

    setSubmittingClaim(true);

    try {
      createClaim({
        worker: selectedWorker,
        policy,
        disruption,
        incidentDate,
        hoursLost,
        description: description.trim(),
      });
      setClaims(getClaimsForWorker(selectedWorker.id));
      setClaimSuccess(true);
      setDescription("");
      setHoursLost(4);
      setIncidentDate(todayISO());
    } catch {
      setClaimError("Could not file this claim. Please try again.");
    } finally {
      setSubmittingClaim(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container py-10 sm:py-16">
        <LoadingState label="Loading worker profiles…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container py-10 sm:py-16">
        <ErrorState
          title="Could not load worker profiles"
          message={error}
          onRetry={reload}
        />
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="page-container py-10 sm:py-16">
        <div className="max-w-2xl">
          <p className="eyebrow">
            <FileText aria-hidden="true" className="size-3.5" />
            Policy &amp; claims
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Cover, claims, and peace of mind.
          </h1>
        </div>
        <div className="mt-8">
          <EmptyState
            icon={ShieldCheck}
            title="Register a worker first"
            description="Policies are linked to a worker profile. Create a profile, calculate a premium, and your weekly cover will show up here."
            action={
              <ButtonLink href="/register" size="md">
                Register as a worker
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
            }
          />
        </div>
      </div>
    );
  }

  if (!selectedWorker) {
    return null;
  }

  const payoutPreview = policy ? estimatedPayout(policy, hoursLost) : 0;

  return (
    <div className="page-container py-10 sm:py-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">
            <FileText aria-hidden="true" className="size-3.5" />
            Policy &amp; claims
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Cover, claims, and peace of mind.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            See your weekly policy, check what is covered, and file a claim
            when a disruption costs you working hours.
          </p>
        </div>

        <label className="flex w-full flex-col gap-1.5 text-xs font-semibold text-muted sm:w-64">
          Viewing worker
          <select
            value={selectedWorker.id}
            onChange={(event) => handleWorkerChange(event.target.value)}
            className="field-input !py-2.5 text-sm font-medium"
          >
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.full_name} · {worker.platform}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <section
          className={cn(
            "relative overflow-hidden rounded-3xl p-6 sm:p-7",
            policy
              ? "bg-forest text-cream shadow-soft"
              : "card-surface",
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
                    const meta = disruptionMeta[item];
                    return (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-full border border-cream/10 bg-cream/[0.055] px-3 py-1.5 text-[0.7rem] text-cream/70"
                      >
                        <meta.icon
                          aria-hidden="true"
                          className="size-3.5 text-lime/80"
                        />
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
                    href={`/dashboard/${selectedWorker.id}/premium`}
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
                Your saved estimate for {firstName(selectedWorker.full_name)} is
                ready. Activate it to create a prototype weekly policy.
              </p>

              <div className="mt-5 grid gap-2.5 rounded-2xl bg-cream/70 p-4 text-sm sm:grid-cols-2">
                <p className="flex items-center justify-between gap-2">
                  <span className="text-muted">Location risk</span>
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
                <Button onClick={handleActivate} size="md">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  Activate policy
                </Button>
                <ButtonLink
                  href={`/dashboard/${selectedWorker.id}/premium`}
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
                Your policy needs a premium estimate. Choose a location risk,
                risk score and working days, then come back to activate cover.
              </p>
              <ButtonLink
                href={`/dashboard/${selectedWorker.id}/premium`}
                size="md"
                className="mt-6"
              >
                Calculate premium
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="card-surface p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-forest-light text-sm font-semibold text-forest">
                {initials(selectedWorker.full_name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {selectedWorker.full_name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <PlatformBadge platform={selectedWorker.platform} />
                  <span className="inline-flex items-center gap-1 text-[0.68rem] text-muted">
                    <MapPin aria-hidden="true" className="size-3" />
                    {selectedWorker.city}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4 text-sm">
              <span className="text-muted">Daily income</span>
              <span className="font-semibold">
                {formatINR(selectedWorker.average_daily_income)}
              </span>
            </div>
          </section>

          <section className="rounded-3xl border border-forest/15 bg-forest-light/50 p-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-forest">
              <Info aria-hidden="true" className="size-4" />
              Prototype note
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Policies and claims are stored in this browser. The backend only
              exposes workers and pricing estimates, so these records are
              frontend-only for the demo.
            </p>
          </section>
        </aside>
      </div>

      <section className="mt-5 card-surface p-6 sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">What&apos;s covered</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Three disruptions, one weekly policy
            </h2>
          </div>
          <p className="text-xs text-muted">
            Indicative cover up to one week of lost income
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {DISRUPTIONS.map((item) => {
            const meta = disruptionMeta[item];
            return (
              <div
                key={item}
                className="rounded-2xl border border-ink/10 bg-cream/50 p-4"
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-xl",
                    meta.tone,
                  )}
                >
                  <meta.icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{item}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {meta.description}
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-[0.65rem] font-semibold text-forest">
                  <Check aria-hidden="true" className="size-3" />
                  Covered when a policy is active
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-heat/20 bg-heat/5 p-4 text-xs leading-relaxed text-muted">
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-heat"
          />
          <p>
            Exclusions: routine traffic, vehicle breakdowns, personal leave and
            any event that is not a declared rain, heat or pollution
            disruption. This prototype does not make real payouts.
          </p>
        </div>
      </section>

      <section id="claims" className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card-surface p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">File a claim</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Lost hours? Tell us what happened.
              </h2>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-forest-light text-forest">
              <FileText aria-hidden="true" className="size-5" />
            </span>
          </div>

          {!policy ? (
            <div className="mt-6">
              <EmptyState
                icon={ShieldCheck}
                title="Activate a policy to claim"
                description="Claims are available once you have an active weekly policy for this worker."
                action={
                  savedEstimate ? (
                    <Button onClick={handleActivate} size="sm">
                      Activate policy
                    </Button>
                  ) : (
                    <ButtonLink
                      href={`/dashboard/${selectedWorker.id}/premium`}
                      size="sm"
                    >
                      Calculate premium
                    </ButtonLink>
                  )
                }
              />
            </div>
          ) : (
            <form onSubmit={handleFileClaim} className="mt-6 space-y-5">
              <fieldset>
                <legend className="field-label">Disruption type</legend>
                <div className="grid grid-cols-3 gap-2">
                  {DISRUPTIONS.map((item) => {
                    const meta = disruptionMeta[item];
                    const active = disruption === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setDisruption(item)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition",
                          active
                            ? "border-forest bg-forest-light"
                            : "border-ink/10 bg-paper hover:border-forest/30",
                        )}
                      >
                        <meta.icon
                          aria-hidden="true"
                          className={cn("size-4", active ? "text-forest" : "text-muted")}
                        />
                        <span className="mt-2 block text-xs font-semibold">
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="incident-date" className="field-label">
                    Date of disruption
                  </label>
                  <input
                    id="incident-date"
                    type="date"
                    max={todayISO()}
                    value={incidentDate}
                    onChange={(event) => setIncidentDate(event.target.value)}
                    className="field-input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="hours-lost" className="field-label">
                    Hours lost
                  </label>
                  <input
                    id="hours-lost"
                    type="number"
                    min={1}
                    max={12}
                    step={1}
                    value={hoursLost}
                    onChange={(event) =>
                      setHoursLost(
                        Number.isFinite(Number(event.target.value))
                          ? Number(event.target.value)
                          : 1,
                      )
                    }
                    className="field-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="claim-note" className="field-label">
                  What happened?{" "}
                  <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea
                  id="claim-note"
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="e.g. Heavy rain flooded the route and deliveries were paused for four hours."
                  className="field-input resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-forest-light/60 px-4 py-3.5">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">
                    Indicative payout
                  </p>
                  <p className="mt-1 text-xl font-semibold text-forest">
                    {formatINR(payoutPreview, { decimals: 2 })}
                  </p>
                </div>
                <BadgeIndianRupee
                  aria-hidden="true"
                  className="size-6 text-forest/50"
                />
              </div>

              {claimError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
                >
                  {claimError}
                </div>
              ) : null}

              {claimSuccess ? (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-xl border border-forest/20 bg-forest-light px-4 py-3 text-sm text-forest"
                >
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  Claim filed. It is now under review in the admin queue.
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={submittingClaim}
                className="w-full"
                size="lg"
              >
                {submittingClaim ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Filing claim…
                  </>
                ) : (
                  <>
                    File claim
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </>
                )}
              </Button>

              <p className="flex items-start gap-2 text-[0.68rem] leading-relaxed text-muted">
                <Info
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-forest"
                />
                Payouts are indicative and based on your daily income and hours
                lost. No real money is transferred.
              </p>
            </form>
          )}
        </div>

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
                const meta = disruptionMeta[claim.disruption];
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
                          <meta.icon aria-hidden="true" className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">
                            {claim.disruption} disruption
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {formatDate(claim.incidentDate)} ·{" "}
                            {claim.hoursLost} hours lost
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
            Claims filed here appear in the admin dashboard on this device.
            Approve or reject them there to complete the demo flow.
          </div>
        </div>
      </section>

      {justActivated ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-cream shadow-soft"
        >
          <Check aria-hidden="true" className="size-4 text-lime" />
          Weekly policy activated
        </div>
      ) : null}

      <div className="mt-6">
        <Link
          href={`/dashboard/${selectedWorker.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Back to {firstName(selectedWorker.full_name)}&apos;s dashboard
        </Link>
      </div>
    </div>
  );
}
