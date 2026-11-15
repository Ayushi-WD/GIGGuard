import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeIndianRupee,
  Check,
  CloudRain,
  Info,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Income protection for gig workers",
  description:
    "GIG-Guard helps gig delivery workers understand and estimate protection against income lost to rain, heat, floods and other external disruptions.",
};

const features = [
  {
    icon: CloudRain,
    title: "Weather Protection",
    description:
      "Support designed around weather-related disruptions.",
    tone: "bg-rain/10 text-rain",
  },
  {
    icon: Activity,
    title: "AI-Based Risk Assessment",
    description:
      "Estimate disruption risk using relevant worker and environmental features.",
    tone: "bg-teal-light text-teal",
  },
  {
    icon: BadgeIndianRupee,
    title: "Affordable Premiums",
    description:
      "Calculate an estimated weekly premium based on risk.",
    tone: "bg-warning/10 text-warning",
  },
  {
    icon: ShieldCheck,
    title: "Income Security",
    description:
      "A proposed safety net for income lost during covered disruptions.",
    tone: "bg-success/10 text-success",
  },
];

const steps = [
  {
    number: "01",
    title: "Register your worker profile",
    description:
      "Share your name, city, delivery platform, average daily income and experience.",
  },
  {
    number: "02",
    title: "Assess environmental and location risks",
    description:
      "Choose your risk zone. GIG-Guard derives a risk score from that zone and your profile.",
  },
  {
    number: "03",
    title: "Calculate your estimated premium",
    description:
      "See how base premium, risk loading, location and experience shape your weekly estimate.",
  },
  {
    number: "04",
    title: "Verify covered disruptions and process support",
    description:
      "Proposed workflow: disruption detection, verification and payouts are not implemented yet.",
    proposed: true,
  },
];

