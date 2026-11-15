"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Saved estimates live in browser storage and are read after the worker loads. */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  CalendarDays,
  Check,
  Clock3,
  Info,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import {
  ErrorState,
  LoadingState,
  PlatformBadge,
} from "@/components/ui/feedback";
import {
  formatDate,
  formatExperience,
  formatINR,
  firstName,
  initials,
} from "@/lib/format";
import { getSavedEstimate, type SavedEstimate } from "@/lib/storage";
import { LOCATION_RISK_COPY, type LocationRisk } from "@/lib/types";
import { useWorker } from "@/lib/use-worker";

const steps = [
  {
    number: "01",
    title: "Register your worker profile",
    description:
      "Name, city, delivery platform, average daily income and experience.",
  },
  {
    number: "02",
    title: "Assess environmental and location risks",
    description:
      "Choose a risk zone. A risk score is derived from that zone and used for pricing.",
  },
  {
    number: "03",
    title: "Calculate your estimated premium",
    description:
      "Base premium, risk loading, location and experience adjustments, capped at ₹99.",
  },
  {
    number: "04",
    title: "Verify covered disruptions and process support",
    description:
      "Proposed workflow. Trigger detection, fraud checks and payouts are not implemented yet.",
    proposed: true,
  },
];

const riskStyles: Record<
  LocationRisk,
  { className: string; dot: string }
> = {
  low: {
    className: "border-success/20 bg-success/10 text-success",
    dot: "bg-success",
  },
  medium: {
    className: "border-warning/20 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  high: {
    className: "border-danger/20 bg-danger/10 text-danger",
    dot: "bg-danger",
  },
};

