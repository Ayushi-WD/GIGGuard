"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CircleCheck,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError, registerWorker } from "@/lib/api";
import { cn } from "@/lib/format";
import { rememberWorker } from "@/lib/storage";
import { PLATFORMS, type Platform } from "@/lib/types";

type FormState = {
  full_name: string;
  city: string;
  platform: Platform;
  average_daily_income: string;
  experience_days: string;
};

const initialForm: FormState = {
  full_name: "",
  city: "",
  platform: "Swiggy",
  average_daily_income: "",
  experience_days: "",
};

const platformTone: Record<Platform, string> = {
  Swiggy:
    "data-[active=true]:border-heat data-[active=true]:bg-heat/10 data-[active=true]:text-heat",
  Zomato:
    "data-[active=true]:border-danger data-[active=true]:bg-danger/10 data-[active=true]:text-danger",
  Zepto:
    "data-[active=true]:border-smog data-[active=true]:bg-smog/10 data-[active=true]:text-smog",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    workerId: string;
    name: string;
  } | null>(null);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const income = Number(form.average_daily_income);
    const experience = Number(form.experience_days);

    if (!form.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.city.trim()) {
      setError("Please enter your city.");
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
        full_name: form.full_name.trim(),
        city: form.city.trim(),
        platform: form.platform,
        average_daily_income: income,
        experience_days: experience,
      });

      rememberWorker(worker.id);
      setSuccess({ workerId: worker.id, name: worker.full_name });

      window.setTimeout(() => {
        router.push(`/dashboard/${worker.id}`);
      }, 1500);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not create your profile. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container py-10 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
        <aside className="relative hidden overflow-hidden rounded-[2rem] bg-forest p-8 text-cream shadow-soft lg:flex lg:flex-col lg:justify-between">
          <div className="bg-grid-lines pointer-events-none absolute inset-0 opacity-50" />
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 size-64 rounded-full border-[38px] border-lime/10"
          />

          <div className="relative">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-lime">
              Join the weekly shield
            </p>
            <h1 className="mt-5 max-w-sm text-4xl font-semibold leading-[1.05] tracking-[-0.04em]">
              Your profile is the first step to a covered week.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/60">
              We use these details to calculate a premium that fits your income
              and experience. No documents, no waiting.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                "Weekly cover from ₹49 to ₹99",
                "Built around your daily earnings",
                "Rain, heat and pollution protection",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-cream/75"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lime/15 text-lime">
                    <Check aria-hidden="true" className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-12 rounded-2xl border border-cream/10 bg-cream/[0.055] p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-lime">
              <Sparkles aria-hidden="true" className="size-4" />
              Good to know
            </div>
            <p className="mt-2 text-sm leading-relaxed text-cream/60">
              This is a prototype. Your profile is saved in the project&apos;s
              local SQLite database through the FastAPI backend.
            </p>
          </div>
        </aside>

        <section className="card-surface p-6 sm:p-9">
          {success ? (
            <div className="flex min-h-[32rem] flex-col items-center justify-center text-center">
              <span className="grid size-16 place-items-center rounded-full bg-forest-light text-forest">
                <CircleCheck aria-hidden="true" className="size-8" />
              </span>
              <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-forest">
                Profile created
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                Welcome aboard, {success.name.split(" ")[0]}.
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                Your worker profile is ready. Taking you to your dashboard now…
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest-light px-4 py-2 text-xs font-semibold text-forest">
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
                Redirecting to dashboard
              </div>
              <Button
                onClick={() => router.push(`/dashboard/${success.workerId}`)}
                className="mt-5"
                variant="secondary"
                size="sm"
              >
                Go now
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    <ShieldCheck aria-hidden="true" className="size-3.5" />
                    Worker registration
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                    Create your worker profile.
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Takes about two minutes. All fields are required.
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-lime-soft px-3 py-1.5 text-[0.68rem] font-semibold text-forest-dark sm:inline-flex">
                  ₹49–₹99 / week
                </span>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="full_name" className="field-label">
                      Full name
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      autoComplete="name"
                      maxLength={150}
                      required
                      value={form.full_name}
                      onChange={(event) =>
                        update("full_name", event.target.value)
                      }
                      placeholder="e.g. Rahul Sharma"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="field-label">
                      City
                    </label>
                    <div className="relative">
                      <MapPin
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                      />
                      <input
                        id="city"
                        name="city"
                        type="text"
                        autoComplete="address-level2"
                        maxLength={100}
                        required
                        value={form.city}
                        onChange={(event) => update("city", event.target.value)}
                        placeholder="e.g. Bengaluru"
                        className="field-input pl-10"
                      />
                    </div>
                  </div>
                </div>

                <fieldset>
                  <legend className="field-label">Delivery platform</legend>
                  <div className="grid grid-cols-3 gap-2.5">
                    {PLATFORMS.map((platform) => {
                      const active = form.platform === platform;
                      return (
                        <button
                          key={platform}
                          type="button"
                          data-active={active}
                          aria-pressed={active}
                          onClick={() => update("platform", platform)}
                          className={cn(
                            "rounded-xl border border-ink/15 bg-paper px-3 py-3 text-sm font-semibold text-muted transition hover:border-ink/25 hover:text-ink data-[active=true]:shadow-sm",
                            platformTone[platform],
                          )}
                        >
                          {platform}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="income" className="field-label">
                      Average daily income
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                        ₹
                      </span>
                      <input
                        id="income"
                        name="average_daily_income"
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        max="9999999999"
                        step="0.01"
                        required
                        value={form.average_daily_income}
                        onChange={(event) =>
                          update("average_daily_income", event.target.value)
                        }
                        placeholder="600"
                        className="field-input pl-8"
                      />
                    </div>
                    <p className="field-hint">
                      Your typical take-home after a delivery day.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="experience" className="field-label">
                      Experience
                    </label>
                    <div className="relative">
                      <input
                        id="experience"
                        name="experience_days"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="36500"
                        step="1"
                        required
                        value={form.experience_days}
                        onChange={(event) =>
                          update("experience_days", event.target.value)
                        }
                        placeholder="180"
                        className="field-input pr-16"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted">
                        days
                      </span>
                    </div>
                    <p className="field-hint">
                      Enter 0 if you are just starting out.
                    </p>
                  </div>
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
                  >
                    {error}
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
                      Create my profile
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs leading-relaxed text-muted">
                  By continuing, you agree that this is a project prototype and
                  not a real insurance purchase.
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
