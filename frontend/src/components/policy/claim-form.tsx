import { useState } from "react";
import {
  ArrowRight,
  BadgeIndianRupee,
  Check,
  FileText,
  Info,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { DISRUPTIONS, DISRUPTION_META } from "@/lib/disruptions";
import { cn, formatINR, todayISO } from "@/lib/format";
import {
  createClaim,
  estimatedPayout,
  getClaimsForWorker,
  type ClaimRecord,
  type Disruption,
  type PolicyRecord,
  type SavedEstimate,
} from "@/lib/storage";
import type { Worker } from "@/lib/types";

export function ClaimForm({
  worker,
  policy,
  savedEstimate,
  onActivate,
  onFiled,
}: {
  worker: Worker;
  policy: PolicyRecord | null;
  savedEstimate: SavedEstimate | null;
  onActivate: () => void;
  onFiled: (claims: ClaimRecord[]) => void;
}) {
  const [disruption, setDisruption] = useState<Disruption>("Rain");
  const [incidentDate, setIncidentDate] = useState(todayISO());
  const [hoursLost, setHoursLost] = useState(4);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!policy) {
      setError("Activate a policy before filing a claim.");
      return;
    }

    if (!Number.isFinite(hoursLost) || hoursLost <= 0 || hoursLost > 12) {
      setError("Hours lost must be between 1 and 12.");
      return;
    }

    if (!incidentDate) {
      setError("Choose the date the disruption happened.");
      return;
    }

    setSubmitting(true);

    try {
      createClaim({
        worker,
        policy,
        disruption,
        incidentDate,
        hoursLost,
        description: description.trim(),
      });
      onFiled(getClaimsForWorker(worker.id));
      setSuccess(true);
      setDescription("");
      setHoursLost(4);
      setIncidentDate(todayISO());
    } catch {
      setError("Could not file this claim. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card-surface p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">File a claim</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Lost hours? Tell us what happened.
          </h2>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-forest-light text-forest">
          <FileText aria-hidden="true" className="size-5" />
        </span>
      </div>

      {!policy ? (
        <div className="mt-6">
          <EmptyState
            icon={ShieldCheck}
            title="Activate a policy to claim"
            description="Claims are available once you have an active weekly policy for this worker."
            action={
              savedEstimate ? (
                <Button onClick={onActivate} size="sm">
                  Activate policy
                </Button>
              ) : (
                <ButtonLink href={`/dashboard/${worker.id}/premium`} size="sm">
                  Calculate premium
                </ButtonLink>
              )
            }
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <fieldset>
            <legend className="field-label">Disruption type</legend>
            <div className="grid grid-cols-3 gap-2">
              {DISRUPTIONS.map((item) => {
                const meta = DISRUPTION_META[item];
                const Icon = meta.icon;
                const active = disruption === item;

                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setDisruption(item)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      active
                        ? "border-forest bg-forest-light"
                        : "border-ink/10 bg-paper hover:border-forest/30",
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "size-4",
                        active ? "text-forest" : "text-muted",
                      )}
                    />
                    <span className="mt-2 block text-xs font-semibold">
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="incident-date" className="field-label">
                Date of disruption
              </label>
              <input
                id="incident-date"
                type="date"
                max={todayISO()}
                value={incidentDate}
                onChange={(event) => setIncidentDate(event.target.value)}
                className="field-input"
                required
              />
            </div>
            <div>
              <label htmlFor="hours-lost" className="field-label">
                Hours lost
              </label>
              <input
                id="hours-lost"
                type="number"
                min={1}
                max={12}
                step={1}
                value={hoursLost}
                onChange={(event) =>
                  setHoursLost(
                    Number.isFinite(Number(event.target.value))
                      ? Number(event.target.value)
                      : 1,
                  )
                }
                className="field-input"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="claim-note" className="field-label">
              What happened?{" "}
              <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="claim-note"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Heavy rain flooded the route and deliveries were paused for four hours."
              className="field-input resize-none"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl bg-forest-light/60 px-4 py-3.5">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">
                Indicative payout
              </p>
              <p className="mt-1 text-xl font-semibold text-forest">
                {formatINR(estimatedPayout(policy, hoursLost), { decimals: 2 })}
              </p>
            </div>
            <BadgeIndianRupee
              aria-hidden="true"
              className="size-6 text-forest/50"
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          ) : null}

          {success ? (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-forest/20 bg-forest-light px-4 py-3 text-sm text-forest"
            >
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Claim filed. It is now under review in the admin queue.
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
                Filing claim…
              </>
            ) : (
              <>
                File claim
                <ArrowRight aria-hidden="true" className="size-4" />
              </>
            )}
          </Button>

          <p className="flex items-start gap-2 text-[0.68rem] leading-relaxed text-muted">
            <Info
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0 text-forest"
            />
            Payouts are indicative and based on your daily income and hours
            lost. No real money is transferred.
          </p>
        </form>
      )}
    </div>
  );
}