export default function WorkerDashboardPage() {
  const params = useParams<{ workerId: string }>();
  const workerId = params.workerId;
  const { worker, loading, error, reload } = useWorker(workerId);
  const [savedEstimate, setSavedEstimate] = useState<SavedEstimate | null>(
    null,
  );

  useEffect(() => {
    if (!worker) {
      return;
    }
    setSavedEstimate(getSavedEstimate(worker.id));
  }, [worker]);

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

  const risk = savedEstimate?.locationRisk ?? null;
  const riskCopy = risk ? LOCATION_RISK_COPY[risk] : null;
  const premium = savedEstimate
    ? Number(savedEstimate.estimate.final_weekly_premium)
    : null;

  return (
    <div className="page-container py-10 sm:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-teal/10 blur-2xl"
        />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy text-lg font-semibold text-white">
              {initials(worker.full_name)}
            </span>
            <div>
              <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-teal">
                <span className="size-1.5 rounded-full bg-teal" />
                Worker dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
                Welcome back, {firstName(worker.full_name)}!
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Here&apos;s an overview of your GIG-Guard account.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={worker.platform} />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-mist px-3 py-1.5 text-xs font-medium text-muted">
              <MapPin aria-hidden="true" className="size-3.5" />
              {worker.city}
            </span>
          </div>
        </div>
      </section>

      <section
        aria-label="Account overview"
        className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <OverviewCard
          icon={UserRound}
          label="Profile status"
          value="Registered"
          detail={`${worker.city} · ${worker.platform}`}
          status="success"
          href="#profile"
        />
        <OverviewCard
          icon={Activity}
          label="Risk level"
          value={riskCopy ? riskCopy.label : "Not assessed"}
          detail={
            savedEstimate
              ? `Risk score ${savedEstimate.riskScore.toFixed(0)} / 100`
              : "Calculate a premium to set a risk zone"
          }
          status={risk ?? "pending"}
          href={`/dashboard/${worker.id}/premium`}
        />
        <OverviewCard
          icon={BadgeIndianRupee}
          label="Weekly premium"
          value={premium === null ? "Not calculated" : formatINR(premium, { decimals: 2 })}
          detail={
            premium === null
              ? "Estimate based on your profile"
              : "Estimated weekly premium · not a policy"
          }
          status={premium === null ? "pending" : "success"}
          href={`/dashboard/${worker.id}/premium`}
        />
        <OverviewCard
          icon={ShieldCheck}
          label="Protection status"
          value="Coming soon"
          detail="Trigger detection and payouts are not built yet"
          status="pending"
          href="/policy"
        />
      </section>

      <section className="relative mt-5 overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-soft sm:p-8">
        <div className="bg-grid-lines pointer-events-none absolute inset-0 opacity-40" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full border-[38px] border-teal/20"
        />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-teal-light">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Premium estimation
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Calculate Your Weekly Premium
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Get an estimated weekly premium based on your worker profile and
              risk assessment.
            </p>
            {premium !== null ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/75">
                Latest estimate
                <span className="font-semibold text-white">
                  {formatINR(premium, { decimals: 2 })} / week
                </span>
              </p>
            ) : null}
          </div>

          <ButtonLink
            href={`/dashboard/${worker.id}/premium`}
            variant="lime"
            size="lg"
            className="shrink-0"
          >
            Calculate Premium
            <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        </div>
      </section>

      <section id="profile" className="mt-5 scroll-mt-24 card-surface p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">My profile</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-navy">
              Worker profile summary
            </h2>
          </div>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            Member since {formatDate(worker.created_at)}
          </p>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileItem
            icon={UserRound}
            label="Name"
            value={worker.full_name}
          />
          <ProfileItem icon={MapPin} label="City" value={worker.city} />
          <ProfileItem
            icon={Store}
            label="Delivery platform"
            value={worker.platform}
          />
          <ProfileItem
            icon={BadgeIndianRupee}
            label="Average daily income"
            value={`${formatINR(worker.average_daily_income)} / day`}
          />
          <ProfileItem
            icon={Clock3}
            label="Experience"
            value={formatExperience(worker.experience_days)}
          />
          <ProfileItem
            icon={Check}
            label="Profile status"
            value="Active worker profile"
            tone="success"
          />
        </dl>
      </section>

      <section className="mt-5 card-surface p-6 sm:p-8">
        <p className="eyebrow">How GIG-Guard works</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-navy">
          Four steps, one honest prototype.
        </h2>

        <ol className="mt-6 grid gap-3 lg:grid-cols-4">
          {steps.map((step) => (
            <li
              key={step.number}
              className="relative rounded-2xl border border-line bg-mist/60 p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-white font-mono text-[0.7rem] font-semibold text-teal ring-1 ring-line">
                  {step.number}
                </span>
                {step.proposed ? (
                  <span className="rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-warning">
                    Proposed
                  </span>
                ) : null}
              </div>
              <h3 className="mt-4 text-sm font-semibold leading-snug text-navy">
                {step.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pending/10 text-pending">
              <LockKeyhole aria-hidden="true" className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">
                Disruption alerts &amp; claims are coming soon
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                Weather triggers, claim status and payout history are not active
                in this prototype.
              </p>
            </div>
          </div>
          <Link
            href="/policy"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal hover:underline"
          >
            See what is planned
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      </section>

      <p className="mt-5 flex items-start gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-xs leading-relaxed text-muted">
        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-teal" />
        Your weekly premium is an estimate, not proof that an insurance policy
        has been issued. This prototype does not read live weather or AQI data
        and does not process payments or payouts.
      </p>
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  label,
  value,
  detail,
  status,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  status: LocationRisk | "success" | "pending";
  href: string;
}) {
  const tone =
    status === "success"
      ? { className: "border-success/20 bg-success/10 text-success", dot: "bg-success" }
      : status === "pending"
        ? {
            className: "border-pending/20 bg-pending/10 text-pending",
            dot: "bg-pending",
          }
        : riskStyles[status];

  return (
    <Link
      href={href}
      className="card-surface group flex flex-col justify-between p-5 transition duration-200 hover:-translate-y-0.5 hover:border-teal/25 hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-teal-light text-teal">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold ${tone.className}`}
        >
          <span className={`size-1.5 rounded-full ${tone.dot}`} />
          {status === "success"
            ? "Good"
            : status === "pending"
              ? "Pending"
              : LOCATION_RISK_COPY[status].short}
        </span>
      </div>
      <div className="mt-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <p className="mt-1.5 text-lg font-semibold tracking-tight text-navy">
          {value}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-[0.68rem] font-semibold text-teal opacity-0 transition group-hover:opacity-100">
        Open
        <ArrowRight aria-hidden="true" className="size-3" />
      </span>
    </Link>
  );
}

function ProfileItem({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div className="rounded-xl border border-line bg-mist/60 p-4">
      <dt className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">
        <Icon aria-hidden="true" className="size-3.5" />
        {label}
      </dt>
      <dd
        className={`mt-1.5 text-sm font-semibold ${
          tone === "success" ? "text-success" : "text-navy"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
