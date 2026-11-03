"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LoaderCircle, LogIn, Sparkles, UserPlus } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { cn } from "@/lib/format";
import { useAuth } from "@/lib/use-auth";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const redirectPath = searchParams.get("redirect");

  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const { isLoggedIn, isAdmin } = useAuth();

  // If already logged in, redirect appropriately
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    router.push(redirectPath || (isAdmin ? "/admin" : "/dashboard"));
  }, [isLoggedIn, isAdmin, redirectPath, router]);

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <p className="eyebrow inline-flex">
            <Sparkles aria-hidden="true" className="size-3.5 text-forest" />
            GIG-Guard Access
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {activeTab === "login"
              ? "Welcome back"
              : "Create your worker account"}
          </h1>
          <p className="mt-2 text-sm text-muted sm:text-base">
            {activeTab === "login"
              ? "Sign in to manage your protection, policies and weather disruption claims."
              : "Register as a delivery partner to get personalized weekly income cover."}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 rounded-2xl border border-ink/10 bg-cream/70 p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
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
            onClick={() => setActiveTab("signup")}
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

        {activeTab === "login" ? (
          <LoginForm
            redirectPath={redirectPath}
            onSwitch={() => setActiveTab("signup")}
          />
        ) : (
          <SignupForm
            redirectPath={redirectPath}
            onSwitch={() => setActiveTab("login")}
          />
        )}
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
