"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  Clock3,
  MapPin,
  Plus,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PlatformBadge,
} from "@/components/ui/feedback";
import { cn, formatExperience, formatINR, initials } from "@/lib/format";
import { getActiveWorkerId } from "@/lib/storage";
import { useAuth } from "@/lib/use-auth";
import { useWorkers } from "@/lib/use-worker";

export default function DashboardHubPage() {
  const { user } = useAuth();
  const { workers, loading, error, reload } = useWorkers();

  const activeId = user?.worker_id ?? getActiveWorkerId();
  const orderedWorkers = [...workers].sort((a, b) => {
    if (a.id === activeId) return -1;
    if (b.id === activeId) return 1;
    return 0;
  });

  return (
    <div className="page-container py-10 sm:py-16">
      <PageHeader
        icon={Users}
        eyebrow="Worker dashboard"
        title="Worker profiles."
        description="Pick a saved worker profile to see its dashboard, profile summary and premium estimate."
        actions={
          <ButtonLink href="/register" size="md">
            <Plus aria-hidden="true" className="size-4" />
            Register worker
          </ButtonLink>
        }
      />

      {loading ? (
        <div className="mt-10">
          <LoadingState label="Loading worker profiles…" />
        </div>
      ) : error ? (
        <div className="mt-10">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : workers.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Users}
            title="No worker profiles yet"
            description="Register your first worker profile to unlock the dashboard and premium calculator."
            action={
              <ButtonLink href="/register" size="md">
                Register as a worker
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orderedWorkers.map((worker) => {
              const active = worker.id === activeId;
              return (
                <Link
                  key={worker.id}
                  href={`/dashboard/${worker.id}`}
                  className={cn(
                    "group relative rounded-2xl border bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft",
                    active
                      ? "border-teal/40 ring-1 ring-teal/10"
                      : "border-line hover:border-teal/25",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-teal-light text-sm font-semibold text-teal-dark">
                      {initials(worker.full_name)}
                    </span>
                    <div className="flex items-center gap-2">
                      {active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[0.6rem] font-semibold text-success">
                          <span className="size-1.5 rounded-full bg-success" />
                          Current
                        </span>
                      ) : null}
                      <PlatformBadge platform={worker.platform} />
                    </div>
                  </div>

                  <h2 className="mt-4 text-lg font-semibold tracking-tight text-navy">
                    {worker.full_name}
                  </h2>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
                    <MapPin aria-hidden="true" className="size-3.5" />
                    {worker.city}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
                    <div>
                      <p className="inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">
                        <BadgeIndianRupee
                          aria-hidden="true"
                          className="size-3"
                        />
                        Daily
                      </p>
                      <p className="mt-1 text-sm font-semibold text-navy">
                        {formatINR(worker.average_daily_income)}
                      </p>
                    </div>
                    <div>
                      <p className="inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">
                        <Clock3 aria-hidden="true" className="size-3" />
                        Experience
                      </p>
                      <p className="mt-1 text-sm font-semibold text-navy">
                        {formatExperience(worker.experience_days)}
                      </p>
                    </div>
                  </div>

                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-teal">
                    Open dashboard
                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              );
            })}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            Profiles come from the GIG-Guard API. Premium estimates are stored
            in this browser. No policy, payment or payout is created.
          </p>
        </>
      )}
    </div>
  );
}
