"use client";

import { useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { AutopilotControls } from "@/components/AutopilotControls";
import { CatalogTable } from "@/components/CatalogTable";
import { CompetitorTargetManager } from "@/components/CompetitorTargetManager";
import { LogStream } from "@/components/LogStream";
import { KpiGrid } from "@/components/KpiGrid";
import { PriceChart } from "@/components/PriceChart";
import { ProductOnboarding } from "@/components/ProductOnboarding";
import { ScanHistoryPanel } from "@/components/ScanHistoryPanel";
import { ScanPanel } from "@/components/ScanPanel";
import { SubmissionChecklist } from "@/components/SubmissionChecklist";
import { SystemStatusPanel } from "@/components/SystemStatusPanel";
import { useDashboard } from "@/components/DashboardProvider";
import { ErrorPanel, LoadingLabel, SkeletonBlock } from "@/components/ui";
import type { ChartPoint, ScanResponse } from "@/lib/types";

type View = "overview" | "products" | "competitors" | "scans" | "alerts" | "readiness";

type Props = {
  view: View;
};

const titles: Record<View, { title: string; eyebrow: string }> = {
  overview: { title: "Command Center", eyebrow: "Executive overview" },
  products: { title: "Product Catalog", eyebrow: "Tracked inventory" },
  competitors: { title: "Competitor Targets", eyebrow: "Market monitoring" },
  scans: { title: "Agent Runs", eyebrow: "Execution history" },
  alerts: { title: "Operational Alerts", eyebrow: "Risk and recovery" },
  readiness: { title: "Submission Readiness", eyebrow: "Project A alignment" }
};

export function CommandCenter({ view }: Props) {
  const { state, summary, lastScan, error, loading, streamConnected, refresh, updateAutopilotSettings, setLastScanResult } = useDashboard();
  const [query, setQuery] = useState("");

  const chartData = useMemo<ChartPoint[]>(
    () =>
      state.history.map((item) => ({
        time: new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        yourPrice: item.new_price,
        competitorPrice: item.competitor_price
      })),
    [state.history]
  );

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return state.products;
    return state.products.filter((product) =>
      [product.title, product.competitor_name ?? "", product.brand ?? "", product.category ?? "", product.sku ?? ""].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [query, state.products]);

  async function handleScanComplete(result: ScanResponse): Promise<void> {
    setLastScanResult(result);
    await refresh();
  }

  return (
    <div>
      <AutopilotControls settings={state.settings} onChange={(next) => void updateAutopilotSettings(next)} />
      <div className="mx-auto grid w-full max-w-[1600px] gap-5 px-4 py-5 sm:px-5 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <div className="min-w-0 space-y-5">
          <section className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">{titles[view].eyebrow}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink md:text-3xl">{titles[view].title}</h2>
              <p className="mt-1 text-sm text-ink/55">
                {loading && state.products.length === 0
                  ? "Connecting to pricing engine..."
                  : `${state.products.length} products monitored - ${
                      state.settings.autopilot ? "autonomous updates active" : "analysis only"
                    }`}
              </p>
            </div>
            <div className="flex min-w-0 gap-2">
              <label className="flex h-11 min-w-0 flex-1 rounded-xl border border-ink/10 bg-white/85 shadow-sm md:w-80">
                <span className="grid w-10 place-items-center text-ink/45">
                  <Search size={17} />
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  placeholder="Search catalog"
                  className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
                />
              </label>
              <button
                type="button"
                title="Refresh dashboard"
                onClick={() => void refresh()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink/10 bg-white/85 text-ink shadow-sm transition hover:bg-white"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </section>

          {error ? <ErrorPanel message={error} onRetry={() => void refresh()} /> : null}
          {loading && state.products.length === 0 ? (
            <div className="glass-panel-subtle p-4">
              <LoadingLabel label="Loading Supabase-backed pricing intelligence..." />
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <SkeletonBlock className="h-24" />
                <SkeletonBlock className="h-24" />
                <SkeletonBlock className="h-24" />
              </div>
            </div>
          ) : null}

          {view === "overview" ? (
            <>
              <KpiGrid summary={summary} />
              <CompetitorTargetManager products={state.products} onScanComplete={handleScanComplete} />
              <ScanPanel products={state.products} onComplete={refresh} />
              <CatalogTable products={filteredProducts} lastScan={lastScan} onProductsChanged={refresh} />
              <PriceChart data={chartData} />
              <AlertsPanel alerts={state.alerts} />
            </>
          ) : null}

          {view === "products" ? (
            <>
              <ProductOnboarding onComplete={refresh} />
              <CatalogTable products={filteredProducts} lastScan={lastScan} onProductsChanged={refresh} />
              <PriceChart data={chartData} />
            </>
          ) : null}

          {view === "competitors" ? (
            <>
              <CompetitorTargetManager products={state.products} onScanComplete={handleScanComplete} />
              <ScanPanel products={state.products} onComplete={refresh} />
            </>
          ) : null}

          {view === "scans" ? <ScanHistoryPanel /> : null}
          {view === "alerts" ? <AlertsPanel alerts={state.alerts} /> : null}
          {view === "readiness" ? <SubmissionChecklist expanded /> : null}
        </div>

        <div className="min-w-0 space-y-5 xl:sticky xl:top-5 xl:self-start">
          <SystemStatusPanel
            loading={loading}
            error={error}
            streamConnected={streamConnected}
            productCount={state.products.length}
            logCount={state.logs.length}
            onRetry={() => void refresh()}
          />
          <LogStream logs={state.logs} streamConnected={streamConnected} />
        </div>
      </div>
    </div>
  );
}
