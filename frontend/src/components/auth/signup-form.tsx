import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  BadgeIndianRupee,
  Calendar,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Lock,
  MapPin,
  User,
} from "lucide-react";

import { AuthError } from "@/components/auth/auth-error";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/format";
import { PLATFORMS, type Platform } from "@/lib/types";
import { useAuth } from "@/lib/use-auth";

const platformStyles: Record<Platform, string> = {
  Swiggy:
    "data-[active=true]:border-heat data-[active=true]:bg-heat/10 data-[active=true]:text-heat",
  Zomato:
    "data-[active=true]:border-danger data-[active=true]:bg-danger/10 data-[active=true]:text-danger",
  Zepto:
    "data-[active=true]:border-smog data-[active=true]:bg-smog/10 data-[active=true]:text-smog",
};

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-cream/40 py-2.5 text-sm font-medium text-ink outline-none transition placeholder:text-muted/60 focus:border-forest focus:bg-paper focus:ring-2 focus:ring-forest/15";

export function SignupForm({
  redirectPath,
  onSwitch,
}: {
  redirectPath: string | null;
  onSwitch: () => void;
}) {
  const router = useRouter();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    city: "Bengaluru",
    platform: "Swiggy" as Platform,
    average_daily_income: "850",
    experience_days: "120",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.username.trim()) {
      setError("Please enter a username.");
      return;
    }
    if (form.username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.city.trim()) {
      setError("Please enter your city.");
      return;
    }

    const income = Number(form.average_daily_income);
    if (!Number.isFinite(income) || income <= 0) {
      setError("Please enter a valid daily income greater than 0.");
      return;
    }

    const experience = Number(form.experience_days);
    if (!Number.isInteger(experience) || experience < 0) {
      setError("Please enter non-negative integer experience days.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        username: form.username.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        city: form.city.trim(),
        platform: form.platform,
        average_daily_income: income,
        experience_days: experience,
      });

      router.push(redirectPath || "/dashboard");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "Sign up failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthError message={error} />

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-3xl border border-ink/10 bg-paper p-6 shadow-soft sm:p-8"
      >
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forest">
              1. Login Credentials
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold text-muted"
                >
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      full_name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Rahul Sharma"
                  className={cn("mt-1 px-3.5", inputClass)}
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="signup-username"
                  className="block text-xs font-semibold text-muted"
                >
                  Choose a Username
                </label>
                <div className="relative mt-1">
                  <User
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="signup-username"
                    type="text"
                    required
                    value={form.username}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        username: event.target.value,
                      }))
                    }
                    placeholder="e.g. rahul_delivery"
                    className={cn("pl-10 pr-3.5", inputClass)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-muted"
                >
                  Create Password (min. 6 chars)
                </label>
                <div className="relative mt-1">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    placeholder="••••••••"
                    className={cn("pl-10 pr-9", inputClass)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="size-3.5" />
                    ) : (
                      <Eye aria-hidden="true" className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-xs font-semibold text-muted"
                >
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <KeyRound
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="signup-confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.confirmPassword}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="••••••••"
                    className={cn("pl-10 pr-3.5", inputClass)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-ink/10 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-forest">
              2. Gig Delivery Profile
            </p>

            <div className="mt-3 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted">
                  Primary delivery platform
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {PLATFORMS.map((platform) => {
                    const active = form.platform === platform;
                    return (
                      <button
                        key={platform}
                        type="button"
                        data-active={active}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, platform }))
                        }
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-2xl border border-ink/15 bg-cream/40 py-2.5 text-xs font-semibold transition hover:border-ink/30",
                          platformStyles[platform],
                          active && "border-current shadow-xs",
                        )}
                      >
                        {active ? (
                          <Check aria-hidden="true" className="size-3.5" />
                        ) : null}
                        {platform}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="signup-city"
                    className="block text-xs font-semibold text-muted"
                  >
                    City
                  </label>
                  <div className="relative mt-1">
                    <MapPin
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                    />
                    <input
                      id="signup-city"
                      type="text"
                      required
                      value={form.city}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          city: event.target.value,
                        }))
                      }
                      placeholder="e.g. Bengaluru"
                      className={cn("pl-8 pr-3 text-xs", inputClass)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-income"
                    className="block text-xs font-semibold text-muted"
                  >
                    Daily income (₹)
                  </label>
                  <div className="relative mt-1">
                    <BadgeIndianRupee
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                    />
                    <input
                      id="signup-income"
                      type="number"
                      step="1"
                      min="100"
                      required
                      value={form.average_daily_income}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          average_daily_income: event.target.value,
                        }))
                      }
                      placeholder="850"
                      className={cn("pl-8 pr-3 text-xs", inputClass)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-exp"
                    className="block text-xs font-semibold text-muted"
                  >
                    Experience (days)
                  </label>
                  <div className="relative mt-1">
                    <Calendar
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                    />
                    <input
                      id="signup-exp"
                      type="number"
                      min="0"
                      required
                      value={form.experience_days}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          experience_days: event.target.value,
                        }))
                      }
                      placeholder="120"
                      className={cn("pl-8 pr-3 text-xs", inputClass)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="mt-6 w-full"
        >
          {loading ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
              Creating account...
            </>
          ) : (
            <>
              Create account &amp; get covered
              <ArrowRight aria-hidden="true" className="size-4" />
            </>
          )}
        </Button>

        <p className="mt-6 text-center text-xs text-muted">
          Already registered?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-semibold text-forest underline hover:text-forest-dark"
          >
            Log in here
          </button>
        </p>
      </form>
    </>
  );
}
