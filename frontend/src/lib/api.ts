import type {
  PricingEstimate,
  PricingRequest,
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

function extractMessage(body: unknown): string {
  if (typeof body === "string" && body.trim()) {
    return body;
  }

  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
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

  return "Something went wrong. Please try again.";
}

async function request<T>(
  path: string,
  { json, headers, ...options }: RequestOptions = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : options.body,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Can't reach the GIG-Guard API. Make sure the backend is running on port 8001.",
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
    throw new ApiError(extractMessage(body), response.status, body);
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
