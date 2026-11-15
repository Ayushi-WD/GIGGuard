"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BadgeIndianRupee,
  Check,
  CircleAlert,
  Clock3,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { ApiError, registerWorker } from "@/lib/api";
import { formatExperience, formatINR } from "@/lib/format";
import { rememberWorker } from "@/lib/storage";
import { PLATFORMS, type Platform, type Worker } from "@/lib/types";

type FormState = {
  full_name: string;
  city: string;
  platform: Platform | "";
  average_daily_income: string;
  experience_days: string;
};

const emptyForm: FormState = {
  full_name: "",
  city: "",
  platform: "",
  average_daily_income: "",
  experience_days: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Worker | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const fullName = form.full_name.trim();
    const city = form.city.trim();
    const income = Number(form.average_daily_income);
    const experience = Number(form.experience_days);

    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }

    if (!city) {
      setError("Please enter your city.");
      return;
    }

    if (!form.platform) {
      setError("Please select your delivery platform.");
      return;
    }

    if (!Number.isFinite(income) || income <= 0) {
      setError("Average daily income must be greater than zero.");
      return;
    }

    if (!Number.isInteger(experience) || experience < 0) {
      setError("Experience must be a whole number of days (0 or more).");
      return;
    }

    setSubmitting(true);

    try {
      const worker = await registerWorker({
        full_name: fullName,
        city,
        platform: form.platform,
        average_daily_income: Math.round(income * 100) / 100,
        experience_days: experience,
      });

      rememberWorker(worker.id);
      setCreated(worker);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not create your worker profile. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="page-container py-12 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="card-surface overflow-hidden">
            <div className="bg-success/10 px-6 py-8 text-center sm:px-10">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-success text-white">
                <Check aria-hidden="true" className="size-7" />
              </span>
              <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
                Your worker profile has been created successfully.
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Next, calculate an estimated weekly premium from your profile.
              </p>
            </div>

            <div className="border-t border-line px-6 py-6 sm:px-10">
              <dl className="grid gap-3 sm:grid-cols-2">
                <SummaryRow
                  icon={UserRound}
                  label="Full name"
                  value={created.full_name}
                />
                <SummaryRow icon={MapPin} label="City" value={created.city} />
                <SummaryRow
                  icon={Store}
                  label="Delivery platform"
                  value={created.platform}
                />
                <SummaryRow
                  icon={BadgeIndianRupee}
                  label="Average daily income"
                  value={formatINR(created.average_daily_income)}
                />
                <SummaryRow
                  icon={Clock3}
                  label="Experience"
                  value={formatExperience(created.experience_days)}
                />
              </dl>

              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                <ButtonLink
                  href={`/dashboard/${created.id}`}
                  size="lg"
                  className="flex-1"
                >
                  Go to my dashboard
                  <ArrowRight aria-hidden="true" className="size-4" />
                </ButtonLink>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setCreated(null);
                    setForm(emptyForm);
                  }}
                >
                  Register another worker
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted">
            This profile is saved to the GIG-Guard API. No policy is issued and
            no payment is taken.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="lg:sticky lg:top-24">
          <p className="eyebrow">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Worker registration
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-navy sm:text-4xl">
            Register as a Delivery Partner
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Create a worker profile to estimate a weekly premium. We only ask
            for what the pricing model needs.
          </p>

          <ul className="mt-7 space-y-3 text-sm text-muted">
            {[
              "Profile saved to the GIG-Guard API",
              "Risk score derived from your zone",
              "Estimated premium with a full breakdown",
              "No banking or identity documents",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-teal text-white">
                  <Check aria-hidden="true" className="size-2.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-7 rounded-2xl border border-line bg-white p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-navy">
              <ShieldCheck aria-hidden="true" className="size-4 text-teal" />
              Transparent by design
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              The current backend accepts Swiggy, Zomato and Zepto. Premiums are
              estimates only; this prototype does not issue policies or payouts.
            </p>
          </div>
        </section>

        <section className="card-surface p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="full_name" className="field-label">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                maxLength={150}
                required
                value={form.full_name}
                onChange={(event) => update("full_name", event.target.value)}
                className="field-input"
                placeholder="e.g. Rahul Kumar"
              />
            </div>

            <div>
              <label htmlFor="city" className="field-label">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                maxLength={100}
                required
                value={form.city}
                onChange={(event) => update("city", event.target.value)}
                className="field-input"
                placeholder="e.g. Bengaluru"
              />
            </div>

            <div>
              <label htmlFor="platform" className="field-label">
                Delivery Platform
              </label>
              <select
                id="platform"
                name="platform"
                required
                value={form.platform}
                onChange={(event) =>
                  update("platform", event.target.value as Platform | "")
                }
                className="field-input"
              >
                <option value="" disabled>
                  Select your platform
                </option>
                {PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
              <p className="field-hint">
                Currently supported by the backend: Swiggy, Zomato and Zepto.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="average_daily_income" className="field-label">
                  Average Daily Income
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
                    ₹
                  </span>
                  <input
                    id="average_daily_income"
                    name="average_daily_income"
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="0.01"
                    required
                    value={form.average_daily_income}
                    onChange={(event) =>
                      update("average_daily_income", event.target.value)
                    }
                    className="field-input pl-8"
                    placeholder="850"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="experience_days" className="field-label">
                  Experience Days
                </label>
                <input
                  id="experience_days"
                  name="experience_days"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  required
                  value={form.experience_days}
                  onChange={(event) =>
                    update("experience_days", event.target.value)
                  }
                  className="field-input"
                  placeholder="120"
                />
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
              >
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>{error}</span>
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Creating profile…
                </>
              ) : (
                <>
                  Register Now
                  <ArrowRight aria-hidden="true" className="size-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-teal underline hover:text-teal-dark"
              >
                Log in
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-mist p-3.5">
      <dt className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">
        <Icon aria-hidden="true" className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-navy">{value}</dd>
    </div>
  );
}
