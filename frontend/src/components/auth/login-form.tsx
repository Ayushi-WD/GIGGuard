import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";

import { AuthError } from "@/components/auth/auth-error";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

export function LoginForm({
  redirectPath,
  onSwitch,
}: {
  redirectPath: string | null;
  onSwitch: () => void;
}) {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.username.trim() || !form.password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await login({
        username: form.username,
        password: form.password,
      });

      router.push(
        redirectPath || (user.role === "admin" ? "/admin" : "/dashboard"),
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "Invalid username or password.",
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
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
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
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                placeholder="••••••••"
                className="w-full rounded-2xl border border-ink/15 bg-cream/40 py-3 pl-11 pr-11 text-sm font-medium text-ink outline-none transition placeholder:text-muted/60 focus:border-forest focus:bg-paper focus:ring-2 focus:ring-forest/15"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                {showPassword ? (
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
              onClick={() => {
                setForm({ username: "admin", password: "admin123" });
                setError(null);
              }}
              className="rounded-lg border border-forest/30 bg-paper px-2.5 py-1 text-[11px] font-semibold text-forest transition hover:bg-forest hover:text-cream"
            >
              Fill credentials
            </button>
          </div>
          <p className="mt-2 text-xs text-forest/80">
            Username: <code className="font-semibold text-ink">admin</code>{" "}
            &nbsp;|&nbsp; Password:{" "}
            <code className="font-semibold text-ink">admin123</code>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Don&apos;t have an account yet?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-semibold text-forest underline hover:text-forest-dark"
          >
            Sign up as worker
          </button>
        </p>
      </form>
    </>
  );
}
