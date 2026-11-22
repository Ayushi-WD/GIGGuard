"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Hydrating worker policies, claims and payouts after profile loads. */

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { ClaimHistory } from "@/components/policy/claim-history";
import { PolicyPanel } from "@/components/policy/policy-panel";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  ErrorState,
  LoadingState,
} from "@/components/ui/feedback";
import {
  activatePolicy,
  ApiError,
  getWorkerClaims,
  getWorkerPayouts,
  getWorkerPolicies,
} from "@/lib/api";
import {
  getActiveWorkerId,
  getSavedEstimate,
  rememberWorker,
  type SavedEstimate,
} from "@/lib/storage";
import type {
  BackendClaim,
  BackendPayout,
  PolicyRecord,
} from "@/lib/types";
import { useAuth } from "@/lib/use-auth";
import { useWorkers } from "@/lib/use-worker";

export default function PolicyClaimsPage() {
  const { user, isLoggedIn, isAdmin, loading: authLoading } = useAuth();
  const { workers, loading: workersLoading, error: workersError, reload: reloadWorkers } =
    useWorkers();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [claims, setClaims] = useState<BackendClaim[]>([]);
  const [payouts, setPayouts] = useState<BackendPayout[]>([]);
  const [savedEstimate, setSavedEstimate] = useState<SavedEstimate | null>(null);

  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState(false);
  const [activating, setActivating] = useState(false);

  // Determine active worker ID
  useEffect(() => {
    if (user?.worker_id) {
      setSelectedId(user.worker_id);
      rememberWorker(user.worker_id);
    } else {
      const activeId = getActiveWorkerId();
      if (activeId && workers.some((w) => w.id === activeId)) {
        setSelectedId(activeId);
      } else if (workers.length > 0) {
        setSelectedId(workers[0].id);
      }
    }
  }, [workers, user]);

  const selectedWorker =
    workers.find((worker) => worker.id === selectedId) ?? workers[0] ?? null;

  // Load policies, claims, payouts, and saved estimate from API
  async function loadWorkerData(workerId: string) {
    setLoadingData(true);
    setDataError(null);
    setActivationError(null);

    try {
      const [policiesRes, claimsRes, payoutsRes] = await Promise.all([
        getWorkerPolicies(workerId),
        getWorkerClaims(workerId),
        getWorkerPayouts(workerId),
      ]);

      setPolicies(policiesRes);
      setClaims(claimsRes);
      setPayouts(payoutsRes);
      setSavedEstimate(getSavedEstimate(workerId));
    } catch (err) {
      setDataError(
        err instanceof ApiError
          ? err.message
          : "Failed to load policy and claims data.",
      );
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (!selectedWorker) {
      setPolicies([]);
      setClaims([]);
      setPayouts([]);
      setSavedEstimate(null);
      return;
    }

    loadWorkerData(selectedWorker.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorker?.id]);

  useEffect(() => {
    if (!justActivated) {
      return;
    }

    const timer = window.setTimeout(() => setJustActivated(false), 5000);
    return () => window.clearTimeout(timer);
  }, [justActivated]);

  function handleWorkerChange(workerId: string) {
    setSelectedId(workerId);
    rememberWorker(workerId);
    setJustActivated(false);
    setActivationError(null);
  }

  async function handleActivate() {
    if (!selectedWorker || !savedEstimate) {
      return;
    }

    setActivating(true);
    setActivationError(null);

    try {
      const premiumValue = Number(
        savedEstimate.estimate.final_weekly_premium,
      );
      const riskScoreValue = Number(savedEstimate.riskScore);

      await activatePolicy({
        worker_id: selectedWorker.id,
        premium: premiumValue,
        risk_score: riskScoreValue,
      });

      setJustActivated(true);
      await loadWorkerData(selectedWorker.id);
    } catch (err) {
      if (err instanceof ApiError) {
        setActivationError(err.message);
      } else {
        setActivationError(
          "Could not activate this policy. Please try again.",
        );
      }
    } finally {
      setActivating(false);
    }
  }

  if (authLoading || workersLoading) {
    return (
      <div className="page-container py-10 sm:py-16">
        <LoadingState label="Loading policy and protection status…" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <SignInPrompt
        title="Sign in to view your protection"
        description="View your active parametric insurance policy, automatically detected disruption claims, and payout history."
      >
        <ButtonLink href="/login?redirect=/policy" size="lg" className="w-full">
          Sign In
          <ArrowRight aria-hidden="true" className="size-4" />
        </ButtonLink>
        <ButtonLink href="/register" variant="secondary" className="w-full">
          Register new worker
        </ButtonLink>
      </SignInPrompt>
    );
  }

  if (workersError || !selectedWorker) {
    return (
      <div className="page-container py-10 sm:py-16">
        <ErrorState
          title="Could not load worker profile"
          message={workersError ?? "No worker found. Please register first."}
          onRetry={reloadWorkers}
        />
        <ButtonLink href="/register" variant="secondary" className="mt-4">
          Register worker profile
        </ButtonLink>
      </div>
    );
  }

  const activePolicy =
    policies.find((p) => p.status === "active") ?? null;

  return (
    <div className="page-container py-10 sm:py-14 space-y-8">
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Parametric protection"
        title="Disruptions, policies & claims."
        description="Zero-touch insurance: Our automated engine monitors weather, AQI, and civic events. Claims are created and paid automatically without filing paperwork."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadWorkerData(selectedWorker.id)}
              disabled={loadingData}
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-3.5 ${loadingData ? "animate-spin" : ""}`}
              />
              Refresh status
            </Button>
            <ButtonLink
              href={`/dashboard/${selectedWorker.id}`}
              variant="secondary"
              size="sm"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              Dashboard
            </ButtonLink>
          </div>
        }
      />

      {/* Admin / Multi-worker selector (if admin or user not tied to worker) */}
      {(isAdmin || !user?.worker_id) && workers.length > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <UserCheck aria-hidden="true" className="size-4 text-teal" />
            <span className="text-xs font-semibold text-navy">
              Viewing worker:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {workers.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => handleWorkerChange(w.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  w.id === selectedWorker.id
                    ? "bg-navy text-white"
                    : "bg-mist text-muted hover:bg-line"
                }`}
              >
                {w.full_name} ({w.city})
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Success banner on activation */}
      {justActivated ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm font-semibold text-success shadow-sm"
        >
          <Check aria-hidden="true" className="size-5 shrink-0" />
          <span>
            Weekly policy successfully activated for {selectedWorker.full_name}!
            Parametric cover is active for 7 days.
          </span>
        </div>
      ) : null}

      {dataError ? (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger flex items-start gap-3"
        >
          <AlertCircle aria-hidden="true" className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to fetch live status</p>
            <p className="mt-0.5 text-xs text-danger/80">{dataError}</p>
          </div>
        </div>
      ) : null}

      {/* Policy Status Panel */}
      <PolicyPanel
        worker={selectedWorker}
        policy={activePolicy}
        savedEstimate={savedEstimate}
        onActivate={handleActivate}
        activating={activating}
        error={activationError}
      />

      {/* Read-only Claims & Payouts Engine */}
      <ClaimHistory claims={claims} payouts={payouts} />
    </div>
  );
}
