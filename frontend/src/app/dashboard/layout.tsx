import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Worker dashboard",
  description:
    "View your worker profile and estimated weekly premium in the GIG-Guard prototype.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
