"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This page hydrates client-only policies, estimates and claims after the worker list loads. */

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  FileText,
  Info,
  LogIn,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { CoverageGrid } from "@/components/coverage-grid";
import { PageHeader } from "@/components/page-header";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { WorkerPicker } from "@/components/worker-picker";
import { ClaimForm } from "@/components/policy/claim-form";
import { ClaimHistory } from "@/components/policy/claim-history";
import { PolicyPanel } from "@/components/policy/policy-panel";
import { ButtonLink } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PlatformBadge,
} from "@/components/ui/feedback";
import { formatINR, initials } from "@/lib/format";
import {
  activatePolicy,
  getActiveWorkerId,
  getClaimsForWorker,
  getPolicy,
  getSavedEstimate,
  rememberWorker,
  type ClaimRecord,
  type PolicyRecord,
  type SavedEstimate,
} from "@/lib/storage";
import { useAuth } from "@/lib/use-auth";
import { useWorkers } from "@/lib/use-worker";

export default function PolicyPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const { workers, loading, error, reload } = useWorkers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [savedEstimate, setSavedEstimate] = useState<SavedEstimate | null>(
    null,
  );
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [justActivated, setJustActivated] = useState(false);

  const selectedWorker =
    workers.find((worker) => worker.id === selectedId) ?? workers[0] ?? null;

  useEffect(() => {
    if (user?.worker_id) {
      setSelectedId(user.worker_id);
      return;
    }

    const activeId = getActiveWorkerId();
    if (activeId) {
      setSelectedId(activeId);
    } else if (workers.length > 0) {
      setSelectedId(workers[0].id);
    }
  }, [workers, user]);

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
  }

  function handleActivate() {
    if (!selectedWorker || !savedEstimate) {
      return;
    }

    setPolicy(activatePolicy(selectedWorker, savedEstimate));
    setJustActivated(true);
    rememberWorker(selectedWorker.id);
  }

  if (authLoading) {
    return (
      <div className="page-container py-10 sm:py-16">
        <LoadingState label="Checking authorization…" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <SignInPrompt
        icon={LogIn}
        title="Sign in to view Policy & Claims"
        description="Please log in with your worker account to view your weekly policy, check active coverage, and file weather disruption claims."
      >
        <ButtonLink href="/login" size="lg" className="w-full">
          <LogIn aria-hidden="true" className="size-4" />
          Log in to account
        </ButtonLink>
        <ButtonLink
          href="/login?tab=signup"
          variant="secondary"
          className="w-full"
        >
          New user? Sign up here
        </ButtonLink>
      </SignInPrompt>
    );
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
        <PageHeader
          icon={FileText}
          eyebrow="Policy & claims"
          title="Cover, claims, and peace of mind."
        />
        <div className="mt-8">
          <EmptyState
            icon={ShieldCheck}
            title="Register a worker first"
            description="Policies are linked to a worker profile. Create a profile, calculate a premium, and your weekly cover will show up here."
            action={
              <ButtonLink href="/login?tab=signup" size="md">
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

  return (
    <div className="page-container py-10 sm:py-16">
      <PageHeader
        icon={FileText}
        eyebrow="Policy & claims"
        title="Cover, claims, and peace of mind."
        description="See your weekly policy, check what is covered, and file a claim when a disruption costs you working hours."
        actions={
          <WorkerPicker
            workers={workers}
            value={selectedWorker.id}
            onChange={handleWorkerChange}
          />
        }
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <PolicyPanel
          worker={selectedWorker}
          policy={policy}
          savedEstimate={savedEstimate}
          onActivate={handleActivate}
        />

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

        <CoverageGrid />

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
        <ClaimForm
          key={selectedWorker.id}
          worker={selectedWorker}
          policy={policy}
          savedEstimate={savedEstimate}
          onActivate={handleActivate}
          onFiled={setClaims}
        />
        <ClaimHistory claims={claims} />
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
          Back to worker dashboard
        </Link>
      </div>
    </div>
  );
}
