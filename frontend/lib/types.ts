export type AutopilotSettings = {
  autopilot: boolean;
  minimum_margin_rate: number;
};

export type DashboardProduct = {
  id: string;
  title: string;
  base_cost: number;
  current_price: number;
  competitor_price: number | null;
  competitor_name: string | null;
  margin_rate: number;
  floor_hit: boolean;
};

export type PricingHistoryItem = {
  id: string;
  product_id: string;
  old_price: number;
  new_price: number;
  competitor_price: number;
  triggered_by: string;
  created_at: string;
};

export type AlertItem = {
  id: string;
  product_id: string | null;
  severity: "info" | "warning" | "critical";
  category: string;
  message: string;
  created_at: string;
};

export type DashboardState = {
  settings: AutopilotSettings;
  products: DashboardProduct[];
  history: PricingHistoryItem[];
  logs: string[];
  alerts: AlertItem[];
};

export type ChartPoint = {
  time: string;
  yourPrice: number;
  competitorPrice: number;
};

export type ExtractionResult = {
  title: string;
  price: number;
  currency: string;
  availability: string;
  specs_summary: string;
  color: string | null;
  stock: string | null;
  specifications: Record<string, string>;
};

export type PricingDecision = {
  product_id: string;
  old_price: number;
  competitor_price: number;
  target_price: number;
  margin_floor: number;
  margin_rate: number;
  clamped_to_floor: boolean;
  autopilot_dispatched: boolean;
  reason: string;
  match_distance: number | null;
  match_confidence: number | null;
  price_to_spec_ratio: number | null;
};

export type ScanResponse = {
  extraction: ExtractionResult;
  decision: PricingDecision;
  logs: string[];
};

export type CompetitorTarget = {
  id: string;
  product_id: string;
  competitor_name: string;
  competitor_url: string;
  status: "active" | "paused";
  last_checked_at: string | null;
  created_at: string;
};

export type AgentRunEvent = {
  id: string;
  run_id: string;
  stage: string;
  status: "pending" | "running" | "complete" | "failed";
  message: string;
  created_at: string;
};

export type AgentRun = {
  id: string;
  target_id: string | null;
  product_id: string;
  competitor_name: string;
  competitor_url: string;
  status: "running" | "complete" | "failed";
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  events: AgentRunEvent[];
};
