import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  Check,
  CloudRain,
  Clock3,
  Flame,
  ShieldCheck,
  Sparkles,
  Wind,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/format";

export const metadata: Metadata = {
  title: "Income protection for gig workers",
  description:
    "GIG-Guard protects delivery partners from income loss caused by rain, heat and pollution. Weekly cover from ₹49 to ₹99.",
};

const coverage = [
  {
    icon: CloudRain,
    tag: "Rain cover",
    title: "Heavy rain days",
    description:
      "When waterlogged roads pause deliveries, your lost hours are covered instead of your income.",
    tone: "bg-rain/10 text-rain",
    accent: "text-rain",
  },
  {
    icon: Flame,
    tag: "Heat cover",
    title: "Extreme heat",
    description:
      "Safety pauses during heat advisories should not eat into the money you take home.",
    tone: "bg-heat/10 text-heat",
    accent: "text-heat",
  },
  {
    icon: Wind,
    tag: "Pollution cover",
    title: "Severe air quality",
    description:
      "When the AQI makes riding unsafe, cover steps in for the deliveries you had to skip.",
    tone: "bg-smog/10 text-smog",
    accent: "text-smog",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your worker profile",
    description:
      "Add your name, city, delivery platform, average daily income and experience.",
  },
  {
    number: "02",
    title: "Get a weekly premium",
    description:
      "Tell us your location risk, a simulated risk score and working days. See the full breakdown.",
  },
  {
    number: "03",
    title: "Activate cover and claim",
    description:
      "Turn your estimate into a weekly policy, then file a claim when a disruption hits.",
  },
];

const perils = [
  { icon: CloudRain, label: "Rain", tone: "text-rain" },
  { icon: Flame, label: "Heat", tone: "text-heat" },
  { icon: Wind, label: "Pollution", tone: "text-smog" },
];

