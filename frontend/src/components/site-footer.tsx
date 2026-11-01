import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Logo } from "@/components/logo";

const footerLinks = [
  { href: "/register", label: "Register" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/policy", label: "Policy & claims" },
  { href: "/admin", label: "Admin" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-forest-dark text-cream">
      <div className="page-container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo inverse />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/65">
              Weekly income protection built for India&apos;s delivery partners.
              Because a rainy Tuesday should not become a lost week.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cream/15 bg-cream/5 px-3.5 py-2 text-xs text-cream/75">
              <span className="status-dot" />
              Prototype · ₹49–₹99 weekly cover
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-cream/70">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">
              API
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-cream/70">
              <li>
                <a
                  href="http://127.0.0.1:8001/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition hover:text-cream"
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
                  className="inline-flex items-center gap-1.5 transition hover:text-cream"
                >
                  API health
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-cream/10 pt-6 text-xs leading-relaxed text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 GIG-Guard. A BTech CSE major project prototype.</p>
          <p className="max-w-md sm:text-right">
            Not a licensed insurer. Policies, premiums and claims shown here are
            simulated for demonstration.
          </p>
        </div>
      </div>
    </footer>
  );
}
