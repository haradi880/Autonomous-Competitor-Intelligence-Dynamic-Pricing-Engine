import { ArrowDownToLine, CheckCircle2, ShieldAlert } from "lucide-react";
import type { DashboardProduct } from "@/lib/types";

type Props = {
  products: DashboardProduct[];
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function CatalogTable({ products }: Props) {
  return (
    <section className="overflow-hidden border border-ink/10 bg-white">
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <h2 className="text-base font-semibold">Catalog Intelligence</h2>
        <ArrowDownToLine size={18} className="text-ink/55" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-mist text-left text-xs uppercase tracking-wide text-ink/55">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Your Price</th>
              <th className="px-4 py-3">Competitor</th>
              <th className="px-4 py-3">Base Cost</th>
              <th className="px-4 py-3">Margin</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-ink/10">
                <td className="px-4 py-4 font-medium">{product.title}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
