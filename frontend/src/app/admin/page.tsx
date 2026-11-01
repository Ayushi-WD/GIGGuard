"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This page hydrates client-only localStorage records after mount. */

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BadgeIndianRupee,
  Check,
  CircleAlert,
  FileText,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
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
  formatDate,
  formatExperience,
  formatINR,
  initials,
} from "@/lib/format";
import {
  getAllClaims,
  getAllPolicies,
  seedDemoClaims,
  updateClaimStatus,
  type ClaimRecord,
  type ClaimStatus,
  type PolicyRecord,
} from "@/lib/storage";
import { useWorkers } from "@/lib/use-worker";

type Tab = "workers" | "claims";

const disruptionTone = {
  Rain: "bg-rain/10 text-rain",
  Heat: "bg-heat/10 text-heat",
  Pollution: "bg-smog/10 text-smog",
};

export default function AdminPage() {
  const { workers, loading, error, reload } = useWorkers();
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [tab, setTab] = useState<Tab>("workers");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setClaims(getAllClaims());
    setPolicies(getAllPolicies());
    setReady(true);
  }, []);

  function handleStatus(claimId: string, status: ClaimStatus) {
    updateClaimStatus(claimId, status);
    setClaims(getAllClaims());
  }

  function loadDemoClaims() {
    seedDemoClaims(workers);
    setClaims(getAllClaims());
    setTab("claims");
  }

  const averageIncome =
    workers.length > 0
      ? workers.reduce(
          (total, worker) => total + Number(worker.average_daily_income),
          0,
        ) / workers.length
      : 0;
  const cities = new Set(workers.map((worker) => worker.city.toLowerCase())).size;
  const openClaims = claims.filter(
    (claim) => claim.status === "Under review",
  ).length;

  return (
    <div className="page-container py-10 sm:py-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">
            <Activity aria-hidden="true" className="size-3.5" />
            Admin console
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Portfolio at a glance.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Worker profiles come from the FastAPI backend. Policies and claims
            below are local prototype records from this browser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="md" onClick={reload}>
            <RefreshCw aria-hidden="true" className="size-4" />
            Refresh workers
          </Button>
          <ButtonLink href="/register" size="md">
            Add worker
            <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        </div>
      </div>

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
              value={formatINR(averageIncome)}
              detail="Across all profiles"
            />
            <MetricCard
              icon={ShieldCheck}
              label="Active policies"
              value={String(policies.length)}
              detail="Local prototype records"
            />
            <MetricCard
              icon={FileText}
              label="Open claims"
              value={String(openClaims)}
              detail={`${claims.length} total claims`}
              accent={openClaims > 0}
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Admin sections"
              className="inline-flex rounded-full border border-ink/10 bg-paper p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "workers"}
                onClick={() => setTab("workers")}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  tab === "workers"
                    ? "bg-forest text-cream"
                    : "text-muted hover:text-ink",
                )}
              >
                Workers · {workers.length}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "claims"}
                onClick={() => setTab("claims")}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  tab === "claims"
                    ? "bg-forest text-cream"
                    : "text-muted hover:text-ink",
                )}
              >
                Claims · {claims.length}
              </button>
            </div>

            {tab === "claims" && claims.length > 0 ? (
              <p className="text-xs text-muted">
                {openClaims} awaiting review · stored in this browser
              </p>
            ) : null}
          </div>

          {tab === "workers" ? (
            <section className="mt-4 card-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[54rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink/10 bg-cream/50 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                      <th scope="col" className="px-5 py-3.5">
                        Worker
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Platform
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        City
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Daily income
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Experience
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Joined
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {workers.map((worker) => (
                      <tr
                        key={worker.id}
                        className="transition hover:bg-cream/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 place-items-center rounded-xl bg-forest-light text-xs font-semibold text-forest">
                              {initials(worker.full_name)}
                            </span>
                            <div>
                              <p className="font-semibold text-ink">
                                {worker.full_name}
                              </p>
                              <p className="mt-0.5 font-mono text-[0.62rem] text-muted">
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
                            <MapPin aria-hidden="true" className="size-3.5" />
                            {worker.city}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {formatINR(worker.average_daily_income)}
                        </td>
                        <td className="px-5 py-4 text-muted">
                          {formatExperience(worker.experience_days)}
                        </td>
                        <td className="px-5 py-4 text-muted">
                          {formatDate(worker.created_at)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/dashboard/${worker.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
                          >
                            Open
                            <ArrowRight
                              aria-hidden="true"
                              className="size-3.5"
                            />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="mt-4">
              {claims.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No claims in the queue"
                  description="File a claim from the policy page, or load sample claims to preview the admin review flow."
                  action={
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={loadDemoClaims}
                    >
                      <Sparkles aria-hidden="true" className="size-4" />
                      Load sample claims
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {claims.map((claim) => (
                    <article
                      key={claim.id}
                      className="card-surface p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "grid size-10 shrink-0 place-items-center rounded-xl text-xs font-semibold",
                              disruptionTone[claim.disruption],
                            )}
                          >
                            {initials(claim.workerName)}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold">
                                {claim.workerName}
                              </p>
                              <PlatformBadge platform={claim.platform} />
                              <ClaimStatusBadge status={claim.status} />
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              {claim.disruption} ·{" "}
                              {formatDate(claim.incidentDate)} ·{" "}
                              {claim.hoursLost} hours lost · {claim.city}
                            </p>
                            {claim.description ? (
                              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
                                {claim.description}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                          <div className="text-right">
                            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted">
                              Indicative payout
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                              {formatINR(claim.payout, { decimals: 2 })}
                            </p>
                          </div>
                          {claim.status === "Under review" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatus(claim.id, "Approved")
                                }
                              >
                                <Check
                                  aria-hidden="true"
                                  className="size-3.5"
                                />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  handleStatus(claim.id, "Rejected")
                                }
                              >
                                <X aria-hidden="true" className="size-3.5" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">
                              Reviewed
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}

                  <div className="flex items-start gap-2 rounded-2xl border border-heat/20 bg-heat/5 p-4 text-xs leading-relaxed text-muted">
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-heat"
                    />
                    <p>
                      This queue is a frontend prototype. Approving or rejecting
                      a claim updates local browser storage only; no payout is
                      triggered and no backend record is changed.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-xs text-muted sm:flex-row sm:items-center">
            <p>
              Workers: <span className="font-semibold text-ink">GET /workers</span>{" "}
              · Policies and claims:{" "}
              <span className="font-semibold text-ink">local browser storage</span>
            </p>
            {ready ? (
              <p>
                {claims.length} claim{claims.length === 1 ? "" : "s"} ·{" "}
                {policies.length} polic{policies.length === 1 ? "y" : "ies"} on
                this device
              </p>
            ) : null}
          </div>
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
  accent = false,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-5",
        accent
          ? "border-heat/20 bg-heat/5"
          : "border-ink/10 bg-paper shadow-card",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <span
          className={cn(
            "grid size-8 place-items-center rounded-xl",
            accent
              ? "bg-heat/10 text-heat"
              : "bg-forest-light text-forest",
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}
