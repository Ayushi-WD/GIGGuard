import Link from "next/link";

import { cn } from "@/lib/format";

type LogoProps = {
  className?: string;
  inverse?: boolean;
};

export function Logo({ className, inverse = false }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="GIG-Guard home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl shadow-sm transition-transform duration-300 group-hover:-rotate-3",
          inverse ? "bg-teal text-white" : "bg-navy text-white",
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 32 32"
          className="size-6"
          fill="none"
        >
          <path
            d="M16 3.2 26.2 7v7.6c0 6.6-4.2 11.7-10.2 14.2C10 26.3 5.8 21.2 5.8 14.6V7L16 3.2Z"
            fill="currentColor"
          />
          <path
            d="m17.7 9.1-6.2 8.4h4.2l-1.2 5.9 6.2-8.4h-4.2l1.2-5.9Z"
            fill={inverse ? "#0e7c72" : "#5eead4"}
          />
        </svg>
      </span>
      <span
        className={cn(
          "text-[1.06rem] font-semibold tracking-tight",
          inverse ? "text-white" : "text-navy",
        )}
      >
        GIG
        <span className={inverse ? "text-teal-light" : "text-teal"}>-</span>
        Guard
      </span>
    </Link>
  );
}
