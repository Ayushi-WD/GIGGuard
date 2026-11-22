export const PLATFORMS = ["Swiggy", "Zomato", "Zepto"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const LOCATION_RISKS = ["low", "medium", "high"] as const;
export type LocationRisk = (typeof LOCATION_RISKS)[number];

/**
 * Risk score the app sends to the pricing API for each zone.
 * Workers only pick their zone; the score is derived for them.
 */
export const LOCATION_RISK_SCORE: Record<LocationRisk, number> = {
  low: 30,
  medium: 55,
  high: 80,
};

export type UserRole = "admin" | "worker";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  worker_id?: string | null;
  full_name?: string;
  worker?: Worker | null;
  token?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignUpPayload {
  username: string;
  password: string;
  full_name: string;
  city: string;
  platform: Platform;
  average_daily_income: number;
  experience_days: number;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    role: UserRole;
    worker_id: string | null;
    created_at: string;
  };
  worker: Worker | null;
  token: string;
}

export interface Worker {
  id: string;
  full_name: string;
  city: string;
  platform: Platform;
  average_daily_income: string;
  experience_days: number;
  created_at: string;
}

export interface WorkerCreate {
  full_name: string;
  city: string;
  platform: Platform;
  average_daily_income: number;
  experience_days: number;
}

export interface PricingRequest {
  worker_id: string;
  risk_score: number;
  location_risk: LocationRisk;
  work_days_per_week: number;
}

export interface PricingEstimate {
  worker_id: string;
  weekly_income: string;
  risk_score: string;
  base_premium: string;
  risk_loading: string;
  subtotal: string;
  location_adjustment: string;
  experience_adjustment: string;
  raw_premium: string;
  final_weekly_premium: string;
  calculation_method: "simulated_risk_score";
}

export const LOCATION_RISK_COPY: Record<
  LocationRisk,
  { label: string; short: string; description: string }
> = {
  low: {
    label: "Low risk",
    short: "Low",
    description: "Calmer weather and cleaner air in this zone.",
  },
  medium: {
    label: "Medium risk",
    short: "Medium",
    description: "Occasional disruptions across the work week.",
  },
  high: {
    label: "High risk",
    short: "High",
    description: "Frequent rain, heat or pollution disruptions.",
  },
};

export type BackendPolicyStatus = "active" | "expired" | "cancelled";

export interface PolicyRecord {
  id: string;
  worker_id: string;
  week_start: string;
  week_end: string;
  premium: string | number;
  risk_score: number;
  status: BackendPolicyStatus;
  pricing_method?: string;
}

export type BackendClaimStatus = "pending" | "approved" | "review" | "rejected";

export const CLAIM_STATUS_DISPLAY: Record<BackendClaimStatus, string> = {
  pending: "Checking",
  approved: "Approved",
  review: "Under review",
  rejected: "Rejected",
};

export interface BackendClaim {
  id: string;
  policy_id: string;
  event_id: string;
  payout_amount: string;
  status: BackendClaimStatus;
  fraud_score: number | null;
  created_at: string;
}

export interface BackendPayout {
  id: string;
  claim_id: string;
  worker_id: string;
  amount: string;
  paid_at: string;
}

export const DISRUPTION_TYPES = [
  "rain",
  "heat",
  "aqi",
  "flood",
  "curfew",
] as const;

export type DisruptionType = (typeof DISRUPTION_TYPES)[number];

export interface SimulateRequest {
  city: string;
  disruption_type: DisruptionType;
  value: number;
  duration_hours?: number;
}

export interface SimulateResponse {
  triggered: boolean;
  severity_pct: number;
  event_id: string | null;
  claims_created: number;
  total_payout: string | number;
}

