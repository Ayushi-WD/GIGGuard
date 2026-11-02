"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This page reads the active worker id from client-only localStorage after mount. */

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  Clock3,
  Lock,
  LogIn,
  MapPin,
  Plus,
  Users,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PlatformBadge,
} from "@/components/ui/feedback";
import { formatExperience, formatINR, initials } from "@/lib/format";
import { getActiveWorkerId, rememberWorker } from "@/lib/storage";
import { useAuth } from "@/lib/use-auth";
import { useWorkers } from "@/lib/use-worker";

export default function DashboardHubPage() {
  const { user, isLoggedIn, isAdmin, loading: authLoading } = useAuth();
  const { workers, loading, error, reload } = useWorkers();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If logged in worker has worker_id, prioritize it
    if (user?.worker_id) {
      setActiveId(user.worker_id);
      rememberWorker(user.worker_id);
    } else {
      setActiveId(getActiveWorkerId());
    }
    setReady(true);
  }, [user]);

  if (authLoading) {
    return (
      <div className="page-container flex min-h-[50vh] items-center justify-center">
        <LoadingState label="Checking authorization..." />
      </div>
    );
  }

  // Not logged in: Show sign in prompt
  if (!isLoggedIn) {
    return (
      <div className="page-container py-16 sm:py-24">
        <div className="mx-auto max-w-md rounded-3xl border border-ink/10 bg-paper p-8 text-center shadow-soft">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-forest-light text-forest">
            <Lock aria-hidden="true" className="size-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
            Sign in to view your dashboard
          </h1>
          <p className="mt-2 text-sm text-muted">
            Please log in with your worker account or sign up to view and manage your income protection and weekly claims.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <ButtonLink href="/login" size="lg" className="w-full">
              <LogIn aria-hidden="true" className="size-4" />
              Log in to account
            </ButtonLink>
            <ButtonLink href="/login?tab=signup" variant="secondary" className="w-full">
              New user? Sign up here
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const activeWorker = workers.find((worker) => worker.id === activeId) ?? null;

  return (
    <div className="page-container py-10 sm:py-16">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">
            <Users aria-hidden="true" className="size-3.5" />
            Worker dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Pick up where you left off.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Open your saved worker profile to see your details, weekly premium
            and cover.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <ButtonLink href="/admin" variant="secondary" size="md">
              Admin console
            </ButtonLink>
          ) : null}
          <ButtonLink href="/login?tab=signup" variant="secondary" size="md">
            <Plus aria-hidden="true" className="size-4" />
            Add worker
          </ButtonLink>
        </div>
      </div>

      {loading || !ready ? (
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
            description="Register your first worker profile to unlock the dashboard, premium calculator and weekly cover."
            action={
              <ButtonLink href="/login?tab=signup" size="md">
                Register as a worker
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <>
          {activeWorker ? (
            <section className="relative mt-10 overflow-hidden rounded-[2rem] bg-forest p-6 text-cream shadow-soft sm:p-8">
              <div className="bg-grid-lines pointer-events-none absolute inset-0 opacity-50" />
              <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <span className="grid size-14 place-items-center rounded-2xl bg-lime text-lg font-semibold text-forest-dark">
                    {initials(activeWorker.full_name)}
                  </span>
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-lime">
                      Current profile
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {activeWorker.full_name}
                    </p>
                    <p className="mt-1 text-sm text-cream/55">
                      {activeWorker.city} · {activeWorker.platform}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/${activeWorker.id}`}
                  onClick={() => rememberWorker(activeWorker.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-semibold text-ink transition hover:bg-lime/85"
                >
                  Open my dashboard
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </section>
          ) : null}

          <div className="mt-10 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              {workers.length} registered{" "}
              {workers.length === 1 ? "profile" : "profiles"}
            </h2>
            {isAdmin ? (
              <Link
                href="/admin"
                className="text-xs font-semibold text-forest hover:underline"
              >
                View admin overview
              </Link>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workers.map((worker) => {
              const active = worker.id === activeId;
              return (
                <Link
                  key={worker.id}
                  href={`/dashboard/${worker.id}`}
                  onClick={() => rememberWorker(worker.id)}
                  className="card-surface group relative p-5 transition duration-300 hover:-translate-y-1 hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-forest-light text-sm font-semibold text-forest">
                      {initials(worker.full_name)}
                    </span>
                    <div className="flex items-center gap-2">
                      {active ? (
                        <span className="rounded-full bg-lime-soft px-2.5 py-1 text-[0.65rem] font-semibold text-forest-dark">
                          Active
                        </span>
                      ) : null}
                      <PlatformBadge platform={worker.platform} />
                    </div>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold tracking-tight">
                    {worker.full_name}
                  </h3>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
                    <MapPin aria-hidden="true" className="size-3.5" />
                    {worker.city}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4">
                    <div>
                      <p className="inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">
                        <BadgeIndianRupee
                          aria-hidden="true"
                          className="size-3"
                        />
                        Daily
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatINR(worker.average_daily_income)}
                      </p>
                    </div>
                    <div>
                      <p className="inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">
                        <Clock3 aria-hidden="true" className="size-3" />
                        Experience
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatExperience(worker.experience_days)}
                      </p>
                    </div>
                  </div>

                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-forest">
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
        </>
      )}
    </div>
  );
}