const platforms = ["Swiggy", "Zomato", "Zepto"];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
        <div className="page-container relative grid gap-14 pb-20 pt-14 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:pb-28 lg:pt-24">
          <div className="animate-rise">
            <p className="eyebrow">
              <span className="status-dot" />
              Income protection for delivery partners
            </p>

            <h1 className="mt-5 max-w-2xl text-[2.85rem] font-semibold leading-[0.98] tracking-[-0.045em] text-ink sm:text-6xl lg:text-[4.6rem]">
              When the weather stops you,{" "}
              <span className="relative inline-block text-forest">
                your income
                <svg
                  aria-hidden="true"
                  viewBox="0 0 240 14"
                  preserveAspectRatio="none"
                  className="absolute -bottom-2 left-0 h-3 w-full text-lime"
                >
                  <path
                    d="M3 9.5c42-5 91-7 234-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              shouldn&apos;t.
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              GIG-Guard is weekly income protection for India&apos;s delivery
              partners. Rain, heat or pollution interrupts your day — we help
              protect the earnings you lose.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/login?tab=signup" size="lg">
                Register as a worker
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
              <ButtonLink href="#how-it-works" variant="secondary" size="lg">
                See how it works
              </ButtonLink>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-forest" />
                Premiums from ₹49/week
              </span>
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-forest" />
                No paperwork
              </span>
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-forest" />
                Built for gig work
              </span>
            </div>
          </div>

          <div className="relative animate-rise [animation-delay:160ms]">
            <div
              aria-hidden="true"
              className="animate-soft-pulse absolute -inset-8 rounded-[3.5rem] bg-forest/10 blur-3xl"
            />
            <div className="relative overflow-hidden rounded-[2rem] bg-forest p-6 text-cream shadow-soft sm:p-8">
              <div className="bg-grid-lines pointer-events-none absolute inset-0 opacity-60" />
              <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full border-[34px] border-lime/10" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cream/50">
                      This week&apos;s protection
                    </p>
                    <p className="mt-1.5 font-mono text-[0.68rem] text-cream/40">
                      POLICY #GG-2048
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-cream/10 bg-cream/10 px-3 py-1.5 text-[0.7rem] font-medium">
                    <span className="status-dot" />
                    Active
                  </span>
                </div>

                <div className="mt-9 flex items-end gap-2">
                  <span className="text-6xl font-semibold tracking-[-0.05em]">
                    ₹79
                  </span>
                  <span className="pb-2 text-sm text-cream/50">/ week</span>
                </div>
                <p className="mt-1 text-sm text-cream/55">
                  Covers up to ₹3,600 of lost income
                </p>

                <div className="mt-7 space-y-2">
                  {perils.map((peril) => (
                    <div
                      key={peril.label}
                      className="flex items-center justify-between rounded-2xl border border-cream/10 bg-cream/[0.055] px-4 py-3"
                    >
                      <span className="flex items-center gap-3 text-sm">
                        <peril.icon
                          aria-hidden="true"
                          className={cn("size-4", peril.tone)}
                        />
                        {peril.label}
                      </span>
                      <span className="flex items-center gap-1.5 text-[0.7rem] font-medium text-cream/55">
                        <Check aria-hidden="true" className="size-3.5 text-lime" />
                        Covered
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-cream/10 bg-cream/[0.055] p-4">
                  <div className="flex items-center justify-between text-[0.7rem] text-cream/50">
                    <span>Cover period</span>
                    <span>4 days left</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream/10">
                    <div className="h-full w-[68%] rounded-full bg-lime" />
                  </div>
                </div>
              </div>
            </div>

            <div className="animate-float absolute -left-3 bottom-8 hidden w-[13.5rem] rounded-2xl border border-ink/10 bg-paper p-3.5 shadow-soft sm:block">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-rain/10 text-rain">
                  <CloudRain aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <p className="text-[0.7rem] font-semibold text-ink">
                    Rain alert · Whitefield
                  </p>
                  <p className="text-[0.65rem] text-muted">Cover triggered</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 top-20 hidden items-center gap-2 rounded-full border border-ink/10 bg-lime px-3.5 py-2 text-[0.7rem] font-semibold text-ink shadow-soft sm:flex">
              <Sparkles aria-hidden="true" className="size-3.5" />
              ₹49–₹99 per week
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-paper/55">
        <div className="page-container flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">
            Built for partners on
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {platforms.map((platform) => (
              <span
                key={platform}
                className="rounded-full border border-ink/10 bg-cream px-3.5 py-1.5 text-xs font-semibold text-ink"
              >
                {platform}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted">Rain · Heat · Pollution</p>
        </div>
      </section>

      <section id="coverage" className="page-container py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">What&apos;s covered</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Three disruptions. One weekly shield.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            You already know the days that cost you money. GIG-Guard turns those
            disruptions into a simple weekly plan built around your earnings.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {coverage.map((item) => (
            <article
              key={item.tag}
              className="card-surface group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:shadow-soft"
            >
              <div
                className={cn(
                  "grid size-12 place-items-center rounded-2xl",
                  item.tone,
                )}
              >
                <item.icon aria-hidden="true" className="size-6" />
              </div>
              <p
                className={cn(
                  "mt-6 text-[0.65rem] font-semibold uppercase tracking-[0.18em]",
                  item.accent,
                )}
              >
                {item.tag}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-forest">
                <ShieldCheck aria-hidden="true" className="size-4" />
                Income-loss protection
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="page-container scroll-mt-24">
        <div className="overflow-hidden rounded-[2.5rem] bg-forest text-cream shadow-soft">
          <div className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:p-14">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-lime">
                How it works
              </p>
              <h2 className="mt-4 max-w-sm text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Three steps between you and a covered week.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/60">
                The whole flow takes a few minutes. Your premium stays between
                ₹49 and ₹99 per week.
              </p>
              <ButtonLink
                href="/login?tab=signup"
                variant="lime"
                size="md"
                className="mt-7"
              >
                Start with your profile
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
            </div>

            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className="relative rounded-2xl border border-cream/10 bg-cream/[0.045] p-5 sm:p-6"
                >
                  <div className="flex gap-4">
                    <span className="font-mono text-xs font-semibold text-lime">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-cream/55">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-2 left-[2.55rem] h-2 w-px bg-lime/30"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-container py-20 sm:py-24">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-surface p-6">
            <BadgeIndianRupee
              aria-hidden="true"
              className="size-5 text-forest"
            />
            <p className="mt-6 text-3xl font-semibold tracking-tight">
              ₹49–₹99
            </p>
            <p className="mt-1 text-sm text-muted">Weekly premium range</p>
          </div>
          <div className="card-surface p-6">
            <Clock3 aria-hidden="true" className="size-5 text-forest" />
            <p className="mt-6 text-3xl font-semibold tracking-tight">7 days</p>
            <p className="mt-1 text-sm text-muted">Cover window, renewed weekly</p>
          </div>
          <div className="card-surface p-6">
            <ShieldCheck aria-hidden="true" className="size-5 text-forest" />
            <p className="mt-6 text-3xl font-semibold tracking-tight">3</p>
            <p className="mt-1 text-sm text-muted">
              Disruption types covered
            </p>
          </div>
        </div>
      </section>

      <section className="page-container pb-4">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-lime p-7 sm:p-12">
          <div
            aria-hidden="true"
            className="absolute -right-14 -top-16 size-64 rounded-full border-[38px] border-forest/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-20 right-28 size-40 rounded-full bg-forest/5"
          />
          <div className="relative max-w-2xl">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-forest-dark/70">
              Ready when you are
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
              Your next rainy day can be a covered day.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/65 sm:text-base">
              Create a profile, calculate your weekly premium and see exactly
              what your cover looks like.
            </p>
            <ButtonLink
              href="/login?tab=signup"
              size="lg"
              className="mt-7 bg-forest-dark text-cream hover:bg-ink"
            >
              Register as a worker
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
