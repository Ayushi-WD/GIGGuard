import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Logo } from "@/components/logo";

const productLinks = [
  { href: "/register", label: "Register" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/policy", label: "Disruptions & claims" },
  { href: "/admin", label: "Admin" },
];

const learnLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#benefits", label: "Benefits" },
  { href: "/about", label: "About & FAQ" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-navy text-white">
      <div className="page-container py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo inverse />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              Helping gig delivery workers understand their disruption risk and
              estimate a weekly premium built around their profile.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white/70">
              <span className="size-2 rounded-full bg-teal-light" />
              Prototype · estimates only
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-light">
              Product
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/65">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-light">
              Learn
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/65">
              {learnLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-light">
              API
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/65">
              <li>
                <a
                  href="http://127.0.0.1:8001/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition hover:text-white"
                >
                  Swagger docs
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="http://127.0.0.1:8001/health"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition hover:text-white"
                >
                  API health
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 GIG-Guard. A BTech CSE major project prototype.</p>
          <p className="max-w-xl sm:text-right">
            Not a licensed insurer. Premiums are estimates only. No policy is
            issued, no payment is taken and no payout is made.
          </p>
        </div>
      </div>
    </footer>
  );
}
