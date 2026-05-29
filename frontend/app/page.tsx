"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import { AutopilotControls } from "@/components/AutopilotControls";
import { AlertsPanel } from "@/components/AlertsPanel";
import { CatalogTable } from "@/components/CatalogTable";
import { LogStream } from "@/components/LogStream";
import { PriceChart } from "@/components/PriceChart";
import { ProductOnboarding } from "@/components/ProductOnboarding";
import { ScanPanel } from "@/components/ScanPanel";
import { SubmissionChecklist } from "@/components/SubmissionChecklist";
import { apiBase, fetchDashboard, updateSettings } from "@/lib/api";
import type { ChartPoint, DashboardState } from "@/lib/types";

const initialState: DashboardState = {
  settings: { autopilot: true, minimum_margin_rate: 0.12 },
  products: [],
  history: [],
  logs: ["[UI] Connecting to pricing engine..."],
  alerts: []
};

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function refresh(): Promise<void> {
    try {
      setLoading(true);
      setState(await fetchDashboard());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message}. If Render is waking from sleep, wait a few seconds and refresh.`
          : "Unknown dashboard error"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    const source = new EventSource(`${apiBase()}/logs/stream`);
    source.onmessage = (event: MessageEvent<string>) => {
      const parsed = JSON.parse(event.data) as { message: string };
      setState((current) => ({ ...current, logs: [...current.logs, parsed.message].slice(-120) }));
      void refresh();
    };
    source.onerror = () => setError("Live log stream disconnected. Retrying automatically.");
    return () => source.close();
  }, []);

  const chartData = useMemo<ChartPoint[]>(() => {
    if (state.history.length === 0) {
      const anchor = state.products[0];
      if (!anchor) return [];
      const competitor = anchor.competitor_price ?? anchor.current_price * 1.05;
      return [
        { time: "Mon", yourPrice: Math.round(anchor.current_price * 1.04 * 100) / 100, competitorPrice: Math.round(competitor * 1.08 * 100) / 100 },
        { time: "Tue", yourPrice: Math.round(anchor.current_price * 1.02 * 100) / 100, competitorPrice: Math.round(competitor * 1.05 * 100) / 100 },
        { time: "Wed", yourPrice: Math.round(anchor.current_price * 1.01 * 100) / 100, competitorPrice: Math.round(competitor * 1.03 * 100) / 100 },
        { time: "Thu", yourPrice: Math.round(anchor.current_price * 100) / 100, competitorPrice: Math.round(competitor * 100) / 100 },
        { time: "Now", yourPrice: anchor.current_price, competitorPrice: competitor }
      ];
    }
    return state.history.map((item) => ({
      time: new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      yourPrice: item.new_price,
      competitorPrice: item.competitor_price
    }));
  }, [state.history, state.products]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return state.products;
    return state.products.filter((product) =>
      [product.title, product.competitor_name ?? ""].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [query, state.products]);

  return (
    <main className="min-h-screen">
      <AutopilotControls
        settings={state.settings}
        onChange={(next) => {
          setState((current) => ({ ...current, settings: next }));
          void updateSettings(next).then(refresh).catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Settings update failed");
          });
        }}
      />

      <div className="grid gap-5 px-5 py-5 md:px-8 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-ink/65">
              {loading && state.products.length === 0
                ? "Connecting to pricing engine..."
                : `${state.products.length} products monitored - ${
                    state.settings.autopilot ? "autonomous updates active" : "analysis only"
                  }`}
            </p>
            <div className="flex gap-2">
              <label className="flex h-10 min-w-0 flex-1 border border-ink/15 bg-white md:w-80">
                <span className="grid w-10 place-items-center text-ink/50">
                  <Search size={17} />
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  placeholder="Search catalog"
                  className="min-w-0 flex-1 px-1 outline-none"
                />
              </label>
              <button
                type="button"
                title="Refresh dashboard"
                onClick={() => void refresh()}
                className="grid h-10 w-10 place-items-center border border-ink/15 bg-white text-ink transition hover:bg-mist"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>
          {error ? <div className="border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div> : null}
          {loading && state.products.length === 0 ? (
            <div className="border border-brass/30 bg-brass/10 px-4 py-3 text-sm text-brass">
              Warming the hosted backend and loading Supabase dashboard data...
            </div>
          ) : null}
          <SubmissionChecklist />
          <ProductOnboarding onComplete={refresh} />
          <ScanPanel products={state.products} onComplete={refresh} />
          <AlertsPanel alerts={state.alerts} />
          <CatalogTable products={filteredProducts} />
          <PriceChart data={chartData} />
        </div>
        <LogStream logs={state.logs} />
      </div>
    </main>
  );
}
