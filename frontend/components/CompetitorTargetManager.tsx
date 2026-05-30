"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Crosshair, Link2, Pause, Play, Plus, Trash2 } from "lucide-react";
import { createCompetitor, createCompetitorTarget, deleteCompetitor, fetchCompetitors, fetchCompetitorTargets, runCompetitorTargetScan, updateCompetitor } from "@/lib/api";
import type { Competitor, CompetitorTarget, DashboardProduct, ScanResponse } from "@/lib/types";

type Props = {
  products: DashboardProduct[];
  onScanComplete: (result: ScanResponse) => Promise<void>;
};

export function CompetitorTargetManager({ products, onScanComplete }: Props) {
  const [targets, setTargets] = useState<CompetitorTarget[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [competitorId, setCompetitorId] = useState("");
  const [productId, setProductId] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [competitorWebsite, setCompetitorWebsite] = useState("");
  const [competitorCategory, setCompetitorCategory] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [busyTargetId, setBusyTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProductId = useMemo(() => productId || products[0]?.id || "", [productId, products]);

  async function refreshTargets(): Promise<void> {
    try {
      const [nextTargets, nextCompetitors] = await Promise.all([fetchCompetitorTargets(), fetchCompetitors()]);
      setTargets(nextTargets);
      setCompetitors(nextCompetitors);
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
        competitor_url: competitorUrl,
        competitor_id: competitorId || null
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

  async function saveCompetitor(): Promise<void> {
    if (!competitorName.trim()) {
      setError("Add a competitor name before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (competitorId) {
        await updateCompetitor(competitorId, {
          name: competitorName,
          website: competitorWebsite || null,
          category: competitorCategory || null,
          status: "active"
        });
      } else {
        const created = await createCompetitor({
          name: competitorName,
          website: competitorWebsite || null,
          category: competitorCategory || null
        });
        setCompetitorId(created.id);
      }
      await refreshTargets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save competitor");
    } finally {
      setSaving(false);
    }
  }

  async function removeCompetitor(id: string): Promise<void> {
    setError(null);
    try {
      await deleteCompetitor(id);
      if (competitorId === id) setCompetitorId("");
      await refreshTargets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete competitor");
    }
  }

  return (
    <section className="rounded-lg border border-white/70 bg-white/85 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
        <Crosshair size={18} />
        <div>
          <h2 className="text-base font-semibold">Competitor Targets</h2>
          <p className="text-xs text-ink/55">Persist URLs once, then run analysis whenever the market moves.</p>
        </div>
      </div>
      <div className="grid gap-3 border-b border-ink/10 p-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <select
          value={competitorId}
          onChange={(event) => {
            const id = event.currentTarget.value;
            setCompetitorId(id);
            const selected = competitors.find((competitor) => competitor.id === id);
            if (selected) {
              setCompetitorName(selected.name);
              setCompetitorWebsite(selected.website ?? "");
              setCompetitorCategory(selected.category ?? "");
            }
          }}
          className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm"
          aria-label="Saved competitor"
        >
          <option value="">New competitor</option>
          {competitors.map((competitor) => (
            <option key={competitor.id} value={competitor.id}>
              {competitor.name}
            </option>
          ))}
        </select>
        <input
          required
          value={competitorName}
          onChange={(event) => setCompetitorName(event.currentTarget.value)}
          placeholder="Competitor name"
          className="h-10 rounded-md border border-ink/15 px-3 text-sm"
        />
        <input
          type="url"
          value={competitorWebsite}
          onChange={(event) => setCompetitorWebsite(event.currentTarget.value)}
          placeholder="https://competitor.com"
          className="h-10 rounded-md border border-ink/15 px-3 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={competitorCategory}
            onChange={(event) => setCompetitorCategory(event.currentTarget.value)}
            placeholder="Group"
            className="h-10 min-w-0 flex-1 rounded-md border border-ink/15 px-3 text-sm"
          />
          <button
            type="button"
            onClick={() => void saveCompetitor()}
            disabled={saving}
            className="h-10 rounded-md bg-ink px-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-3 p-4 lg:grid-cols-[1fr_1.4fr_auto]">
        <select
          value={selectedProductId}
          onChange={(event) => setProductId(event.currentTarget.value)}
          className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm"
          aria-label="Tracked product"
          required
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.title}
            </option>
          ))}
        </select>
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
            className="h-10 min-w-0 flex-1 rounded-r-md border border-ink/15 px-3 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving || products.length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus size={17} />
          {saving ? "Saving..." : "Add Target"}
        </button>
      </form>
      {error ? <div className="border-t border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div> : null}
      <div className="divide-y divide-ink/10 border-t border-ink/10">
        {competitors.length > 0 ? (
          <div className="grid gap-2 px-4 py-3 sm:grid-cols-2 xl:grid-cols-3">
            {competitors.slice(0, 6).map((competitor) => (
              <div key={competitor.id} className="flex items-center justify-between rounded-md border border-ink/10 bg-mist px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold">{competitor.name}</p>
                  <p className="text-xs text-ink/50">{competitor.category || competitor.status}</p>
                </div>
                <button
                  type="button"
                  title="Delete competitor"
                  onClick={() => void removeCompetitor(competitor.id)}
                  className="grid h-8 w-8 place-items-center rounded border border-coral/20 bg-coral/10 text-coral"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
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
                {busyTargetId === target.id ? <Pause size={16} /> : <Play size={16} />}
                {busyTargetId === target.id ? "Scanning..." : "Run Scan"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
