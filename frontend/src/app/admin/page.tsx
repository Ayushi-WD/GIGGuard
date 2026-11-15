"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BadgeIndianRupee,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Users,
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
import {
  formatExperience,
  formatINR,
  initials,
} from "@/lib/format";
import { getSavedEstimate } from "@/lib/storage";
import { useAuth } from "@/lib/use-auth";
import { useWorkers } from "@/lib/use-worker";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoggedIn, isAdmin, loading: authLoading, logout } = useAuth();
  const { workers, loading, error, reload } = useWorkers();

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
              icon={ShieldAlert}
              label="Claims & payouts"
              value="Coming soon"
              detail="Not implemented in this prototype"
              pending
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

          <div className="mt-4 rounded-2xl border border-pending/20 bg-pending/5 px-4 py-3 text-xs leading-relaxed text-muted">
            <strong className="text-navy">Claims and payouts:</strong> the admin
            review workflow is not implemented. No approve, reject or payout
            action is available.
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
