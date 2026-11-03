import { DISRUPTIONS, type Disruption } from "@/lib/disruptions";
import type {
  AuthUser,
  LocationRisk,
  Platform,
  PricingEstimate,
  Worker,
} from "@/lib/types";

export { DISRUPTIONS };
export type { Disruption };

const KEYS = {
  activeWorker: "gigguard.activeWorkerId",
  authUser: "gigguard.auth_user",
  estimates: "gigguard.estimates",
  policies: "gigguard.policies",
  claims: "gigguard.claims",
} as const;

export interface SavedEstimate {
  estimate: PricingEstimate;
  locationRisk: LocationRisk;
  riskScore: number;
  workDaysPerWeek: number;
  savedAt: string;
}

export interface PolicyRecord {
  id: string;
  workerId: string;
  workerName: string;
  plan: "GIG-Guard Weekly";
  premium: number;
  weeklyIncome: number;
  coverageCap: number;
  locationRisk: LocationRisk;
  riskScore: number;
  workDaysPerWeek: number;
  status: "Active";
  startedAt: string;
  renewsAt: string;
}

export const CLAIM_STATUSES = ["Under review", "Approved", "Rejected"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface ClaimRecord {
  id: string;
  workerId: string;
  workerName: string;
  platform: Platform;
  city: string;
  disruption: Disruption;
  incidentDate: string;
  hoursLost: number;
  description: string;
  payout: number;
  status: ClaimStatus;
  createdAt: string;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing.
  }
}

