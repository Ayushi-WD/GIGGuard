import { Lock, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SignInPrompt({
  icon: Icon = Lock,
  title,
  description,
  children,
  tone = "default",
}: {
  icon?: LucideIcon;
  title: string;
  description: ReactNode;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  const danger = tone === "danger";

  return (
    <div className="page-container py-16 sm:py-24">
      <div
        className={
          danger
            ? "mx-auto max-w-md rounded-3xl border border-danger/20 bg-paper p-8 text-center shadow-soft"
            : "mx-auto max-w-md rounded-3xl border border-ink/10 bg-paper p-8 text-center shadow-soft"
        }
      >
        <div
          className={
            danger
              ? "mx-auto grid size-14 place-items-center rounded-2xl bg-danger/10 text-danger"
              : "mx-auto grid size-14 place-items-center rounded-2xl bg-forest-light text-forest"
          }
        >
          <Icon aria-hidden="true" className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        <div className="mt-6 flex flex-col gap-2.5">{children}</div>
      </div>
    </div>
  );
}
