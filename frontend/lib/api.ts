import type {
  AgentRun,
  AlertItem,
  AutopilotSettings,
  CompetitorTarget,
  DashboardState,
  DashboardProduct,
  ScanResponse
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export function apiBase(): string {
  return API_BASE;
}

export function apiDocsUrl(): string {
  return API_BASE.replace(/\/api\/v1\/?$/, "/docs");
}

async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit, attempts = 4): Promise<Response> {
  let lastError: unknown;
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(input, init);
      if (response.ok || response.status < 500) return response;
      lastError = new Error(`Request failed: ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 800 * (index + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}

export async function fetchDashboard(): Promise<DashboardState> {
  const response = await fetchWithRetry(`${API_BASE}/dashboard`, { cache: "no-store" }, 6);
  if (!response.ok) {
    throw new Error(`Dashboard request failed: ${response.status}`);
  }
  return (await response.json()) as DashboardState;
}

export async function updateSettings(settings: AutopilotSettings): Promise<AutopilotSettings> {
  const response = await fetch(`${API_BASE}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings)
  });
  if (!response.ok) {
    throw new Error(`Settings update failed: ${response.status}`);
  }
  return (await response.json()) as AutopilotSettings;
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const response = await fetchWithRetry(`${API_BASE}/alerts`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Alerts request failed: ${response.status}`);
  }
  return (await response.json()) as AlertItem[];
}

export async function runCompetitorScan(input: {
  product_id: string;
  competitor_url: string;
  competitor_name: string;
}): Promise<ScanResponse> {
  const response = await fetch(`${API_BASE}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Scan failed: ${response.status}`);
  }
  return (await response.json()) as ScanResponse;
}

export async function createTrackedProduct(input: {
  title: string;
  base_cost: number;
  current_price: number;
}): Promise<DashboardProduct> {
  const response = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Product create failed: ${response.status}`);
  }
  return (await response.json()) as DashboardProduct;
}

export async function fetchCompetitorTargets(): Promise<CompetitorTarget[]> {
  const response = await fetchWithRetry(`${API_BASE}/competitor-targets`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Competitor targets request failed: ${response.status}`);
  }
  return (await response.json()) as CompetitorTarget[];
}

export async function createCompetitorTarget(input: {
  product_id: string;
  competitor_name: string;
  competitor_url: string;
}): Promise<CompetitorTarget> {
  const response = await fetch(`${API_BASE}/competitor-targets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Competitor target create failed: ${response.status}`);
  }
  return (await response.json()) as CompetitorTarget;
}

export async function runCompetitorTargetScan(targetId: string): Promise<ScanResponse> {
  const response = await fetch(`${API_BASE}/competitor-targets/${targetId}/scan`, { method: "POST" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Target scan failed: ${response.status}`);
  }
  return (await response.json()) as ScanResponse;
}

export async function fetchScans(): Promise<AgentRun[]> {
  const response = await fetchWithRetry(`${API_BASE}/scans`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Scans request failed: ${response.status}`);
  }
  return (await response.json()) as AgentRun[];
}
