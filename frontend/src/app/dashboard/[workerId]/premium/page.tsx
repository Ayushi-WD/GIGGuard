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
  Info,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EstimatePanel } from "@/components/premium/estimate-panel";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { formatINR, firstName } from "@/lib/format";
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
  LOCATION_RISK_SCORE,
  type LocationRisk,
  type PricingEstimate,
} from "@/lib/types";
import { ApiError, estimatePremium } from "@/lib/api";
import { useWorker } from "@/lib/use-worker";

const dayOptions = [1, 2, 3, 4, 5, 6, 7];

export default function PremiumCalculatorPage() {
  const params = useParams<{ workerId: string }>();
  const router = useRouter();
  const workerId = params.workerId;
  const { worker, loading, error, reload } = useWorker(workerId);

  const [locationRisk, setLocationRisk] = useState<LocationRisk>("medium");
  const [workDays, setWorkDays] = useState(6);
  const [result, setResult] = useState<PricingEstimate | null>(null);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);

  // Workers only choose their zone; the score is derived for the pricing API.
  const riskScore = LOCATION_RISK_SCORE[locationRisk];
  const currentKey = `${locationRisk}|${riskScore}|${workDays}`;
  const isStale = Boolean(result) && resultKey !== currentKey;

  useEffect(() => {
    if (!worker) {
      return;
    }

    setPolicy(getPolicy(worker.id));

    const saved = getSavedEstimate(worker.id);
    if (saved) {
      setLocationRisk(saved.locationRisk);
      setWorkDays(saved.workDaysPerWeek);
      setResult(saved.estimate);
      setResultKey(
        `${saved.locationRisk}|${saved.riskScore}|${saved.workDaysPerWeek}`,
      );
    }
  }, [worker]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!worker) {
      return;
    }

    setSubmitting(true);

    try {
      const estimate = await estimatePremium({
        worker_id: worker.id,
        risk_score: riskScore,
        location_risk: locationRisk,
        work_days_per_week: workDays,
      });
      setResult(estimate);
      setResultKey(currentKey);
      saveEstimate(worker.id, estimate, {
        locationRisk,
        riskScore,
        workDaysPerWeek: workDays,
      });
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

    const activated = activatePolicy(worker, {
      estimate: result,
      locationRisk,
      riskScore,
      workDaysPerWeek: workDays,
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

      <PageHeader
        className="mt-6"
        icon={Sparkles}
        eyebrow="Premium calculator"
        title="Build your weekly cover."
        description={`${firstName(worker.full_name)}, choose your risk zone and tell us how many days you work. We estimate the risk score for you.`}
        actions={
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-paper px-4 py-2 text-xs text-muted">
            <BadgeIndianRupee
              aria-hidden="true"
              className="size-3.5 text-forest"
            />
            Daily income {formatINR(worker.average_daily_income)}
          </div>
        }
      />

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

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <fieldset>
              <legend className="field-label">Your risk zone</legend>
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

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-forest/15 bg-forest-light/40 px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <Sparkles
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-forest"
                />
                <div>
                  <p className="text-xs font-semibold">Estimated risk score</p>
                  <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted">
                    Set automatically from your zone. You do not need to enter
                    it.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-forest px-3 py-1 text-sm font-semibold text-cream">
                {riskScore} / 100
              </span>
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
              The risk score is estimated from your zone. This prototype does
              not read live weather or AQI data.
            </p>
          </form>
        </section>

        <aside className="lg:sticky lg:top-24">
          <EstimatePanel
            result={result}
            policy={policy}
            isStale={isStale}
            onActivate={handleActivate}
          />
        </aside>
      </div>
    </div>
  );
}
