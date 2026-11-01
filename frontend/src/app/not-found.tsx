import { ArrowLeft, Compass } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-forest-light text-forest">
        <Compass aria-hidden="true" className="size-8" />
      </span>
      <p className="eyebrow mt-6">404 · Route not found</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
        This page took a different route.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        The page you are looking for does not exist. Head back home or open your
        worker dashboard.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ButtonLink href="/" size="md">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back home
        </ButtonLink>
        <ButtonLink href="/dashboard" variant="secondary" size="md">
          Worker dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
