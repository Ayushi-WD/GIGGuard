import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Check,
  CloudRain,
  FileWarning,
  Flame,
  Info,
  ListChecks,
  LockKeyhole,
  Wallet,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Disruptions & claims",
  description:
    "Disruption alerts, claim status and payout history are planned but not implemented in the GIG-Guard prototype.",
};

const planned = [
  {
    icon: BellRing,
    title: "Current disruption alerts",
    description: "A live view of disruptions near a worker's active zone.",
  },
  {
    icon: CloudRain,
    title: "Rainfall alerts",
    description: "Heavy-rain warnings that could pause deliveries.",
  },
  {
    icon: Flame,
    title: "Heat alerts",
    description: "Extreme-heat advisories that make outdoor work unsafe.",
  },
  {
    icon: FileWarning,
    title: "Report a disruption",
    description: "A worker-submitted report with date, location and hours lost.",
  },
  {
    icon: ListChecks,
    title: "Claim status",
    description: "Track a claim from submitted through review to a decision.",
  },
  {
    icon: BadgeCheck,
    title: "Approved claims",
    description: "A record of claims that passed verification.",
  },
  {
    icon: Wallet,
    title: "Payout history",
    description: "A ledger of support paid for approved claims.",
  },
];

export default function DisruptionsPage() {
  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow justify-center">
          <LockKeyhole aria-hidden="true" className="size-3.5" />
          Future module
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-navy sm:text-4xl">
          Disruption alerts and claims are coming soon.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          This page is a preview of the planned workflow. Trigger detection,
          fraud checks and payouts are not implemented, so nothing here can be
          filed, approved or paid today.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-3xl border border-pending/20 bg-white shadow-card">
        <div className="flex flex-col gap-4 bg-pending/10 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-pending ring-1 ring-pending/20">
              <LockKeyhole aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-pending/25 bg-white px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-pending">
                <span className="size-1.5 rounded-full bg-pending" />
                Coming soon
              </p>
              <h2 className="mt-2 text-lg font-semibold text-navy">
                No alert, claim or payout actions are active yet.
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                The buttons and forms that would normally appear here have been
                left out on purpose. They will return when the backend modules
                exist.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <h2 className="text-sm font-semibold text-navy">
            What this module will eventually include
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {planned.map((item) => (
              <li
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-line bg-mist/50 p-4"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-pending ring-1 ring-line">
                  <item.icon aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-navy">
                      {item.title}
                    </h3>
                    <span className="rounded-full bg-pending/10 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-pending">
                      Unavailable
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="flex items-start gap-2.5 text-xs leading-relaxed text-muted">
              <Info
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-warning"
              />
              <span>
                <strong className="text-navy">Why is this unavailable?</strong>{" "}
                GIG-Guard currently has worker registration and a premium
                estimate API. Disruption trigger detection, fraud detection and
                payout processing are separate modules that have not been built.
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-4xl rounded-3xl border border-line bg-white p-6 shadow-card sm:p-7">
        <p className="eyebrow">Available today</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-navy">
          Two things this prototype does well.
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            {
              title: "Register a worker profile",
              description:
                "Name, city, delivery platform, average daily income and experience.",
              href: "/register",
              action: "Register",
            },
            {
              title: "Estimate a weekly premium",
              description:
                "Choose a risk zone and working days, then review the full premium breakdown.",
              href: "/dashboard",
              action: "Open dashboard",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-line bg-mist/50 p-5"
            >
              <span className="inline-flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-success">
                <Check aria-hidden="true" className="size-3" />
                Working
              </span>
              <h3 className="mt-2 text-sm font-semibold text-navy">
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {item.description}
              </p>
              <ButtonLink
                href={item.href}
                variant="secondary"
                size="sm"
                className="mt-4"
              >
                {item.action}
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </ButtonLink>
            </div>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-5 max-w-4xl text-center text-xs leading-relaxed text-muted">
        GIG-Guard is a student prototype. It is not a licensed insurer and no
        premiums, policies or payouts are real.
      </p>
    </div>
  );
}
