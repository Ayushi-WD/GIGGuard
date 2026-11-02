"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn, LogOut, Menu, ShieldCheck, User, X } from "lucide-react";

import { Logo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";
import { cn, initials } from "@/lib/format";
import { useAuth } from "@/lib/use-auth";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoggedIn, isAdmin, logout } = useAuth();

  // Dynamic nav links according to authentication status and role
  let navLinks: { href: string; label: string }[] = [{ href: "/", label: "Home" }];

  if (isLoggedIn) {
    if (isAdmin) {
      // Admin sees Home and Admin Dashboard
      navLinks = [
        { href: "/", label: "Home" },
        { href: "/admin", label: "Admin" },
      ];
    } else {
      // Worker sees Home, Dashboard, and Policy & claims (NO Admin!)
      navLinks = [
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/policy", label: "Policy & claims" },
      ];
    }
  }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    router.push("/");
  }

  const displayName = user?.full_name || user?.username || "User";
  const userInitials = initials(displayName);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/85 backdrop-blur-xl">
      <div className="page-container flex h-[4.5rem] items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition",
                  active
                    ? "bg-forest-light text-forest"
                    : "text-muted hover:bg-ink/5 hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side authentication actions */}
        <div className="hidden items-center gap-3 md:flex">
          {!isLoggedIn ? (
            <Link
              href="/login"
              className={buttonClasses({ size: "md" })}
            >
              <LogIn aria-hidden="true" className="size-4" />
              Log in
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-xs",
                  isAdmin
                    ? "border-forest/25 bg-forest-light/60 text-forest"
                    : "border-ink/10 bg-paper text-ink",
                )}
              >
                <div
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-[11px] font-semibold text-cream",
                    isAdmin ? "bg-forest text-lime" : "bg-forest",
                  )}
                >
                  {isAdmin ? (
                    <ShieldCheck aria-hidden="true" className="size-3.5" />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="max-w-[130px] truncate font-semibold leading-tight text-ink">
                    {displayName}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted">
                    {isAdmin ? "Admin" : (user?.worker?.platform ?? "Worker")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3 py-2 text-xs font-semibold text-muted transition hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
                title="Log out"
              >
                <LogOut aria-hidden="true" className="size-3.5" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="grid size-10 place-items-center rounded-full border border-ink/15 bg-paper text-ink md:hidden"
        >
          {menuOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-ink/10 bg-paper px-5 pb-5 pt-3 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-forest-light text-forest"
                      : "text-muted hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-ink/10 pt-4">
            {!isLoggedIn ? (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className={buttonClasses({ size: "md", className: "w-full" })}
              >
                <LogIn aria-hidden="true" className="size-4" />
                Log in
              </Link>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-cream/50 p-3">
                  <div
                    className={cn(
                      "grid size-10 place-items-center rounded-full text-sm font-semibold text-cream",
                      isAdmin ? "bg-forest text-lime" : "bg-forest",
                    )}
                  >
                    {isAdmin ? (
                      <ShieldCheck aria-hidden="true" className="size-5" />
                    ) : (
                      <User aria-hidden="true" className="size-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{displayName}</p>
                    <p className="text-xs text-muted">
                      {isAdmin ? "Administrator" : `Gig Worker • ${user?.worker?.platform ?? ""}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger/10 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/20"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