const platforms = ["Swiggy", "Zomato", "Zepto"];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-40 size-[34rem] rounded-full bg-teal/10 blur-3xl"
        />
        <div className="page-container relative grid gap-14 pb-20 pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-28 lg:pt-24">
          <div className="animate-rise">
            <p className="eyebrow">
              <span className="status-dot" />
              Weekly income protection for delivery partners
            </p>

            <h1 className="mt-5 max-w-2xl text-[2.8rem] font-semibold leading-[1.02] tracking-[-0.045em] text-navy sm:text-6xl lg:text-[4.35rem]">
              Your Income Deserves{" "}
              <span className="text-teal">Protection.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              GIG-Guard helps gig delivery workers protect their income against
              unexpected disruptions such as heavy rainfall, extreme heat,
              floods and other external events.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/register" size="lg">
                Get Started
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
              <ButtonLink href="#how-it-works" variant="secondary" size="lg">
                Learn How It Works
              </ButtonLink>
            </div>

            <div className="mt-9 grid max-w-lg gap-3 text-sm text-muted sm:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-teal" />
                Estimated premium ₹49–₹99 / week
              </span>
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-teal" />
                Built for Swiggy, Zomato &amp; Zepto
              </span>
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-teal" />
                No banking details required
              </span>
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-teal" />
                Transparent prototype
              </span>
            </div>
          </div>

          <div className="relative animate-rise [animation-delay:140ms]">
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[2.75rem] bg-teal/10 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-soft sm:p-8">
              <div className="bg-grid-lines pointer-events-none absolute inset-0 opacity-50" />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full border-[38px] border-teal/15"
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-teal-light/80">
                      Weekly premium estimate
                    </p>
                    <p className="mt-1.5 text-xs text-white/60">
                      Based on a sample worker profile
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.68rem] font-semibold text-white/80">
                    <Info aria-hidden="true" className="size-3" />
                    Estimate
                  </span>
                </div>

                <div className="mt-8 flex items-end gap-2">
                  <span className="text-6xl font-semibold tracking-[-0.055em]">
                    ₹99
                  </span>
                  <span className="pb-2 text-sm text-white/60">/ week</span>
                </div>
                <p className="mt-1 text-sm text-white/55">
                  Capped within the prototype&apos;s ₹49–₹99 range
                </p>

                <div className="mt-7 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                    <p className="text-[0.6rem] uppercase tracking-[0.12em] text-white/60">
                      Risk zone
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-warning">
                      High
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                    <p className="text-[0.6rem] uppercase tracking-[0.12em] text-white/60">
                      Risk score
                    </p>
                    <p className="mt-1.5 text-sm font-semibold">80 / 100</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                    <p className="text-[0.6rem] uppercase tracking-[0.12em] text-white/60">
                      Work days
                    </p>
                    <p className="mt-1.5 text-sm font-semibold">6</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 border-t border-white/10 pt-5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Base premium</span>
                    <span className="font-medium">₹72.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Risk loading</span>
                    <span className="font-medium">+₹54.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Location adjustment</span>
                    <span className="font-medium">+₹12.60</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Experience adjustment</span>
                    <span className="font-medium">−₹10.08</span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-warning/25 bg-warning/10 p-3.5 text-[0.7rem] leading-relaxed text-white/75">
                  Illustrative estimate only. It is not proof that an insurance
                  policy has been issued.
                </div>
              </div>
            </div>

            <div className="absolute -right-2 top-24 hidden items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-2 text-[0.7rem] font-semibold text-navy shadow-soft sm:flex">
              <MapPin aria-hidden="true" className="size-3.5 text-teal" />
              Location-aware estimate
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-paper/70">
        <div className="page-container flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">
            Built for partners on
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {platforms.map((platform) => (
              <span
                key={platform}
                className="rounded-full border border-line bg-mist px-3.5 py-1.5 text-xs font-semibold text-navy"
              >
                {platform}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted">Rain · Heat · Floods · Other disruptions</p>
        </div>
      </section>

      <section id="benefits" className="page-container scroll-mt-24 py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Benefits</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-navy sm:text-4xl">
            Built around the realities of gig work.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            GIG-Guard combines your worker profile with a simple risk assessment
            to produce an estimated weekly premium. Clear inputs, clear outputs.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="card-surface group p-6 transition duration-300 hover:-translate-y-1 hover:border-teal/25 hover:shadow-soft"
            >
              <span
                className={`grid size-11 place-items-center rounded-xl ${feature.tone}`}
              >
                <feature.icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold tracking-tight text-navy">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="page-container scroll-mt-24">
        <div className="overflow-hidden rounded-3xl bg-navy text-white shadow-soft">
          <div className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[0.82fr_1.18fr] lg:p-14">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-teal-light">
                How it works
              </p>
              <h2 className="mt-4 max-w-sm text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Four steps from profile to premium estimate.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
                The first three steps work today. The final step describes the
                proposed protection workflow.
              </p>
              <ButtonLink href="/register" variant="lime" size="md" className="mt-7">
                Start with your profile
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
            </div>

            <ol className="space-y-2">
              {steps.map((step) => (
                <li
                  key={step.number}
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 sm:p-6"
                >
                  <div className="flex gap-4">
                    <span className="font-mono text-xs font-semibold text-teal-light">
                      {step.number}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{step.title}</h3>
                        {step.proposed ? (
                          <span className="rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-warning">
                            Proposed
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="page-container py-20 sm:py-24">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-surface p-6">
            <BadgeIndianRupee aria-hidden="true" className="size-5 text-teal" />
            <p className="mt-6 text-3xl font-semibold tracking-tight text-navy">
              ₹49–₹99
            </p>
            <p className="mt-1 text-sm text-muted">Estimated weekly premium range</p>
          </div>
          <div className="card-surface p-6">
            <Activity aria-hidden="true" className="size-5 text-teal" />
            <p className="mt-6 text-3xl font-semibold tracking-tight text-navy">
              3 zones
            </p>
            <p className="mt-1 text-sm text-muted">Low, medium and high risk</p>
          </div>
          <div className="card-surface p-6">
            <ShieldCheck aria-hidden="true" className="size-5 text-teal" />
            <p className="mt-6 text-3xl font-semibold tracking-tight text-navy">
              4 steps
            </p>
            <p className="mt-1 text-sm text-muted">
              Profile to premium, with support still proposed
            </p>
          </div>
        </div>
      </section>

      <section className="page-container pb-4">
        <div className="relative overflow-hidden rounded-3xl bg-teal-light p-7 sm:p-12">
          <div
            aria-hidden="true"
            className="absolute -right-14 -top-16 size-64 rounded-full border-[38px] border-teal/10"
          />
          <div className="relative max-w-2xl">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-teal-dark">
              Ready when you are
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-navy sm:text-4xl">
              See what your week could look like.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Create a worker profile, calculate an estimated weekly premium and
              review the full breakdown. No policy is issued and no payment is
              taken.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/register" size="lg">
                Get Started
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-navy transition hover:bg-white/60"
              >
                <Sparkles aria-hidden="true" className="size-4 text-teal" />
                Read the FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
