export const PLATFORMS = ["Swiggy", "Zomato", "Zepto"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const LOCATION_RISKS = ["low", "medium", "high"] as const;
export type LocationRisk = (typeof LOCATION_RISKS)[number];

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
