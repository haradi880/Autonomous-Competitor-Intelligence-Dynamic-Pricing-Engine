"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, Link2, Play, Search, Wand2 } from "lucide-react";
import { AgentTimeline } from "@/components/AgentTimeline";
import { runCompetitorScan } from "@/lib/api";
import type { DashboardProduct, ScanResponse } from "@/lib/types";

type Props = {
  products: DashboardProduct[];
  onComplete: () => Promise<void>;
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const demo = {
  productId: "4a50ce59-2854-4d5a-9fa4-02645f861bcc",
  competitorName: "Fake Store API",
  url: "https://fakestoreapi.com/products/1"
};

export function ScanPanel({ products, onComplete }: Props) {
  const [productId, setProductId] = useState<string>("");
  const [competitorName, setCompetitorName] = useState("Competitor");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [timelineLogs, setTimelineLogs] = useState<string[]>([]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? products[0],
    [productId, products]
  );

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const chosen = selectedProduct;
    if (!chosen) {
      setError("Add or seed products before running a scan.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setTimelineLogs(["[IngestionAgent] Queued competitor URL for ingestion..."]);
    try {
      const response = await runCompetitorScan({
        product_id: chosen.id,
        competitor_name: competitorName,
        competitor_url: url
      });
      setResult(response);
      setTimelineLogs(response.logs);
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setTimelineLogs((current) => (current.length > 0 ? current : ["[IngestionAgent] Scan failed before graph logs returned."]));
    } finally {
      setBusy(false);
    }
  }

  function loadDemo(): void {
    setProductId(demo.productId);
    setCompetitorName(demo.competitorName);
    setUrl(demo.url);
    setError(null);
    setResult(null);
    setTimelineLogs([]);
  }

  return (
    <section className="border border-ink/10 bg-white">
      <div className="flex flex-col gap-3 border-b border-ink/10 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Bot size={18} />
          <div>
            <h2 className="text-base font-semibold">Competitor URL Ingest</h2>
            <p className="text-xs text-ink/55">Raw markdown extraction to vector-verified pricing action</p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadDemo}
          className="inline-flex h-9 items-center justify-center gap-2 border border-ink/15 bg-mist px-3 text-sm font-semibold text-ink"
        >
          <Wand2 size={16} />
          Load Demo Scan
        </button>
      </div>
      <form onSubmit={submit} className="grid gap-3 p-4 md:grid-cols-[1fr_1fr]">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink/70">Tracked product</span>
          <select
            value={selectedProduct?.id ?? ""}
            onChange={(event) => setProductId(event.currentTarget.value)}
            className="h-10 border border-ink/15 bg-white px-3"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink/70">Competitor name</span>
          <input
            value={competitorName}
            onChange={(event) => setCompetitorName(event.currentTarget.value)}
            className="h-10 border border-ink/15 px-3"
            placeholder="Amazon, Best Buy, Shopify test store"
          />
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="font-semibold text-ink/70">Competitor product URL</span>
          <div className="flex">
            <span className="grid h-10 w-10 place-items-center border border-r-0 border-ink/15 bg-mist">
              <Link2 size={16} />
            </span>
            <input
              required
              type="url"
              value={url}
              onChange={(event) => setUrl(event.currentTarget.value)}
              className="h-10 min-w-0 flex-1 border border-ink/15 px-3"
              placeholder="https://example-store.com/products/item"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={busy || products.length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50 md:w-fit"
        >
          {busy ? <Search size={17} className="animate-pulse" /> : <Play size={17} />}
          {busy ? "Scanning..." : "Run Scan"}
        </button>
      </form>
      <AgentTimeline logs={timelineLogs} busy={busy} failed={Boolean(error)} />
      {error ? <div className="border-t border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div> : null}
      {result ? (
        <div className="grid gap-3 border-t border-ink/10 bg-mist p-4 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase text-ink/50">Extracted</p>
            <p className="mt-1 font-semibold">{result.extraction.title}</p>
            <p className="text-ink/60">{currency.format(result.extraction.price)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-ink/50">Decision</p>
            <p className="mt-1 font-semibold">{currency.format(result.decision.target_price)}</p>
            <p className="text-ink/60">{result.decision.reason}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-ink/50">Match</p>
            <p className="mt-1 font-semibold">
              {result.decision.match_confidence === null
                ? "Pending"
                : `${Math.round(result.decision.match_confidence * 100)}% confidence`}
            </p>
            <p className="text-ink/60">
              {result.decision.match_distance === null ? "Distance pending" : `Distance ${result.decision.match_distance.toFixed(4)}`}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-ink/50">Guardrails</p>
            <p className="mt-1 font-semibold">
              {result.decision.price_to_spec_ratio === null ? "Ratio pending" : `$${result.decision.price_to_spec_ratio.toFixed(2)} / spec`}
            </p>
            <p className="text-ink/60">
              Floor {currency.format(result.decision.margin_floor)}
              {result.decision.clamped_to_floor ? " - clamped" : ""}
            </p>
            <p className="mt-1 text-ink/60">{result.decision.autopilot_dispatched ? "Webhook dispatched" : "Webhook not dispatched"}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
