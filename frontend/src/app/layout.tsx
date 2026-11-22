import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GIG-Guard — Income protection for gig workers",
    template: "%s | GIG-Guard",
  },
  description:
    "GIG-Guard helps gig delivery workers understand and estimate protection against income lost to rain, heat, floods and other disruptions.",
};

export const viewport: Viewport = {
  themeColor: "#0b1f33",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased font-sans"
    >
      <body className="flex min-h-full flex-col bg-mist text-ink">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
