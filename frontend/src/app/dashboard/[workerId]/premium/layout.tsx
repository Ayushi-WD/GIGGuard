import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Premium estimate",
  description:
    "Estimate a weekly premium from your worker profile, risk zone and working days.",
};

export default function PremiumLayout({ children }: { children: ReactNode }) {
  return children;
}
