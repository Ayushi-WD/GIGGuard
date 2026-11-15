import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin console",
  description: "Read-only overview of worker profiles in the GIG-Guard prototype.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
