"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This page hydrates client-only localStorage records after mount. */

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { Button, ButtonLink } from "@/components/ui/button";
import { DISRUPTION_META } from "@/lib/disruptions";
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
import { useAuth } from "@/lib/use-auth";
import { useWorkers } from "@/lib/use-worker";

type Tab = "workers" | "claims";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoggedIn, isAdmin, loading: authLoading, logout } = useAuth();
  const { workers, loading, error, reload } = useWorkers();
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [tab, setTab] = useState<Tab>("workers");

  useEffect(() => {
    setClaims(getAllClaims());
    setPolicies(getAllPolicies());
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

  if (authLoading) {
    return (
      <div className="page-container flex min-h-[50vh] items-center justify-center">
        <LoadingState label="Verifying admin credentials..." />
      </div>
    );
  }

  // Not logged in: Show Admin Authentication Required screen
  if (!isLoggedIn) {
    return (
      <SignInPrompt
        title="Admin login required"
        description="The Admin dashboard is only accessible to administrators. Please log in with the administrator account to continue."
      >
        <div className="rounded-2xl border border-forest/20 bg-forest-light/60 p-3 text-left">
          <p className="text-xs font-semibold text-forest">
            Default Admin Credentials
          </p>
          <p className="mt-1 text-xs text-forest/80">
            Username: <code className="font-semibold text-ink">admin</code>{" "}
            &nbsp;|&nbsp; Password:{" "}
            <code className="font-semibold text-ink">admin123</code>
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

  // Logged in as Worker: Access Denied for Admin portal
  if (!isAdmin) {
    return (
      <SignInPrompt
        tone="danger"
        icon={ShieldAlert}
        title="Admin Access Only"
        description={
          <>
            You are logged in as{" "}
            <strong className="text-ink">
              {user?.full_name || user?.username}
            </strong>{" "}
            (Worker). The Admin console is restricted to administrators only.
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
  const cities = new Set(workers.map((worker) => worker.city.toLowerCase())).size;
  const openClaims = claims.filter(
    (claim) => claim.status === "Under review",
  ).length;

  return (
    <div className="page-container py-10 sm:py-16">
      <PageHeader
        icon={Activity}
        eyebrow="Admin console"
        title="Portfolio at a glance."
        description="Worker profiles come from the FastAPI backend. Policies and claims below are local prototype records from this browser."
        actions={
          <>
            <Button variant="secondary" size="md" onClick={reload}>
              <RefreshCw aria-hidden="true" className="size-4" />
              Refresh workers
            </Button>
            <ButtonLink href="/login?tab=signup" size="md">
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
              <ButtonLink href="/login?tab=signup" size="md">
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
              icon={ShieldCheck}
              label="Active policies"
              value={String(policies.length)}
              detail="Weekly income cover in place"
            />
            <MetricCard
              icon={CircleAlert}
              label="Claims to review"
              value={String(openClaims)}
              detail={`${claims.length} total claims on record`}
              accent={openClaims > 0}
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("workers")}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  tab === "workers"
                    ? "bg-ink text-cream"
                    : "bg-paper text-muted hover:text-ink",
                )}
              >
                Workers ({workers.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("claims")}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  tab === "claims"
                    ? "bg-ink text-cream"
                    : "bg-paper text-muted hover:text-ink",
                )}
              >
                Claims ({claims.length})
                {openClaims > 0 ? (
                  <span className="ml-1.5 inline-grid size-4 place-items-center rounded-full bg-heat text-[9px] text-cream">
                    {openClaims}
                  </span>
                ) : null}
              </button>
            </div>

            {claims.length === 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={loadDemoClaims}
                disabled={workers.length === 0}
              >
                <Sparkles aria-hidden="true" className="size-3.5" />
                Seed demo claims
              </Button>
            )}
          </div>

          {tab === "workers" ? (
            <div className="mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-ink/10 bg-cream/40 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
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
                        Policy status
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {workers.map((worker) => {
                      const policy = policies.find(
                        (item) => item.workerId === worker.id,
                      );

                      return (
                        <tr
                          key={worker.id}
                          className="transition hover:bg-cream/40"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span
                                aria-hidden="true"
                                className="grid size-9 shrink-0 place-items-center rounded-xl bg-forest-light text-xs font-semibold text-forest"
                              >
                                {initials(worker.full_name)}
                              </span>
                              <div>
                                <p className="font-semibold">{worker.full_name}</p>
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
                          <td className="px-5 py-4 text-right font-medium">
                            {formatINR(worker.average_daily_income)}
                          </td>
                          <td className="px-5 py-4 text-right text-muted">
                            {formatExperience(worker.experience_days)}
                          </td>
                          <td className="px-5 py-4">
                            {policy ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 bg-forest-light px-2.5 py-1 text-xs font-medium text-forest">
                                <span className="status-dot" />
                                Active (₹{policy.premium}/wk)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-cream/40 px-2.5 py-1 text-xs text-muted">
                                Not insured
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/dashboard/${worker.id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-forest hover:bg-forest-light hover:text-forest"
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
          ) : (
            <div className="mt-6 space-y-3">
              {claims.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No claims filed yet"
                  description="When weather disruptions strike, delivery partners file claims here. You can also load demo data to try the review workflow."
                  action={
                    <Button
                      variant="primary"
                      size="md"
                      onClick={loadDemoClaims}
                      disabled={workers.length === 0}
                    >
                      <Sparkles aria-hidden="true" className="size-4" />
                      Seed demo claims
                    </Button>
                  }
                />
              ) : (
                claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex flex-col gap-4 rounded-3xl border border-ink/10 bg-paper p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <ClaimStatusBadge status={claim.status} />
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            DISRUPTION_META[claim.disruption].tone,
                          )}
                        >
                          {claim.disruption}
                        </span>
                        <PlatformBadge platform={claim.platform} />
                        <span className="text-xs text-muted">
                          Incident date: {formatDate(claim.incidentDate)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold sm:text-base">
                        {claim.workerName}{" "}
                        <span className="font-normal text-muted">
                          in {claim.city} • {claim.hoursLost} hours lost
                        </span>
                      </p>
                      <p className="text-xs text-muted">{claim.description}</p>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-4 border-t border-ink/10 pt-3 sm:border-0 sm:pt-0">
                      <div className="text-right sm:pr-2">
                        <p className="text-[0.65rem] uppercase tracking-wider text-muted">
                          Estimated payout
                        </p>
                        <p className="text-lg font-semibold text-forest">
                          {formatINR(claim.payout)}
                        </p>
                      </div>

                      {claim.status === "Under review" ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatus(claim.id, "Approved")}
                            className="inline-flex items-center gap-1 rounded-full border border-forest/30 bg-forest-light px-3 py-1.5 text-xs font-semibold text-forest transition hover:bg-forest hover:text-cream"
                          >
                            <Check aria-hidden="true" className="size-3" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatus(claim.id, "Rejected")}
                            className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger hover:text-white"
                          >
                            <X aria-hidden="true" className="size-3" />
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
