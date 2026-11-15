import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeIndianRupee,
  Check,
  CloudRain,
  Info,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About & FAQ",
  description:
    "Learn what GIG-Guard is, who can register, how the weekly premium estimate works and what financial support is still proposed.",
};

const steps = [
  {
    number: "01",
    title: "Register your worker profile",
    description:
      "Add your name, city, delivery platform, average daily income and experience.",
  },
  {
    number: "02",
    title: "Assess environmental and location risks",
    description:
      "Choose a low, medium or high risk zone. GIG-Guard derives a risk score from that choice.",
  },
  {
    number: "03",
    title: "Calculate your estimated premium",
    description:
      "The pricing API combines base premium, risk loading, location and experience adjustments.",
  },
  {
    number: "04",
    title: "Verify covered disruptions and process support",
    description:
      "Proposed workflow. Trigger detection, verification and payouts are not implemented yet.",
    proposed: true,
  },
];

const faqs = [
  {
    question: "What is GIG-Guard?",
    answer:
      "GIG-Guard is a student project that explores income protection for gig delivery workers. It helps a worker create a profile, estimate disruption risk and see an estimated weekly premium. It is not a licensed insurer.",
  },
  {
    question: "Who can register?",
    answer:
      "The current backend accepts delivery partners on Swiggy, Zomato and Zepto. You only need your name, city, platform, average daily income and experience in days. No banking or identity documents are requested.",
  },
  {
    question: "How is the weekly premium calculated?",
    answer:
      "The estimate starts with weekly income, then adds a base premium, a risk loading based on the estimated risk score, a location adjustment for your risk zone and an experience adjustment. The result is capped between ₹49 and ₹99 per week. It is an estimate, not a quote or an issued policy.",
  },
  {
    question: "What types of disruptions are considered?",
    answer:
      "The project is designed around external disruptions such as heavy rainfall, extreme heat, floods and other severe weather events that can stop deliveries. The current prototype does not read live weather, rainfall or AQI data.",
  },
  {
    question: "How does risk assessment work?",
    answer:
      "You choose a risk zone. The app maps low, medium and high zones to risk scores of 30, 55 and 80, then sends that score to the pricing API. The project also contains an experimental machine-learning risk model, but normal pricing does not use it because it requires environmental inputs a worker cannot supply.",
  },
  {
    question: "How will financial support be provided?",
    answer:
      "That part is still proposed. The planned workflow would detect a covered disruption, verify it, review a claim and then process support. Trigger detection, fraud checks and payout modules are not built, so no support or payout is available today.",
  },
];

export default function AboutPage() {
  return (
    <div className="page-container py-12 sm:py-16">
      <section className="mx-auto max-w-3xl text-center">
        <p className="eyebrow justify-center">
          <Sparkles aria-hidden="true" className="size-3.5" />
          About GIG-Guard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-navy sm:text-4xl">
          A clear, honest look at income protection for gig workers.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Delivery partners lose working hours to rain, heat and other external
          events. GIG-Guard explores how a simple profile and risk estimate can
          make that problem easier to understand.
        </p>
      </section>

      <section className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Profile first",
            text: "A worker profile is the only input needed to start.",
          },
          {
            icon: BadgeIndianRupee,
            title: "Estimate only",
            text: "Every premium shown is an estimate, not an issued policy.",
          },
          {
            icon: CloudRain,
            title: "Disruption focused",
            text: "The design centres on weather and other external events.",
          },
        ].map((item) => (
          <div key={item.title} className="card-surface p-5 text-center">
            <span className="mx-auto grid size-10 place-items-center rounded-xl bg-teal-light text-teal">
              <item.icon aria-hidden="true" className="size-5" />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-navy">
              {item.title}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {item.text}
            </p>
          </div>
        ))}
      </section>

      <section id="how-it-works" className="mx-auto mt-16 max-w-4xl scroll-mt-24">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
            Four steps, with the last one clearly marked as proposed.
          </h2>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {steps.map((step) => (
            <li
              key={step.number}
              className="rounded-2xl border border-line bg-white p-5 shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-mist font-mono text-[0.7rem] font-semibold text-teal ring-1 ring-line">
                  {step.number}
                </span>
                {step.proposed ? (
                  <span className="rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-warning">
                    Proposed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-success">
                    <Check aria-hidden="true" className="size-3" />
                    Working
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-navy">
                {step.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section id="faq" className="mx-auto mt-16 max-w-4xl scroll-mt-24">
        <div className="max-w-2xl">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
            Common questions, answered simply.
          </h2>
        </div>

        <div className="mt-6 space-y-2.5">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-line bg-white p-5 shadow-card open:border-teal/25"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-navy">
                {faq.question}
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mist text-teal transition group-open:rotate-45">
                  <span aria-hidden="true" className="text-base leading-none">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-4xl rounded-3xl bg-navy p-7 text-white shadow-soft sm:p-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-teal-light">
              Try the prototype
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Start with a worker profile.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
              Registration and premium estimation work today. Policies, claims
              and payouts are clearly marked as future work.
            </p>
          </div>
          <ButtonLink
            href="/register"
            variant="lime"
            size="lg"
            className="shrink-0"
          >
            Register now
            <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        </div>
      </section>

      <p className="mx-auto mt-6 flex max-w-4xl items-start gap-2 text-xs leading-relaxed text-muted">
        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-teal" />
        GIG-Guard is a BTech CSE major project prototype. It is not a licensed
        insurer. Premiums are estimates only and no policy, payment or payout is
        real.
      </p>
    </div>
  );
}
