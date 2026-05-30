"use client";

import { useMemo, useState } from "react";
import { Archive, ArrowDownUp, CheckCircle2, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { deleteTrackedProduct, updateTrackedProduct } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { EmptyState, GlassPanel, SectionHeader, StatusBadge } from "@/components/ui";
import type { DashboardProduct, ScanResponse } from "@/lib/types";

type Props = {
  products: DashboardProduct[];
  lastScan?: ScanResponse | null;
  onProductsChanged?: () => Promise<void>;
};

type SortKey = "title" | "current_price" | "margin_rate" | "status";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function CatalogTable({ products, lastScan, onProductsChanged }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const { notify } = useToast();

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const first = a[sortKey];
      const second = b[sortKey];
      if (typeof first === "number" && typeof second === "number") return second - first;
      return String(first).localeCompare(String(second));
    });
  }, [products, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);

  async function setStatus(product: DashboardProduct, status: "active" | "archived"): Promise<void> {
    try {
      await updateTrackedProduct(product.id, { status });
      notify(`Product ${status === "active" ? "restored" : "archived"}.`, "success");
      await onProductsChanged?.();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Product status update failed.", "error");
    }
  }

  async function remove(product: DashboardProduct): Promise<void> {
    try {
      await deleteTrackedProduct(product.id);
      notify("Product deleted.", "success");
      await onProductsChanged?.();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Product delete failed.", "error");
    }
  }

  function metrics(product: DashboardProduct) {
    if (lastScan?.decision.product_id !== product.id) return <span className="text-xs text-ink/45">No recent scan</span>;
    return (
      <div className="flex flex-wrap gap-2">
        {lastScan.decision.match_confidence !== null ? (
          <StatusBadge tone="success">{Math.round(lastScan.decision.match_confidence * 100)}% match</StatusBadge>
        ) : null}
        {lastScan.decision.price_to_spec_ratio !== null ? (
          <StatusBadge tone="neutral">${lastScan.decision.price_to_spec_ratio.toFixed(2)} / spec</StatusBadge>
        ) : null}
      </div>
    );
  }

  return (
    <GlassPanel className="overflow-hidden">
      <SectionHeader
        title="Catalog Intelligence"
        description="Tracked products, margins, competitor observations, and recent decision metrics."
        icon={<ArrowDownUp size={18} />}
        action={
          <select
            value={sortKey}
            onChange={(event) => {
              setSortKey(event.currentTarget.value as SortKey);
              setPage(1);
            }}
            className="control-input h-10"
            aria-label="Sort catalog"
          >
            <option value="title">Sort by product</option>
            <option value="current_price">Sort by price</option>
            <option value="margin_rate">Sort by margin</option>
            <option value="status">Sort by status</option>
          </select>
        }
      />

      {products.length === 0 ? (
        <div className="p-4">
          <EmptyState title="No tracked products" description="Add a product to start monitoring competitor movements and margin guardrails." />
        </div>
      ) : (
        <>
          <div className="grid gap-3 p-4 lg:hidden">
            {visible.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035 }}
                className="rounded-lg border border-ink/10 bg-white/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{product.title}</h3>
                    <p className="mt-1 text-xs text-ink/50">{[product.sku, product.brand, product.category].filter(Boolean).join(" / ") || "Metadata pending"}</p>
                  </div>
                  <StatusBadge tone={product.status === "active" ? "success" : "neutral"}>{product.status}</StatusBadge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-ink/45">Your Price</p><p className="font-semibold">{currency.format(product.current_price)}</p></div>
                  <div><p className="text-xs text-ink/45">Base Cost</p><p className="font-semibold">{currency.format(product.base_cost)}</p></div>
                  <div><p className="text-xs text-ink/45">Margin</p><p className={product.floor_hit ? "font-semibold text-coral" : "font-semibold text-fern"}>{Math.round(product.margin_rate * 100)}%</p></div>
                  <div><p className="text-xs text-ink/45">Competitor</p><p className="font-semibold">{product.competitor_price ? currency.format(product.competitor_price) : "Awaiting scan"}</p></div>
                </div>
                <div className="mt-4">{metrics(product)}</div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => void setStatus(product, product.status === "active" ? "archived" : "active")} className="button-secondary h-9 flex-1">
                    {product.status === "active" ? <Archive size={15} /> : <RotateCcw size={15} />}
                    {product.status === "active" ? "Archive" : "Restore"}
                  </button>
                  <button type="button" onClick={() => void remove(product)} className="button-secondary h-9 border-coral/25 text-coral">
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1120px] border-collapse text-sm">
              <thead className="sticky top-0 bg-white/90 text-left text-xs uppercase tracking-wide text-ink/50 backdrop-blur">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Your Price</th>
                  <th className="px-4 py-3">Competitor</th>
                  <th className="px-4 py-3">Base Cost</th>
                  <th className="px-4 py-3">Margin</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Decision Metrics</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr key={product.id} className="border-t border-ink/10 transition hover:bg-white/55">
                    <td className="px-4 py-4">
                      <p className="font-medium">{product.title}</p>
                      <p className="mt-1 text-xs text-ink/50">{[product.sku, product.brand, product.category].filter(Boolean).join(" / ") || "Metadata pending"}</p>
                    </td>
                    <td className="px-4 py-4">{currency.format(product.current_price)}</td>
                    <td className="px-4 py-4">{product.competitor_price === null ? "Awaiting scan" : `${product.competitor_name ?? "Competitor"} - ${currency.format(product.competitor_price)}`}</td>
                    <td className="px-4 py-4">{currency.format(product.base_cost)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge tone={product.floor_hit ? "danger" : "success"}>
                        {product.floor_hit ? <ShieldAlert size={15} /> : <CheckCircle2 size={15} />}
                        {Math.round(product.margin_rate * 100)}%
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4"><StatusBadge tone={product.status === "active" ? "success" : "neutral"}>{product.status}</StatusBadge></td>
                    <td className="px-4 py-4">{metrics(product)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button type="button" title={product.status === "active" ? "Archive product" : "Restore product"} onClick={() => void setStatus(product, product.status === "active" ? "archived" : "active")} className="grid h-8 w-8 place-items-center rounded-md border border-ink/10 bg-white text-ink hover:bg-mist">
                          {product.status === "active" ? <Archive size={15} /> : <RotateCcw size={15} />}
                        </button>
                        <button type="button" title="Delete product" onClick={() => void remove(product)} className="grid h-8 w-8 place-items-center rounded-md border border-coral/20 bg-coral/10 text-coral hover:bg-coral/15">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-ink/10 px-4 py-3 text-sm text-ink/60">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="button-secondary h-9">Previous</button>
              <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="button-secondary h-9">Next</button>
            </div>
          </div>
        </>
      )}
    </GlassPanel>
  );
}
