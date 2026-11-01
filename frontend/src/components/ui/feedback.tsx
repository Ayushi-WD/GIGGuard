import type { LucideIcon } from "lucide-react";
import { CircleAlert, LoaderCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/format";
import type { ClaimStatus } from "@/lib/storage";
import type { Platform } from "@/lib/types";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center gap-3 rounded-3xl border border-ink/10 bg-paper/60 px-6 py-12 text-center">
      <LoaderCircle
        aria-hidden="true"
        className="size-7 animate-spin text-forest"
      />
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  title = "Could not load this page",
}: {
  message: string;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-3xl border border-danger/20 bg-danger/5 px-6 py-8 sm:px-8"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
          <CircleAlert aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{message}</p>
          {onRetry ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              className="mt-4"
            >
              <RefreshCw aria-hidden="true" className="size-3.5" />
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-3xl border border-dashed border-ink/15 bg-paper/50 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-forest-light text-forest">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

const platformStyles: Record<Platform, string> = {
  Swiggy: "bg-heat/10 text-heat ring-heat/15",
  Zomato: "bg-danger/10 text-danger ring-danger/15",
  Zepto: "bg-smog/10 text-smog ring-smog/15",
};

export function PlatformBadge({
  platform,
  className,
}: {
  platform: Platform;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ring-1 ring-inset",
        platformStyles[platform],
        className,
      )}
    >
      {platform}
    </span>
  );
}

const claimStyles: Record<ClaimStatus, string> = {
  "Under review": "bg-heat/10 text-heat ring-heat/20",
  Approved: "bg-forest-light text-forest ring-forest/20",
  Rejected: "bg-danger/10 text-danger ring-danger/20",
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ring-1 ring-inset",
        claimStyles[status],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "Approved"
            ? "bg-forest"
            : status === "Rejected"
              ? "bg-danger"
              : "bg-heat",
        )}
      />
      {status}
    </span>
  );
}
