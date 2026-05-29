"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Crosshair, Link2, Play, Plus } from "lucide-react";
import { createCompetitorTarget, fetchCompetitorTargets, runCompetitorTargetScan } from "@/lib/api";
import type { CompetitorTarget, DashboardProduct, ScanResponse } from "@/lib/types";

type Props = {
  products: DashboardProduct[];
  onScanComplete: (result: ScanResponse) => Promise<void>;
};

export function CompetitorTargetManager({ products, onScanComplete }: Props) {
  const [targets, setTargets] = useState<CompetitorTarget[]>([]);
  const [productId, setProductId] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [busyTargetId, setBusyTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProductId = useMemo(() => productId || products[0]?.id || "", [productId, products]);

  async function refreshTargets(): Promise<void> {
    try {
      setTargets(await fetchCompetitorTargets());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load competitor targets");
    }
  }

  useEffect(() => {
    void refreshTargets();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createCompetitorTarget({
        product_id: selectedProductId,
        competitor_name: competitorName,
        competitor_url: competitorUrl
      });
      setCompetitorName("");
      setCompetitorUrl("");
      await refreshTargets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add competitor target");
    } finally {
      setSaving(false);
    }
  }

  async function runTarget(target: CompetitorTarget): Promise<void> {
    setBusyTargetId(target.id);
    setError(null);
    try {
      const result = await runCompetitorTargetScan(target.id);
      await onScanComplete(result);
      await refreshTargets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Target scan failed");
    } finally {
      setBusyTargetId(null);
    }
  }

  return (
    <section className="border border-ink/10 bg-white">
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
        <Crosshair size={18} />
        <div>
          <h2 className="text-base font-semibold">Competitor Targets</h2>
          <p className="text-xs text-ink/55">Persist URLs once, then run analysis whenever the market moves.</p>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_1.4fr_auto]">
        <select
          value={selectedProductId}
          onChange={(event) => setProductId(event.currentTarget.value)}
          className="h-10 border border-ink/15 bg-white px-3 text-sm"
          aria-label="Tracked product"
          required
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.title}
            </option>
          ))}
        </select>
        <input
          required
          value={competitorName}
          onChange={(event) => setCompetitorName(event.currentTarget.value)}
          placeholder="Competitor name"
          className="h-10 border border-ink/15 px-3 text-sm"
        />
        <div className="flex">
          <span className="grid h-10 w-10 place-items-center border border-r-0 border-ink/15 bg-mist">
            <Link2 size={16} />
          </span>
          <input
            required
            type="url"
            value={competitorUrl}
            onChange={(event) => setCompetitorUrl(event.currentTarget.value)}
            placeholder="https://competitor.com/product"
            className="h-10 min-w-0 flex-1 border border-ink/15 px-3 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving || products.length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus size={17} />
          {saving ? "Saving..." : "Add Target"}
        </button>
      </form>
      {error ? <div className="border-t border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div> : null}
      <div className="divide-y divide-ink/10 border-t border-ink/10">
        {targets.length === 0 ? (
          <p className="px-4 py-4 text-sm text-ink/55">No competitor targets yet. Add one above to start continuous monitoring.</p>
        ) : (
          targets.map((target) => (
            <div key={target.id} className="grid gap-3 px-4 py-3 text-sm lg:grid-cols-[1fr_1.4fr_auto] lg:items-center">
              <div>
                <p className="font-semibold">{target.competitor_name}</p>
                <p className="text-xs text-ink/55">
                  {target.last_checked_at
                    ? `Last checked ${new Date(target.last_checked_at).toLocaleString()}`
                    : "Not checked yet"}
                </p>
              </div>
              <a href={target.competitor_url} target="_blank" rel="noreferrer" className="truncate text-ink/65 underline">
                {target.competitor_url}
              </a>
              <button
                type="button"
                onClick={() => void runTarget(target)}
                disabled={busyTargetId !== null}
                className="inline-flex h-9 items-center justify-center gap-2 border border-ink/15 bg-mist px-3 font-semibold text-ink disabled:opacity-50"
              >
                <Play size={16} />
                {busyTargetId === target.id ? "Scanning..." : "Run Scan"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
