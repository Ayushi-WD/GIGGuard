import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Log in to GIG-Guard to open your worker dashboard and premium estimate.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
