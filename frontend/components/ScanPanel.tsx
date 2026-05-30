"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, CheckCircle2, Link2, Play, Search, Sparkles } from "lucide-react";
import { AgentTimeline } from "@/components/AgentTimeline";
import { runCompetitorScan } from "@/lib/api";
import type { DashboardProduct, ScanResponse } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { ErrorPanel, GlassPanel, LoadingLabel, SectionHeader, StatusBadge } from "@/components/ui";

type Props = {
  products: DashboardProduct[];
  onComplete: () => Promise<void>;
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function ScanPanel({ products, onComplete }: Props) {
  const [productId, setProductId] = useState<string>("");
  const [competitorName, setCompetitorName] = useState("Competitor");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [timelineLogs, setTimelineLogs] = useState<string[]>([]);
  const { notify } = useToast();

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
      notify("Competitor scan completed.", "success");
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      notify("Competitor scan failed.", "error");
      setTimelineLogs((current) => (current.length > 0 ? current : ["[IngestionAgent] Scan failed before graph logs returned."]));
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassPanel>
      <SectionHeader
        icon={<Bot size={18} />}
        title="Competitor URL Ingest"
        description="Run a one-off market check against any competitor product page."
        action={<StatusBadge tone="info">Real Jina + Gemini</StatusBadge>}
      />
      <form onSubmit={submit} className="grid gap-3 p-4 md:grid-cols-[1fr_1fr]">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink/70">Tracked product</span>
          <select
            value={selectedProduct?.id ?? ""}
            onChange={(event) => setProductId(event.currentTarget.value)}
            className="control-input"
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
            className="control-input"
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
              className="control-input min-w-0 flex-1 rounded-l-none"
              placeholder="https://example-store.com/products/item"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={busy || products.length === 0}
          className="button-primary w-full md:w-fit"
        >
          {busy ? <Search size={17} className="animate-pulse" /> : <Play size={17} />}
          {busy ? "Scanning..." : "Run Scan"}
        </button>
      </form>
      {busy ? (
        <div className="border-t border-violet/15 bg-violet/10 px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <LoadingLabel label="Autonomous pricing workflow in progress..." />
              <p className="mt-1 text-xs leading-5 text-ink/55">
                The scan may take longer on the hosted demo while Render wakes the API and third-party AI providers respond.
              </p>
            </div>
            <div className="grid gap-2 text-xs font-semibold text-ink/60 sm:grid-cols-5 lg:min-w-[520px]">
              {["Jina", "Gemini", "Vector RPC", "Pricing", "Webhook"].map((step, index) => (
                <div key={step} className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2">
                  {index === 0 ? <Sparkles size={14} className="text-violet" /> : <CheckCircle2 size={14} className="text-ink/30" />}
                  <span className="truncate">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <AgentTimeline logs={timelineLogs} busy={busy} failed={Boolean(error)} />
      {error ? <div className="border-t border-ink/10 p-4"><ErrorPanel message={error} /></div> : null}
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
          {result.decision.reasoning.length > 0 ? (
            <div className="rounded-md border border-ink/10 bg-white p-3 md:col-span-4">
              <p className="text-xs font-semibold uppercase text-ink/50">Decision Reasoning</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {result.decision.reasoning.map((reason) => (
                  <p key={reason} className="text-ink/65">
                    {reason}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </GlassPanel>
  );
}
