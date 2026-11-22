import { clearAuthUser, getAuthUser } from "@/lib/storage";
import type {
  AuthResponse,
  BackendClaim,
  BackendPayout,
  LoginCredentials,
  PolicyRecord,
  PricingEstimate,
  PricingRequest,
  SignUpPayload,
  SimulateRequest,
  SimulateResponse,
  Worker,
  WorkerCreate,
} from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/api/backend";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = RequestInit & {
  json?: unknown;
};

function extractMessage(body: unknown, status: number): string {
  let messageFromDetail: string | null = null;

  if (typeof body === "string" && body.trim()) {
    messageFromDetail = body;
  } else if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;

    if (typeof detail === "string") {
      messageFromDetail = detail;
    } else if (Array.isArray(detail)) {
      messageFromDetail = detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            const record = item as { loc?: unknown; msg?: unknown };
            const location = Array.isArray(record.loc)
              ? record.loc.filter((part) => part !== "body").join(".")
              : "";
            return `${location ? `${location}: ` : ""}${String(record.msg)}`;
          }
          return String(item);
        })
        .join(" · ");
    }
  }

  // Readable status messages for specific HTTP codes
  switch (status) {
    case 401:
      return (
        messageFromDetail ??
        "Session expired or unauthenticated. Please log in again."
      );
    case 403:
      return (
        messageFromDetail ??
        "Access denied. You do not have permission to view or manage this resource."
      );
    case 409:
      return (
        messageFromDetail ??
        "This worker already has an active policy for this week."
      );
    case 422:
      return (
        messageFromDetail ??
        "Invalid request. Please ensure values are within valid limits (premium must be between ₹49 and ₹99)."
      );
    case 429:
      return (
        messageFromDetail ??
        "Too many requests. Please wait a moment before trying again."
      );
    default:
      return messageFromDetail ?? "Something went wrong. Please try again.";
  }
}

async function request<T>(
  path: string,
  { json, headers, ...options }: RequestOptions = {},
): Promise<T> {
  let response: Response;

  // Retrieve token from saved login in localStorage
  const authUser = getAuthUser();
  const token = authUser?.token;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : options.body,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Can't reach the GIG-Guard API. Make sure the backend is running on port 8000.",
      0,
    );
  }

  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthUser();
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
      ) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname,
        )}`;
      }
    }

    throw new ApiError(extractMessage(body, response.status), response.status, body);
  }

  return body as T;
}

export function getWorkers(signal?: AbortSignal) {
  return request<Worker[]>("/workers", { signal });
}

export function getWorker(workerId: string, signal?: AbortSignal) {
  return request<Worker>(`/workers/${encodeURIComponent(workerId)}`, {
    signal,
  });
}

export function registerWorker(payload: WorkerCreate) {
  return request<Worker>("/workers", { method: "POST", json: payload });
}

export function estimatePremium(payload: PricingRequest) {
  return request<PricingEstimate>("/pricing/estimate", {
    method: "POST",
    json: payload,
  });
}

export function loginUser(payload: LoginCredentials) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    json: payload,
  });
}

export function signupUser(payload: SignUpPayload) {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    json: payload,
  });
}

// ---------------------------------------------------------------------------
// Policies, Claims, Payouts, and Simulation endpoints
// ---------------------------------------------------------------------------

export function activatePolicy(payload: {
  worker_id: string;
  premium: number;
  risk_score: number;
}) {
  return request<PolicyRecord>("/policies", {
    method: "POST",
    json: payload,
  });
}

export function getWorkerPolicies(workerId: string, signal?: AbortSignal) {
  return request<PolicyRecord[]>(
    `/policies/worker/${encodeURIComponent(workerId)}`,
    { signal },
  );
}

export function getWorkerClaims(workerId: string, signal?: AbortSignal) {
  return request<BackendClaim[]>(
    `/claims/worker/${encodeURIComponent(workerId)}`,
    { signal },
  );
}

export function getWorkerPayouts(workerId: string, signal?: AbortSignal) {
  return request<BackendPayout[]>(
    `/payouts/worker/${encodeURIComponent(workerId)}`,
    { signal },
  );
}

export function simulateDisruption(
  payload: SimulateRequest,
  autoApprove = true,
) {
  return request<SimulateResponse>(
    `/simulate/disruption?auto_approve=${autoApprove}`,
    {
      method: "POST",
      json: payload,
    },
  );
}
