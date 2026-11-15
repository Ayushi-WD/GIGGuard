import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Worker registration",
  description:
    "Create a GIG-Guard worker profile with your city, delivery platform, average daily income and experience.",
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
