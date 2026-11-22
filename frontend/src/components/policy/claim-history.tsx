import { CalendarDays, CheckCircle2, Clock, DollarSign, ShieldAlert, Sparkles } from "lucide-react";

import { ClaimStatusBadge, EmptyState } from "@/components/ui/feedback";
import { formatDate, formatINR } from "@/lib/format";
import type { BackendClaim, BackendPayout } from "@/lib/types";

export function ClaimHistory({
  claims,
  payouts = [],
}: {
  claims: BackendClaim[];
  payouts?: BackendPayout[];
}) {
  return (
    <div className="space-y-6">
      {/* Parametric Notice */}
      <div className="rounded-2xl border border-teal/20 bg-teal-light/40 p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-light text-teal-dark">
            <Sparkles aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
              Parametric Insurance Engine
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Workers never have to file a claim. When automated weather and
              environmental triggers detect disruptions in your city, claims are
              created and paid automatically to your account.
            </p>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Claims record</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-navy">
              {claims.length === 0
                ? "No claims recorded"
                : `${claims.length} ${claims.length === 1 ? "claim" : "claims"} triggered`}
            </h2>
          </div>
          <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-muted">
            Read-only
          </span>
        </div>

        {claims.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={CalendarDays}
              title="No disruption claims"
              description="No environmental disruptions have triggered a claim for your zone during active policy periods."
            />
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {claims.map((claim) => (
              <li
                key={claim.id}
                className="rounded-2xl border border-line bg-mist/50 p-4 transition hover:bg-mist/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-light text-teal-dark">
                      <ShieldAlert aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        Claim {claim.id.slice(0, 8)}…
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Triggered on {formatDate(claim.created_at)}
                      </p>
                    </div>
                  </div>
                  <ClaimStatusBadge status={claim.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-muted block">Payout amount</span>
                    <span className="font-semibold text-navy">
                      {formatINR(claim.payout_amount, { decimals: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Event ID</span>
                    <span className="font-mono text-[0.7rem] text-muted">
                      {claim.event_id ? `${claim.event_id.slice(0, 8)}…` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Fraud check</span>
                    <span className="font-medium text-navy">
                      {claim.fraud_score !== null && claim.fraud_score !== undefined
                        ? `Score: ${claim.fraud_score}`
                        : "Verified (Auto)"}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Payouts List */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Payouts history</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-navy">
              {payouts.length === 0
                ? "No payouts disbursed yet"
                : `${payouts.length} ${payouts.length === 1 ? "payout" : "payouts"} received`}
            </h2>
          </div>
          <span className="rounded-full bg-success/10 text-success border border-success/20 px-3 py-1 text-xs font-semibold">
            Direct deposit
          </span>
        </div>

        {payouts.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={DollarSign}
              title="No payouts disbursed"
              description="When claims are approved, direct financial support is credited immediately and recorded here."
            />
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {payouts.map((payout) => (
              <li
                key={payout.id}
                className="rounded-2xl border border-success/20 bg-success/5 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                      <CheckCircle2 aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        Disbursed {formatINR(payout.amount, { decimals: 2 })}
                      </p>
                      <p className="mt-0.5 text-xs text-muted flex items-center gap-1.5">
                        <Clock aria-hidden="true" className="size-3 text-muted" />
                        {formatDate(payout.paid_at)}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[0.7rem] text-muted">
                    Claim: {payout.claim_id.slice(0, 8)}…
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
