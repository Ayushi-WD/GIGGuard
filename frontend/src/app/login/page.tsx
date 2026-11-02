"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeIndianRupee,
  Calendar,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Lock,
  LogIn,
  MapPin,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";

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

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const redirectPath = searchParams.get("redirect");

  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const { login, signup, isLoggedIn, isAdmin } = useAuth();

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign up form state
  const [signupForm, setSignupForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    city: "Bengaluru",
    platform: "Swiggy" as Platform,
    average_daily_income: "850",
    experience_days: "120",
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect appropriately
  useEffect(() => {
    if (isLoggedIn) {
      if (isAdmin) {
        router.push(redirectPath || "/admin");
      } else {
        router.push(redirectPath || "/dashboard");
      }
    }
  }, [isLoggedIn, isAdmin, redirectPath, router]);

  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!loginForm.username.trim() || !loginForm.password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await login({
        username: loginForm.username,
        password: loginForm.password,
      });

      if (user.role === "admin") {
        router.push(redirectPath || "/admin");
      } else {
        router.push(redirectPath || "/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Invalid username or password.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!signupForm.username.trim()) {
      setError("Please enter a username.");
      return;
    }
    if (signupForm.username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (signupForm.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!signupForm.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!signupForm.city.trim()) {
      setError("Please enter your city.");
      return;
    }

    const income = Number(signupForm.average_daily_income);
    if (!Number.isFinite(income) || income <= 0) {
      setError("Please enter a valid daily income greater than 0.");
      return;
    }

    const experience = Number(signupForm.experience_days);
    if (!Number.isInteger(experience) || experience < 0) {
      setError("Please enter non-negative integer experience days.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        username: signupForm.username.trim(),
        password: signupForm.password,
        full_name: signupForm.full_name.trim(),
        city: signupForm.city.trim(),
        platform: signupForm.platform,
        average_daily_income: income,
        experience_days: experience,
      });

      router.push(redirectPath || `/dashboard`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Sign up failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function fillAdminCredentials() {
    setLoginForm({ username: "admin", password: "admin123" });
    setError(null);
  }

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="text-center">
          <p className="eyebrow inline-flex">
            <Sparkles aria-hidden="true" className="size-3.5 text-forest" />
            GIG-Guard Access
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {activeTab === "login" ? "Welcome back" : "Create your worker account"}
          </h1>
          <p className="mt-2 text-sm text-muted sm:text-base">
            {activeTab === "login"
              ? "Sign in to manage your protection, policies and weather disruption claims."
              : "Register as a delivery partner to get personalized weekly income cover."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 grid grid-cols-2 rounded-2xl border border-ink/10 bg-cream/70 p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setError(null);
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition",
              activeTab === "login"
                ? "bg-paper text-ink shadow-sm"
                : "text-muted hover:text-ink",
            )}
          >
            <LogIn aria-hidden="true" className="size-4" />
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("signup");
              setError(null);
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition",
              activeTab === "signup"
                ? "bg-paper text-ink shadow-sm"
                : "text-muted hover:text-ink",
            )}
          >
            <UserPlus aria-hidden="true" className="size-4" />
            Sign up
          </button>
        </div>

        {/* Error notification banner */}
        {error ? (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Authentication notice</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        ) : null}

        {/* LOGIN FORM */}
        {activeTab === "login" ? (
          <form
            onSubmit={handleLoginSubmit}
            className="mt-6 rounded-3xl border border-ink/10 bg-paper p-6 sm:p-8 shadow-soft"
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Username or Admin ID
                </label>
                <div className="relative mt-2">
                  <User
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="login-username"
                    type="text"
                    required
                    autoComplete="username"
                    value={loginForm.username}
                    onChange={(e) =>
                      setLoginForm((prev) => ({ ...prev, username: e.target.value }))
                    }
                    placeholder="e.g. admin or your username"
                    className="w-full rounded-2xl border border-ink/15 bg-cream/40 py-3 pl-11 pr-4 text-sm font-medium text-ink outline-none transition placeholder:text-muted/60 focus:border-forest focus:bg-paper focus:ring-2 focus:ring-forest/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-ink/15 bg-cream/40 py-3 pl-11 pr-11 text-sm font-medium text-ink outline-none transition placeholder:text-muted/60 focus:border-forest focus:bg-paper focus:ring-2 focus:ring-forest/15"
                  />
                  <button
                    type="button"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  >
                    {showLoginPassword ? (
                      <EyeOff aria-hidden="true" className="size-4" />
                    ) : (
                      <Eye aria-hidden="true" className="size-4" />
                    )}
                  </button>
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
                  Signing in...
                </>
              ) : (
                <>
                  Log in to account
                  <ArrowRight aria-hidden="true" className="size-4" />
                </>
              )}
            </Button>

            {/* Admin Quick Credentials Pill */}
            <div className="mt-6 rounded-2xl border border-forest/20 bg-forest-light/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck aria-hidden="true" className="size-4 text-forest" />
                  <span className="text-xs font-semibold text-forest">
                    Default Admin Account
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="rounded-lg border border-forest/30 bg-paper px-2.5 py-1 text-[11px] font-semibold text-forest transition hover:bg-forest hover:text-cream"
                >
                  Fill credentials
                </button>
              </div>
              <p className="mt-2 text-xs text-forest/80">
                Username: <code className="font-semibold text-ink">admin</code> &nbsp;|&nbsp;
                Password: <code className="font-semibold text-ink">admin123</code>
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-muted">
              Don&apos;t have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signup");
                  setError(null);
                }}
                className="font-semibold text-forest underline hover:text-forest-dark"
              >
                Sign up as worker
              </button>
            </p>
          </form>
        ) : null}

        {/* SIGN UP FORM */}
        {activeTab === "signup" ? (
          <form
            onSubmit={handleSignupSubmit}
            className="mt-6 rounded-3xl border border-ink/10 bg-paper p-6 sm:p-8 shadow-soft"
          >
            <div className="space-y-5">
              {/* Account Credentials Section */}
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
                      value={signupForm.full_name}
                      onChange={(e) =>
                        setSignupForm((prev) => ({ ...prev, full_name: e.target.value }))
                      }
                      placeholder="e.g. Rahul Sharma"
                      className="mt-1 w-full rounded-2xl border border-ink/15 bg-cream/40 px-3.5 py-2.5 text-sm font-medium text-ink outline-none transition placeholder:text-muted/60 focus:border-forest focus:bg-paper focus:ring-2 focus:ring-forest/15"
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
                        value={signupForm.username}
                        onChange={(e) =>
                          setSignupForm((prev) => ({ ...prev, username: e.target.value }))
                        }
                        placeholder="e.g. rahul_delivery"
                        className="w-full rounded-2xl border border-ink/15 bg-cream/40 py-2.5 pl-10 pr-3.5 text-sm font-medium text-ink outline-none transition placeholder:text-muted/60 focus:border-forest focus:bg-paper focus:ring-2 focus:ring-forest/15"
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
                        type={showSignupPassword ? "text" : "password"}
                        required
                        value={signupForm.password}
                        onChange={(e) =>
                          setSignupForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-ink/15 bg-cream/40 py-2.5 pl-10 pr-9 text-sm font-medium text-ink outline-none transition placeholder:text-muted/60 focus:border-forest focus:bg-paper focus:ring-2 focus:ring-forest/15"
                      />
                      <button
                        type="button"
                        aria-label={showSignupPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowSignupPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                      >
                        {showSignupPassword ? (
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
                        type={showSignupPassword ? "text" : "password"}
                        required
                        value={signupForm.confirmPassword}
                        onChange={(e) =>
                          setSignupForm((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-ink/15 bg-cream/40 py-2.5 pl-10 pr-3.5 text-sm font-medium text-ink outline-none transition placeholder:text-muted/60 focus:border-forest focus:bg-paper focus:ring-2 focus:ring-forest/15"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Worker Profile Details Section */}
              <div className="border-t border-ink/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-forest">
                  2. Gig Delivery Profile
                </p>

                <div className="mt-3 space-y-4">
                  {/* Platform Choice */}
                  <div>
                    <label className="block text-xs font-semibold text-muted">
                      Primary delivery platform
                    </label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {PLATFORMS.map((platform) => {
                        const active = signupForm.platform === platform;
                        return (
                          <button
                            key={platform}
                            type="button"
                            data-active={active}
                            onClick={() =>
                              setSignupForm((prev) => ({ ...prev, platform }))
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
                    {/* City */}
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
                          value={signupForm.city}
                          onChange={(e) =>
                            setSignupForm((prev) => ({ ...prev, city: e.target.value }))
                          }
                          placeholder="e.g. Bengaluru"
                          className="w-full rounded-2xl border border-ink/15 bg-cream/40 py-2.5 pl-8 pr-3 text-xs font-medium text-ink outline-none transition focus:border-forest focus:bg-paper"
                        />
                      </div>
                    </div>

                    {/* Average Daily Income */}
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
                          value={signupForm.average_daily_income}
                          onChange={(e) =>
                            setSignupForm((prev) => ({
                              ...prev,
                              average_daily_income: e.target.value,
                            }))
                          }
                          placeholder="850"
                          className="w-full rounded-2xl border border-ink/15 bg-cream/40 py-2.5 pl-8 pr-3 text-xs font-medium text-ink outline-none transition focus:border-forest focus:bg-paper"
                        />
                      </div>
                    </div>

                    {/* Experience days */}
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
                          value={signupForm.experience_days}
                          onChange={(e) =>
                            setSignupForm((prev) => ({
                              ...prev,
                              experience_days: e.target.value,
                            }))
                          }
                          placeholder="120"
                          className="w-full rounded-2xl border border-ink/15 bg-cream/40 py-2.5 pl-8 pr-3 text-xs font-medium text-ink outline-none transition focus:border-forest focus:bg-paper"
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
                  Create account & get covered
                  <ArrowRight aria-hidden="true" className="size-4" />
                </>
              )}
            </Button>

            <p className="mt-6 text-center text-xs text-muted">
              Already registered?{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setError(null);
                }}
                className="font-semibold text-forest underline hover:text-forest-dark"
              >
                Log in here
              </button>
            </p>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="page-container flex min-h-[50vh] items-center justify-center">
          <LoaderCircle className="size-8 animate-spin text-forest" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
