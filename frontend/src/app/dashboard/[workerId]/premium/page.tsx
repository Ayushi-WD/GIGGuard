"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This page hydrates client-only localStorage estimates after the worker loads. */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  CalendarDays,
  Check,
  CircleCheck,
  Info,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import {
  formatINR,
  formatSignedINR,
  firstName,
} from "@/lib/format";
import {
  activatePolicy,
  getPolicy,
  getSavedEstimate,
  saveEstimate,
  type PolicyRecord,
} from "@/lib/storage";
import {
  LOCATION_RISKS,
  LOCATION_RISK_COPY,
  type LocationRisk,
  type PricingEstimate,
} from "@/lib/types";
import { ApiError, estimatePremium } from "@/lib/api";
import { useWorker } from "@/lib/use-worker";

const riskPresets = [20, 50, 80];
const dayOptions = [1, 2, 3, 4, 5, 6, 7];

export default function PremiumCalculatorPage() {
  const params = useParams<{ workerId: string }>();
  const router = useRouter();
  const workerId = params.workerId;
  const { worker, loading, error, reload } = useWorker(workerId);

  const [locationRisk, setLocationRisk] = useState<LocationRisk>("medium");
  const [riskScore, setRiskScore] = useState(55);
  const [workDays, setWorkDays] = useState(6);
  const [result, setResult] = useState<PricingEstimate | null>(null);
  const [submittedKey, setSubmittedKey] = useState<string | null>(null);
  const [submittedMeta, setSubmittedMeta] = useState<{
    locationRisk: LocationRisk;
    riskScore: number;
    workDaysPerWeek: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);

  useEffect(() => {
    if (!worker) {
      return;
    }

    setPolicy(getPolicy(worker.id));

    const saved = getSavedEstimate(worker.id);
    if (saved) {
      setLocationRisk(saved.locationRisk);
      setRiskScore(saved.riskScore);
      setWorkDays(saved.workDaysPerWeek);
      setResult(saved.estimate);
      setSubmittedKey(
        `${saved.locationRisk}|${saved.riskScore}|${saved.workDaysPerWeek}`,
      );
      setSubmittedMeta({
        locationRisk: saved.locationRisk,
        riskScore: saved.riskScore,
        workDaysPerWeek: saved.workDaysPerWeek,
      });
    }
  }, [worker]);

  const currentKey = `${locationRisk}|${riskScore}|${workDays}`;
  const isStale = Boolean(result) && submittedKey !== currentKey;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!worker) {
      return;
    }

    if (!Number.isFinite(riskScore) || riskScore < 0 || riskScore > 100) {
      setFormError("Risk score must be between 0 and 100.");
      return;
    }

    const payload = {
      worker_id: worker.id,
      risk_score: riskScore,
      location_risk: locationRisk,
      work_days_per_week: workDays,
    };
    const signature = `${locationRisk}|${riskScore}|${workDays}`;
    const meta = {
      locationRisk,
      riskScore,
      workDaysPerWeek: workDays,
    };

    setSubmitting(true);

    try {
      const estimate = await estimatePremium(payload);
      setResult(estimate);
      setSubmittedKey(signature);
      setSubmittedMeta(meta);
      saveEstimate(worker.id, estimate, meta);
      setPolicy(getPolicy(worker.id));
    } catch (caught) {
      setFormError(
        caught instanceof ApiError
          ? caught.message
          : "Could not calculate your premium. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleActivate() {
    if (!worker || !result) {
      return;
    }

    const meta = submittedMeta ?? {
      locationRisk,
      riskScore,
      workDaysPerWeek: workDays,
    };

    const activated = activatePolicy(worker, {
      estimate: result,
      ...meta,
      savedAt: new Date().toISOString(),
    });
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

  const dailyIncome = Number(worker.average_daily_income);
  const weeklyIncome = dailyIncome * workDays;

  return (
    <div className="page-container py-10 sm:py-16">
      <Link
        href={`/dashboard/${worker.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Back to dashboard
      </Link>

      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Premium calculator
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Build your weekly cover.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            {firstName(worker.full_name)}, choose your location risk, set a
            simulated risk score and tell us how many days you work.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-paper px-4 py-2 text-xs text-muted">
          <BadgeIndianRupee aria-hidden="true" className="size-3.5 text-forest" />
          Daily income {formatINR(worker.average_daily_income)}
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <section className="card-surface p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Your week at a glance
            </h2>
            <span className="rounded-full bg-forest-light px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-forest">
              ₹49–₹99 range
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-7">
            <fieldset>
              <legend className="field-label">Location risk</legend>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {LOCATION_RISKS.map((risk) => {
                  const active = locationRisk === risk;
                  const copy = LOCATION_RISK_COPY[risk];
                  return (
                    <button
                      key={risk}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setLocationRisk(risk)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-forest bg-forest-light shadow-sm"
                          : "border-ink/10 bg-paper hover:border-forest/30 hover:bg-forest-light/30"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {copy.label}
                        </span>
                        <span
                          className={`grid size-4 place-items-center rounded-full border ${
                            active
                              ? "border-forest bg-forest text-cream"
                              : "border-ink/20"
                          }`}
                        >
                          {active ? (
                            <Check aria-hidden="true" className="size-2.5" />
                          ) : null}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-[0.7rem] leading-relaxed text-muted">
                        {copy.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="risk-score" className="field-label !mb-0">
                  Simulated risk score
                </label>
                <span className="rounded-full bg-forest-light px-3 py-1 text-xs font-semibold text-forest">
                  {riskScore} / 100
                </span>
              </div>
              <p className="field-hint">
                A higher score means more expected disruption in your zone.
              </p>

              <input
                id="risk-score"
                type="range"
                min={0}
                max={100}
                step={1}
                value={riskScore}
                onChange={(event) => setRiskScore(Number(event.target.value))}
                className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-forest-light accent-forest"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1.5">
                  {riskPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRiskScore(preset)}
                      className={`rounded-full px-3 py-1.5 text-[0.7rem] font-semibold transition ${
                        riskScore === preset
                          ? "bg-forest text-cream"
                          : "bg-cream text-muted hover:text-ink"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="risk-score-number"
                    className="text-xs text-muted"
                  >
                    Enter score
                  </label>
                  <input
                    id="risk-score-number"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={riskScore}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setRiskScore(
                        Number.isFinite(next)
                          ? Math.min(100, Math.max(0, next))
                          : 0,
                      );
                    }}
                    className="w-20 rounded-xl border border-ink/15 bg-paper px-3 py-2 text-center text-sm font-semibold text-ink outline-none focus:border-forest focus:ring-4 focus:ring-forest/10"
                  />
                </div>
              </div>
            </div>

            <fieldset>
              <legend className="field-label">Working days per week</legend>
              <div className="grid grid-cols-7 gap-1.5">
                {dayOptions.map((day) => {
                  const active = workDays === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setWorkDays(day)}
                      className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                        active
                          ? "bg-forest text-cream shadow-sm"
                          : "bg-cream text-muted hover:bg-forest-light hover:text-forest"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-col justify-between gap-2 rounded-xl bg-cream/70 px-4 py-3 text-xs text-muted sm:flex-row sm:items-center">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-3.5 text-forest"
                  />
                  {workDays} days × {formatINR(dailyIncome)} daily income
                </span>
                <span className="font-semibold text-ink">
                  {formatINR(weeklyIncome)} weekly income
                </span>
              </div>
            </fieldset>

            {formError ? (
              <div
                role="alert"
                className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
              >
                {formError}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Calculating…
                </>
              ) : (
                <>
                  Calculate weekly premium
                  <ArrowRight aria-hidden="true" className="size-4" />
                </>
              )}
            </Button>

            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Info
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0 text-forest"
              />
              This prototype uses a manually entered simulated risk score. It
              does not read live weather or AQI data.
            </p>
          </form>
        </section>

        <aside className="lg:sticky lg:top-24">
          {result ? (
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
                            ((Number(result.final_weekly_premium) - 49) / 50) *
                              100,
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
                    <dt className="font-semibold text-cream">
                      Final weekly premium
                    </dt>
                    <dd className="text-lg font-semibold text-lime">
                      {formatINR(result.final_weekly_premium, {
                        decimals: 2,
                      })}
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
                    onClick={handleActivate}
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
                  Estimate saved in this browser. Activating creates a
                  prototype policy for this worker.
                </p>
              </div>
            </section>
          ) : (
            <section className="relative overflow-hidden rounded-3xl border border-dashed border-forest/25 bg-forest-light/40 p-6 sm:p-7">
              <p className="eyebrow">Your estimate</p>
              <p className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
                ₹49–₹99
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Fill in your week and calculate to see the full premium
                breakdown, including risk, location and experience adjustments.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-muted">
                {[
                  "Base premium from weekly income",
                  "Risk loading from your score",
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
                Your last saved estimate for this worker will appear here when
                you return.
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
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
