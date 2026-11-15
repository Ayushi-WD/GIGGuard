import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Worker dashboard",
  description:
    "Your GIG-Guard worker profile, risk level and latest premium estimate.",
};

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return children;
}
