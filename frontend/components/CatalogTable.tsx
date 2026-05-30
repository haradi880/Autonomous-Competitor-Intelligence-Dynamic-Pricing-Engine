import { Archive, ArrowDownToLine, CheckCircle2, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { deleteTrackedProduct, updateTrackedProduct } from "@/lib/api";
import type { DashboardProduct, ScanResponse } from "@/lib/types";

type Props = {
  products: DashboardProduct[];
  lastScan?: ScanResponse | null;
  onProductsChanged?: () => Promise<void>;
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function CatalogTable({ products, lastScan, onProductsChanged }: Props) {
  async function setStatus(product: DashboardProduct, status: "active" | "archived"): Promise<void> {
    await updateTrackedProduct(product.id, { status });
    await onProductsChanged?.();
  }

  async function remove(product: DashboardProduct): Promise<void> {
    await deleteTrackedProduct(product.id);
    await onProductsChanged?.();
  }

  return (
    <section className="overflow-hidden rounded-lg border border-white/70 bg-white/85 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <h2 className="text-base font-semibold">Catalog Intelligence</h2>
        <ArrowDownToLine size={18} className="text-ink/55" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-sm">
          <thead className="bg-mist text-left text-xs uppercase tracking-wide text-ink/55">
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
            {products.map((product) => (
              <tr key={product.id} className="border-t border-ink/10">
                <td className="px-4 py-4">
                  <p className="font-medium">{product.title}</p>
                  <p className="mt-1 text-xs text-ink/50">
                    {[product.sku, product.brand, product.category].filter(Boolean).join(" / ") || "Metadata pending"}
                  </p>
                </td>
                <td className="px-4 py-4">{currency.format(product.current_price)}</td>
                <td className="px-4 py-4">
                  {product.competitor_price === null
                    ? "Awaiting scan"
                    : `${product.competitor_name ?? "Competitor"} - ${currency.format(product.competitor_price)}`}
                </td>
                <td className="px-4 py-4">{currency.format(product.base_cost)}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex min-w-24 items-center gap-2 rounded border px-2 py-1 font-semibold ${
                      product.floor_hit
                        ? "border-coral/30 bg-coral/10 text-coral"
                        : "border-fern/30 bg-fern/10 text-fern"
                    }`}
                  >
                    {product.floor_hit ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
                    {Math.round(product.margin_rate * 100)}%
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded border px-2 py-1 text-xs font-semibold ${product.status === "active" ? "border-fern/30 bg-fern/10 text-fern" : "border-ink/15 bg-mist text-ink/60"}`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {lastScan?.decision.product_id === product.id ? (
                    <div className="flex flex-wrap gap-2">
                      {lastScan.decision.match_confidence !== null ? (
                        <span className="border border-fern/30 bg-fern/10 px-2 py-1 text-xs font-semibold text-fern">
                          {Math.round(lastScan.decision.match_confidence * 100)}% match
                        </span>
                      ) : null}
                      {lastScan.decision.price_to_spec_ratio !== null ? (
                        <span className="border border-ink/15 bg-mist px-2 py-1 text-xs font-semibold text-ink/70">
                          ${lastScan.decision.price_to_spec_ratio.toFixed(2)} / spec
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-ink/45">No recent scan</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      title={product.status === "active" ? "Archive product" : "Restore product"}
                      onClick={() => void setStatus(product, product.status === "active" ? "archived" : "active")}
                      className="grid h-8 w-8 place-items-center rounded border border-ink/15 bg-white text-ink hover:bg-mist"
                    >
                      {product.status === "active" ? <Archive size={15} /> : <RotateCcw size={15} />}
                    </button>
                    <button
                      type="button"
                      title="Delete product"
                      onClick={() => void remove(product)}
                      className="grid h-8 w-8 place-items-center rounded border border-coral/20 bg-coral/10 text-coral hover:bg-coral/15"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
