"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";
import { cn, initials } from "@/lib/format";
import { useAuth } from "@/lib/use-auth";

type NavLink = { href: string; label: string };

function isActive(pathname: string, href: string) {
  if (href.includes("#")) {
    return false;
  }

  const path = href.split("#")[0];

  if (path === "/") {
    return pathname === "/";
  }

  // A worker dashboard link should not stay active on its premium sub-page.
  if (/^\/dashboard\/[^/]+$/.test(path)) {
    return pathname === path;
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoggedIn, isAdmin, logout } = useAuth();

  const workerId = user?.worker_id ?? null;
  const dashboardHref = workerId ? `/dashboard/${workerId}` : "/dashboard";
  const premiumHref = workerId
    ? `/dashboard/${workerId}/premium`
    : "/dashboard";

  let navLinks: NavLink[];

  if (!isLoggedIn) {
    navLinks = [
      { href: "/", label: "Home" },
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/#benefits", label: "Benefits" },
      { href: "/about", label: "About Us" },
    ];
  } else if (isAdmin) {
    navLinks = [
      { href: "/", label: "Home" },
      { href: "/admin", label: "Admin Console" },
      { href: "/about", label: "About & FAQ" },
    ];
  } else {
    navLinks = [
      { href: dashboardHref, label: "Dashboard" },
      { href: `${dashboardHref}#profile`, label: "My Profile" },
      { href: premiumHref, label: "Premium Calculator" },
      { href: "/about#faq", label: "Help" },
    ];
  }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    router.push("/");
  }

  const displayName = user?.full_name || user?.username || "User";
  const userInitials = initials(displayName);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-xl">
      <div className="page-container flex h-[4.5rem] items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition",
                  active
                    ? "bg-teal-light text-teal-dark"
                    : "text-muted hover:bg-navy/5 hover:text-navy",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          {!isLoggedIn ? (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold text-navy transition hover:bg-navy/5"
              >
                <LogIn aria-hidden="true" className="size-4" />
                Login
              </Link>
              <Link href="/register" className={buttonClasses({ size: "md" })}>
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                href={isAdmin ? "/admin" : `${dashboardHref}#profile`}
                className="flex items-center gap-2 rounded-full border border-line bg-white px-2 py-1.5 pr-3 transition hover:border-teal/30 hover:bg-teal-light/40"
                title="Open profile"
              >
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-[11px] font-semibold text-white",
                    isAdmin ? "bg-navy" : "bg-teal",
                  )}
                >
                  {isAdmin ? (
                    <ShieldCheck aria-hidden="true" className="size-3.5" />
                  ) : (
                    userInitials
                  )}
                </span>
                <span className="max-w-[120px] truncate text-xs font-semibold text-navy">
                  {displayName}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="grid size-9 place-items-center rounded-full border border-line bg-white text-muted transition hover:border-danger/30 hover:bg-danger/10 hover:text-danger"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="grid size-10 place-items-center rounded-full border border-line bg-white text-navy lg:hidden"
        >
          {menuOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-line bg-paper px-5 pb-5 pt-3 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-teal-light text-teal-dark"
                      : "text-muted hover:bg-navy/5 hover:text-navy",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-line pt-4">
            {!isLoggedIn ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className={buttonClasses({
                    variant: "secondary",
                    size: "md",
                  })}
                >
                  <LogIn aria-hidden="true" className="size-4" />
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className={buttonClasses({ size: "md" })}
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-mist p-3">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-full text-sm font-semibold text-white",
                      isAdmin ? "bg-navy" : "bg-teal",
                    )}
                  >
                    {isAdmin ? (
                      <ShieldCheck aria-hidden="true" className="size-5" />
                    ) : (
                      <UserRound aria-hidden="true" className="size-5" />
                    )}
                  </span>
                  <div>
                    <p className="font-semibold text-navy">{displayName}</p>
                    <p className="text-xs text-muted">
                      {isAdmin
                        ? "Administrator"
                        : `Gig worker${
                            user?.worker?.platform
                              ? ` · ${user.worker.platform}`
                              : ""
                          }`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={isAdmin ? "/admin" : dashboardHref}
                    onClick={() => setMenuOpen(false)}
                    className={buttonClasses({
                      variant: "secondary",
                      size: "md",
                    })}
                  >
                    <LayoutDashboard aria-hidden="true" className="size-4" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={buttonClasses({
                      variant: "danger",
                      size: "md",
                      className: "w-full",
                    })}
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
