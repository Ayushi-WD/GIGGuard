"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Synchronizing default simulation city with loaded workers. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PlatformBadge,
} from "@/components/ui/feedback";
import { ApiError, simulateDisruption } from "@/lib/api";
import {
  formatExperience,
  formatINR,
  initials,
} from "@/lib/format";
import { getSavedEstimate } from "@/lib/storage";
import type { DisruptionType, SimulateResponse } from "@/lib/types";
import { useAuth } from "@/lib/use-auth";
import { useWorkers } from "@/lib/use-worker";

const DISRUPTION_UNITS: Record<DisruptionType, { label: string; unit: string; defaultValue: number }> = {
  rain: { label: "Rainfall", unit: "mm of rain", defaultValue: 60 },
  heat: { label: "Extreme Heat", unit: "°C temperature", defaultValue: 45 },
  aqi: { label: "Air Quality (AQI)", unit: "AQI index", defaultValue: 350 },
  flood: { label: "Flood Alert", unit: "1 for active", defaultValue: 1 },
  curfew: { label: "Curfew / Civic", unit: "1 for active", defaultValue: 1 },
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoggedIn, isAdmin, loading: authLoading, logout } = useAuth();
  const { workers, loading, error, reload } = useWorkers();

  // Disruption simulation state
  const [simCity, setSimCity] = useState("Delhi");
  const [simDisruption, setSimDisruption] = useState<DisruptionType>("rain");
  const [simValue, setSimValue] = useState(60);
  const [simDuration, setSimDuration] = useState(8);
  const [simAutoApprove, setSimAutoApprove] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulateResponse | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    if (workers.length > 0 && !simCity) {
      setSimCity(workers[0].city);
    }
  }, [workers, simCity]);

  function handleDisruptionChange(type: DisruptionType) {
    setSimDisruption(type);
    setSimValue(DISRUPTION_UNITS[type].defaultValue);
    setSimResult(null);
    setSimError(null);
  }

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    setSimulating(true);
    setSimError(null);
    setSimResult(null);

    try {
      const res = await simulateDisruption(
        {
          city: simCity.trim(),
          disruption_type: simDisruption,
          value: Number(simValue),
          duration_hours: Number(simDuration),
        },
        simAutoApprove,
      );
      setSimResult(res);
    } catch (err) {
      setSimError(
        err instanceof ApiError
          ? err.message
          : "Failed to simulate disruption. Please check admin permissions.",
      );
    } finally {
      setSimulating(false);
    }
  }

  if (authLoading) {
    return (
      <div className="page-container flex min-h-[50vh] items-center justify-center">
        <LoadingState label="Verifying admin credentials…" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <SignInPrompt
        title="Admin login required"
        description="The admin console is only accessible to administrators. Log in with the administrator account to continue."
      >
        <div className="rounded-2xl border border-teal/20 bg-teal-light/60 p-3 text-left">
          <p className="text-xs font-semibold text-teal-dark">
            Default admin credentials
          </p>
          <p className="mt-1 text-xs text-muted">
            Username: <code className="font-semibold text-navy">admin</code>{" "}
            &nbsp;|&nbsp; Password:{" "}
            <code className="font-semibold text-navy">admin123</code>
          </p>
        </div>
        <ButtonLink href="/login?redirect=/admin" size="lg" className="w-full">
          Log in as Admin
          <ArrowRight aria-hidden="true" className="size-4" />
        </ButtonLink>
        <ButtonLink href="/" variant="secondary" className="w-full">
          Back to Home
        </ButtonLink>
      </SignInPrompt>
    );
  }

  if (!isAdmin) {
    return (
      <SignInPrompt
        tone="danger"
        icon={ShieldAlert}
        title="Admin access only"
        description={
          <>
            You are logged in as{" "}
            <strong className="text-navy">
              {user?.full_name || user?.username}
            </strong>{" "}
            (worker). The admin console is restricted to administrators.
          </>
        }
      >
        <ButtonLink href="/dashboard" size="lg" className="w-full">
          Go to your worker dashboard
          <ArrowRight aria-hidden="true" className="size-4" />
        </ButtonLink>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/login?redirect=/admin");
          }}
          className="mt-2 text-xs font-semibold text-muted transition hover:text-danger"
        >
          Log out and sign in with admin account
        </button>
      </SignInPrompt>
    );
  }

  const averageIncome =
    workers.length > 0
      ? workers.reduce(
          (total, worker) => total + Number(worker.average_daily_income),
          0,
        ) / workers.length
      : 0;
  const averageExperience =
    workers.length > 0
      ? workers.reduce((total, worker) => total + worker.experience_days, 0) /
        workers.length
      : 0;
  const cities = new Set(workers.map((worker) => worker.city.toLowerCase()))
    .size;

  return (
    <div className="page-container py-10 sm:py-16">
      <PageHeader
        icon={Activity}
        eyebrow="Admin console"
        title="Worker overview."
        description="Worker profiles come from the FastAPI backend. This console is read-only. Premium estimates and all claim or payout features remain separate prototype work."
        actions={
          <>
            <Button variant="secondary" size="md" onClick={reload}>
              <RefreshCw aria-hidden="true" className="size-4" />
              Refresh workers
            </Button>
            <ButtonLink href="/register" size="md">
              Add worker
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
          </>
        }
      />

      {loading ? (
        <div className="mt-8">
          <LoadingState label="Loading worker portfolio…" />
        </div>
      ) : error ? (
        <div className="mt-8">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : workers.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title="No workers registered"
            description="Once a worker registers, their profile will appear here with income, platform and city details."
            action={
              <ButtonLink href="/register" size="md">
                Register the first worker
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Users}
              label="Registered workers"
              value={String(workers.length)}
              detail={`${cities} ${cities === 1 ? "city" : "cities"}`}
            />
            <MetricCard
              icon={BadgeIndianRupee}
              label="Average daily income"
              value={formatINR(Math.round(averageIncome))}
              detail="Declared daily take-home"
            />
            <MetricCard
              icon={Clock3}
              label="Average experience"
              value={formatExperience(Math.round(averageExperience))}
              detail="Across registered workers"
            />
            <MetricCard
              icon={Zap}
              label="Parametric Engine"
              value="Live"
              detail="Automated trigger simulation"
            />
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-navy">
                  Registered workers
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Estimates are read from this browser only.
                </p>
              </div>
              <span className="rounded-full bg-mist px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted">
                Read only
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-line bg-mist/70 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">
                      Worker
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Platform
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      City
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Daily income
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Experience
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Premium estimate
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {workers.map((worker) => {
                    const estimate = getSavedEstimate(worker.id);

                    return (
                      <tr
                        key={worker.id}
                        className="transition hover:bg-mist/50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-light text-xs font-semibold text-teal-dark"
                            >
                              {initials(worker.full_name)}
                            </span>
                            <div>
                              <p className="font-semibold text-navy">
                                {worker.full_name}
                              </p>
                              <p className="font-mono text-[0.68rem] text-muted">
                                {worker.id.slice(0, 8)}…
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <PlatformBadge platform={worker.platform} />
                        </td>
                        <td className="px-5 py-4 text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin
                              aria-hidden="true"
                              className="size-3.5 text-muted"
                            />
                            {worker.city}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-navy">
                          {formatINR(worker.average_daily_income)}
                        </td>
                        <td className="px-5 py-4 text-right text-muted">
                          {formatExperience(worker.experience_days)}
                        </td>
                        <td className="px-5 py-4">
                          {estimate ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                              <span className="size-1.5 rounded-full bg-success" />
                              {formatINR(estimate.estimate.final_weekly_premium, {
                                decimals: 2,
                              })}
                              /wk
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-pending/20 bg-pending/10 px-2.5 py-1 text-xs text-pending">
                              <span className="size-1.5 rounded-full bg-pending" />
                              Not calculated
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/dashboard/${worker.id}`}
                            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-teal hover:bg-teal-light hover:text-teal-dark"
                          >
                            Open
                            <ArrowRight
                              aria-hidden="true"
                              className="size-3"
                            />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disruption Trigger Simulator Demo Section */}
          <section className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="eyebrow flex items-center gap-1.5">
                  <Sparkles aria-hidden="true" className="size-3.5 text-teal" />
                  Admin Demo Panel
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-navy">
                  Simulate Parametric Disruption
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted max-w-xl">
                  Inject simulated environmental events (heavy rainfall, extreme heat, severe AQI spikes, floods, or curfew) into a target city.
                  When triggered, covered workers in that city receive auto-generated claims and instant payouts.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal-light/50 px-3 py-1 text-xs font-semibold text-teal-dark">
                POST /simulate/disruption
              </span>
            </div>

            <form onSubmit={handleSimulate} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* City */}
                <div>
                  <label
                    htmlFor="sim-city"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2"
                  >
                    Target City
                  </label>
                  <input
                    id="sim-city"
                    type="text"
                    value={simCity}
                    onChange={(e) => setSimCity(e.target.value)}
                    placeholder="e.g. Delhi, Bengaluru"
                    required
                    className="w-full rounded-xl border border-line bg-mist/50 px-3.5 py-2.5 text-sm font-medium text-navy placeholder:text-muted focus:border-teal focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Disruption Type */}
                <div>
                  <label
                    htmlFor="sim-type"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2"
                  >
                    Disruption Type
                  </label>
                  <select
                    id="sim-type"
                    value={simDisruption}
                    onChange={(e) =>
                      handleDisruptionChange(e.target.value as DisruptionType)
                    }
                    className="w-full rounded-xl border border-line bg-mist/50 px-3.5 py-2.5 text-sm font-medium text-navy focus:border-teal focus:bg-white focus:outline-none"
                  >
                    <option value="rain">Rain (mm)</option>
                    <option value="heat">Heat (°C)</option>
                    <option value="aqi">Air Quality (AQI)</option>
                    <option value="flood">Flood Alert (1)</option>
                    <option value="curfew">Curfew / Civic (1)</option>
                  </select>
                </div>

                {/* Disruption Value */}
                <div>
                  <label
                    htmlFor="sim-value"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2"
                  >
                    Value ({DISRUPTION_UNITS[simDisruption]?.unit ?? "units"})
                  </label>
                  <input
                    id="sim-value"
                    type="number"
                    step="any"
                    value={simValue}
                    onChange={(e) => setSimValue(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-line bg-mist/50 px-3.5 py-2.5 text-sm font-medium text-navy focus:border-teal focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Duration Hours */}
                <div>
                  <label
                    htmlFor="sim-duration"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2"
                  >
                    Duration (1–24 hrs)
                  </label>
                  <input
                    id="sim-duration"
                    type="number"
                    min="1"
                    max="24"
                    value={simDuration}
                    onChange={(e) => setSimDuration(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-line bg-mist/50 px-3.5 py-2.5 text-sm font-medium text-navy focus:border-teal focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Auto Approve Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  id="sim-auto-approve"
                  type="checkbox"
                  checked={simAutoApprove}
                  onChange={(e) => setSimAutoApprove(e.target.checked)}
                  className="size-4 rounded border-line text-teal focus:ring-teal"
                />
                <label
                  htmlFor="sim-auto-approve"
                  className="text-xs font-medium text-navy cursor-pointer select-none"
                >
                  Auto-approve triggered claims immediately (<code className="text-teal-dark font-mono">auto_approve=true</code>)
                </label>
              </div>

              {simError ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-xs text-danger flex items-start gap-2.5"
                >
                  <AlertCircle aria-hidden="true" className="size-4 shrink-0 mt-0.5" />
                  <span>{simError}</span>
                </div>
              ) : null}

              {simResult ? (
                <div
                  role="status"
                  className={`rounded-2xl border p-4 text-xs transition ${
                    simResult.triggered
                      ? "border-success/30 bg-success/5 text-navy"
                      : "border-warning/30 bg-warning/5 text-navy"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      aria-hidden="true"
                      className={`size-4 ${
                        simResult.triggered ? "text-success" : "text-warning"
                      }`}
                    />
                    <strong className="text-sm">
                      {simResult.triggered
                        ? "Disruption Threshold Triggered!"
                        : "Threshold Not Triggered"}
                    </strong>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-line/40 pt-3">
                    <div>
                      <span className="text-muted block">Severity Assessment</span>
                      <span className="font-semibold text-navy">
                        {simResult.severity_pct}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Claims Created</span>
                      <span className="font-semibold text-navy">
                        {simResult.claims_created}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Total Payout</span>
                      <span className="font-semibold text-success">
                        {formatINR(simResult.total_payout, { decimals: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Event Reference</span>
                      <span className="font-mono text-[0.7rem] text-muted">
                        {simResult.event_id ? simResult.event_id.slice(0, 10) + "…" : "None"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="pt-2">
                <Button type="submit" size="md" disabled={simulating}>
                  {simulating ? (
                    <>
                      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                      Simulating event…
                    </>
                  ) : (
                    <>
                      <Zap aria-hidden="true" className="size-4" />
                      Simulate Disruption Event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>

        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  pending = false,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
  pending?: boolean;
}) {
  return (
    <div
      className={
        pending
          ? "rounded-2xl border border-pending/20 bg-pending/5 p-5"
          : "rounded-2xl border border-line bg-white p-5 shadow-card"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <span
          className={
            pending
              ? "grid size-8 place-items-center rounded-xl bg-pending/10 text-pending"
              : "grid size-8 place-items-center rounded-xl bg-teal-light text-teal"
          }
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <p
        className={`mt-4 text-2xl font-semibold tracking-[-0.03em] ${
          pending ? "text-pending" : "text-navy"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}