function makeId(prefix: string) {
  if (typeof window !== "undefined" && "randomUUID" in window.crypto) {
    return `${prefix}_${window.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getAuthUser(): AuthUser | null {
  return read<AuthUser | null>(KEYS.authUser, null);
}

export function saveAuthUser(user: AuthUser) {
  write(KEYS.authUser, user);
  if (user.worker_id) {
    rememberWorker(user.worker_id);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gigguard-auth-change"));
  }
}

export function clearAuthUser() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(KEYS.authUser);
    } catch {
      // Ignore storage errors.
    }
    forgetWorker();
    window.dispatchEvent(new Event("gigguard-auth-change"));
  }
}

export function getActiveWorkerId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(KEYS.activeWorker);
  } catch {
    return null;
  }
}

export function rememberWorker(workerId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(KEYS.activeWorker, workerId);
  } catch {
    // Ignore storage errors.
  }
}

export function forgetWorker() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(KEYS.activeWorker);
  } catch {
    // Ignore storage errors.
  }
}

export function getSavedEstimate(workerId: string): SavedEstimate | null {
  const estimates = read<Record<string, SavedEstimate>>(KEYS.estimates, {});
  return estimates[workerId] ?? null;
}

export function saveEstimate(
  workerId: string,
  estimate: PricingEstimate,
  meta: Pick<SavedEstimate, "locationRisk" | "riskScore" | "workDaysPerWeek">,
) {
  const estimates = read<Record<string, SavedEstimate>>(KEYS.estimates, {});
  estimates[workerId] = {
    estimate,
    ...meta,
    savedAt: new Date().toISOString(),
  };
  write(KEYS.estimates, estimates);
  rememberWorker(workerId);
}

export function getPolicy(workerId: string): PolicyRecord | null {
  const policies = read<PolicyRecord[]>(KEYS.policies, []);
  return policies.find((policy) => policy.workerId === workerId) ?? null;
}

export function getAllPolicies(): PolicyRecord[] {
  return read<PolicyRecord[]>(KEYS.policies, []);
}

export function savePolicy(policy: PolicyRecord) {
  const policies = read<PolicyRecord[]>(KEYS.policies, []);
  const next = policies.filter((item) => item.workerId !== policy.workerId);
  next.push(policy);
  write(KEYS.policies, next);
}

export function activatePolicy(
  worker: Worker,
  saved: SavedEstimate,
): PolicyRecord {
  const startedAt = new Date();
  const renewsAt = new Date(startedAt);
  renewsAt.setDate(renewsAt.getDate() + 7);

  const policy: PolicyRecord = {
    id: makeId("pol"),
    workerId: worker.id,
    workerName: worker.full_name,
    plan: "GIG-Guard Weekly",
    premium: Number(saved.estimate.final_weekly_premium),
    weeklyIncome: Number(saved.estimate.weekly_income),
    coverageCap: Math.round(Number(saved.estimate.weekly_income)),
    locationRisk: saved.locationRisk,
    riskScore: saved.riskScore,
    workDaysPerWeek: saved.workDaysPerWeek,
    status: "Active",
    startedAt: startedAt.toISOString(),
    renewsAt: renewsAt.toISOString(),
  };

  savePolicy(policy);
  rememberWorker(worker.id);
  return policy;
}

export function getAllClaims(): ClaimRecord[] {
  return read<ClaimRecord[]>(KEYS.claims, []).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getClaimsForWorker(workerId: string): ClaimRecord[] {
  return getAllClaims().filter((claim) => claim.workerId === workerId);
}

export function addClaim(claim: ClaimRecord) {
  const claims = read<ClaimRecord[]>(KEYS.claims, []);
  claims.push(claim);
  write(KEYS.claims, claims);
}

export function updateClaimStatus(claimId: string, status: ClaimStatus) {
  const claims = read<ClaimRecord[]>(KEYS.claims, []);
  const next = claims.map((claim) =>
    claim.id === claimId ? { ...claim, status } : claim,
  );
  write(KEYS.claims, next);
}

export function estimatedPayout(policy: PolicyRecord, hoursLost: number) {
  const dailyIncome = policy.weeklyIncome / Math.max(policy.workDaysPerWeek, 1);
  const lostFraction = Math.min(Math.max(hoursLost, 0), 12) / 8;
  const payout = dailyIncome * lostFraction;
  return Math.round(Math.min(policy.coverageCap, payout) * 100) / 100;
}

export function createClaim({
  worker,
  policy,
  disruption,
  incidentDate,
  hoursLost,
  description,
}: {
  worker: Worker;
  policy: PolicyRecord;
  disruption: Disruption;
  incidentDate: string;
  hoursLost: number;
  description: string;
}): ClaimRecord {
  const claim: ClaimRecord = {
    id: makeId("clm"),
    workerId: worker.id,
    workerName: worker.full_name,
    platform: worker.platform,
    city: worker.city,
    disruption,
    incidentDate,
    hoursLost,
    description,
    payout: estimatedPayout(policy, hoursLost),
    status: "Under review",
    createdAt: new Date().toISOString(),
  };

  addClaim(claim);
  return claim;
}

export function seedDemoClaims(workers: Worker[]) {
  workers.slice(0, 3).forEach((worker, index) => {
    const hoursLost = [4, 3, 5][index] ?? 4;
    const notes = [
      "Heavy rain stopped deliveries for the evening rush.",
      "Heat advisory in the afternoon; had to pause orders.",
      "Air quality spike made outdoor work unsafe for a few hours.",
    ];
    const disruptions: Disruption[] = ["Rain", "Heat", "Pollution"];

    addClaim({
      id: makeId("clm"),
      workerId: worker.id,
      workerName: worker.full_name,
      platform: worker.platform,
      city: worker.city,
      disruption: disruptions[index] ?? "Rain",
      incidentDate: new Date(Date.now() - index * 86_400_000)
        .toISOString()
        .slice(0, 10),
      hoursLost,
      description: notes[index] ?? notes[0],
      payout: Math.round(
        (Number(worker.average_daily_income) * (hoursLost / 8) + Number.EPSILON) *
          100,
      ) / 100,
      status: index === 2 ? "Approved" : "Under review",
      createdAt: new Date(Date.now() - index * 3_600_000).toISOString(),
    });
  });
}
