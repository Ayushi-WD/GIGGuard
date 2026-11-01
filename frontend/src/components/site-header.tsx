"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

import { Logo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/format";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/policy", label: "Policy & claims" },
  { href: "/admin", label: "Admin" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/register"
            className={buttonClasses({ size: "md" })}
          >
            Register as worker
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

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
          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className={buttonClasses({ size: "md", className: "mt-4 w-full" })}
          >
            Register as worker
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      ) : null}
    </header>
  );
}
