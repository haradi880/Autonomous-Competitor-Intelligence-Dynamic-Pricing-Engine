"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Crosshair, Link2, Pause, Play, Plus, Trash2 } from "lucide-react";
import { createCompetitor, createCompetitorTarget, deleteCompetitor, fetchCompetitors, fetchCompetitorTargets, runCompetitorTargetScan, updateCompetitor } from "@/lib/api";
import type { Competitor, CompetitorTarget, DashboardProduct, ScanResponse } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { EmptyState, ErrorPanel, GlassPanel, LoadingLabel, SectionHeader, StatusBadge } from "@/components/ui";

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
  const { notify } = useToast();

  const selectedProductId = useMemo(() => productId || products[0]?.id || "", [productId, products]);

  async function refreshTargets(): Promise<void> {
    try {
      const [nextTargets, nextCompetitors] = await Promise.all([fetchCompetitorTargets(), fetchCompetitors()]);
      setTargets(nextTargets);
      setCompetitors(nextCompetitors);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load competitor targets");
      notify("Unable to load competitor targets.", "error");
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
      notify("Competitor target added.", "success");
      await refreshTargets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add competitor target");
      notify("Competitor target could not be saved.", "error");
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
      notify("Competitor scan completed.", "success");
      await refreshTargets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Target scan failed");
      notify("Target scan failed.", "error");
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
      notify("Competitor saved.", "success");
      await refreshTargets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save competitor");
      notify("Competitor could not be saved.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeCompetitor(id: string): Promise<void> {
    setError(null);
    try {
      await deleteCompetitor(id);
      if (competitorId === id) setCompetitorId("");
      notify("Competitor deleted.", "success");
      await refreshTargets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete competitor");
      notify("Competitor delete failed.", "error");
    }
  }

  return (
    <GlassPanel>
      <SectionHeader icon={<Crosshair size={18} />} title="Competitor Targets" description="Persist URLs once, then run analysis whenever the market moves." />
      <div className="border-b border-ink/10 p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-ink">Competitor Directory</p>
          <p className="mt-1 text-xs leading-5 text-ink/55">Create reusable competitor profiles before attaching product URLs.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <label className="field-label">
            <span className="field-label-text">Saved competitor</span>
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
              className="control-input"
              aria-label="Saved competitor"
            >
              <option value="">New competitor</option>
              {competitors.map((competitor) => (
                <option key={competitor.id} value={competitor.id}>
                  {competitor.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            <span className="field-label-text">Competitor name</span>
            <input
              required
              value={competitorName}
              onChange={(event) => setCompetitorName(event.currentTarget.value)}
              placeholder="Market leader"
              className="control-input"
            />
          </label>
          <label className="field-label">
            <span className="field-label-text">Website</span>
            <input
              type="url"
              value={competitorWebsite}
              onChange={(event) => setCompetitorWebsite(event.currentTarget.value)}
              placeholder="https://competitor.com"
              className="control-input"
            />
          </label>
          <label className="field-label">
            <span className="field-label-text">Group</span>
            <input
              value={competitorCategory}
              onChange={(event) => setCompetitorCategory(event.currentTarget.value)}
              placeholder="Marketplace"
              className="control-input"
            />
          </label>
          <button
            type="button"
            onClick={() => void saveCompetitor()}
            disabled={saving}
            className="button-primary h-12 w-full self-end 2xl:w-auto"
          >
            Save
          </button>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-4 p-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.5fr)_160px] lg:items-end">
        <label className="field-label">
          <span className="field-label-text">Tracked product</span>
          <select
            value={selectedProductId}
            onChange={(event) => setProductId(event.currentTarget.value)}
            className="control-input"
            aria-label="Tracked product"
            required
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label min-w-0">
          <span className="field-label-text">Competitor product URL</span>
          <div className="url-control">
            <span className="url-control-icon">
              <Link2 size={16} />
            </span>
            <input
              required
              type="url"
              value={competitorUrl}
              onChange={(event) => setCompetitorUrl(event.currentTarget.value)}
              placeholder="https://competitor.com/product"
              className="url-control-input"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={saving || products.length === 0}
          className="button-primary h-12 w-full"
        >
          <Plus size={17} />
          {saving ? "Saving..." : "Add Target"}
        </button>
      </form>
      {error ? <div className="px-4 pb-4"><ErrorPanel message={error} onRetry={() => void refreshTargets()} /></div> : null}
      {busyTargetId ? (
        <div className="border-t border-violet/15 bg-violet/10 px-4 py-3">
          <LoadingLabel label="Running saved target scan through the agent graph..." />
          <p className="mt-1 text-xs leading-5 text-ink/55">
            Ingestion, classification, vector verification, pricing decision, and webhook evaluation are being recorded.
          </p>
        </div>
      ) : null}
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
          <div className="p-4">
            <EmptyState title="No competitor targets" description="Add a product URL to start continuous market monitoring." />
          </div>
        ) : (
          targets.map((target) => (
            <div key={target.id} className="grid gap-3 px-4 py-3 text-sm lg:grid-cols-[minmax(180px,0.8fr)_minmax(0,1.5fr)_140px] lg:items-center">
              <div>
                <p className="font-semibold">{target.competitor_name}</p>
                <div className="mt-1"><StatusBadge tone={target.status === "active" ? "success" : "neutral"}>{target.status}</StatusBadge></div>
                <p className="text-xs text-ink/55">
                  {target.last_checked_at
                    ? `Last checked ${new Date(target.last_checked_at).toLocaleString()}`
                    : "Not checked yet"}
                </p>
              </div>
              <a href={target.competitor_url} target="_blank" rel="noreferrer" className="break-all rounded-lg bg-white/55 px-3 py-2 text-ink/65 underline lg:truncate lg:bg-transparent lg:px-0 lg:py-0">
                {target.competitor_url}
              </a>
              <button
                type="button"
                onClick={() => void runTarget(target)}
                disabled={busyTargetId !== null}
                className="button-secondary h-10 w-full"
              >
                {busyTargetId === target.id ? <Pause size={16} /> : <Play size={16} />}
                {busyTargetId === target.id ? "Scanning..." : "Run Scan"}
              </button>
            </div>
          ))
        )}
      </div>
    </GlassPanel>
  );
}
