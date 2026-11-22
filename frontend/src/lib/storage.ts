import { DISRUPTIONS, type Disruption } from "@/lib/disruptions";
import type {
  AuthUser,
  LocationRisk,
  PricingEstimate,
} from "@/lib/types";

export { DISRUPTIONS };
export type { Disruption };

const KEYS = {
  activeWorker: "gigguard.activeWorkerId",
  authUser: "gigguard.auth_user",
  estimates: "gigguard.estimates",
} as const;

export interface SavedEstimate {
  estimate: PricingEstimate;
  locationRisk: LocationRisk;
  riskScore: number;
  workDaysPerWeek: number;
  savedAt: string;
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
