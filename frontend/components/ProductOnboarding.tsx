"use client";

import { FormEvent, useState } from "react";
import { PackagePlus } from "lucide-react";
import { createTrackedProduct } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { ErrorPanel, GlassPanel, SectionHeader } from "@/components/ui";

type Props = {
  onComplete: () => Promise<void>;
};

export function ProductOnboarding({ onComplete }: Props) {
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [targetMargin, setTargetMargin] = useState("12");
  const [baseCost, setBaseCost] = useState("100");
  const [currentPrice, setCurrentPrice] = useState("149");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createTrackedProduct({
        title,
        base_cost: Number(baseCost),
        current_price: Number(currentPrice),
        sku: sku || null,
        brand: brand || null,
        category: category || null,
        description: description || null,
        target_margin: Number(targetMargin) / 100
      });
      setTitle("");
      setSku("");
      setBrand("");
      setCategory("");
      setDescription("");
      notify("Product added to the monitored catalog.", "success");
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product creation failed");
      notify("Product creation failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassPanel>
      <SectionHeader icon={<PackagePlus size={18} />} title="Track Your Own Product" description="Create a pricing record with enough metadata for real operating teams." />
      <form onSubmit={submit} className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="field-label md:col-span-2">
          <span className="field-label-text">Product title</span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            placeholder="AeroBook Pro 14"
            className="control-input"
          />
        </label>
        <label className="field-label">
          <span className="field-label-text">SKU</span>
          <input
            value={sku}
            onChange={(event) => setSku(event.currentTarget.value)}
            placeholder="AB-PRO-14"
            className="control-input"
          />
        </label>
        <label className="field-label">
          <span className="field-label-text">Brand</span>
          <input
            value={brand}
            onChange={(event) => setBrand(event.currentTarget.value)}
            placeholder="Acme"
            className="control-input"
          />
        </label>
        <label className="field-label">
          <span className="field-label-text">Category</span>
          <input
            value={category}
            onChange={(event) => setCategory(event.currentTarget.value)}
            placeholder="Laptops"
            className="control-input"
          />
        </label>
        <label className="field-label">
          <span className="field-label-text">Base cost</span>
          <input
            required
            min="0.01"
            step="0.01"
            type="number"
            value={baseCost}
            onChange={(event) => setBaseCost(event.currentTarget.value)}
            placeholder="100.00"
            className="control-input"
          />
        </label>
        <label className="field-label">
          <span className="field-label-text">Current price</span>
          <input
            required
            min="0.01"
            step="0.01"
            type="number"
            value={currentPrice}
            onChange={(event) => setCurrentPrice(event.currentTarget.value)}
            placeholder="149.00"
            className="control-input"
          />
        </label>
        <label className="field-label">
          <span className="field-label-text">Target margin %</span>
          <input
            required
            min="1"
            max="80"
            step="1"
            type="number"
            value={targetMargin}
            onChange={(event) => setTargetMargin(event.currentTarget.value)}
            placeholder="12"
            className="control-input"
          />
        </label>
        <label className="field-label md:col-span-2 xl:col-span-3">
          <span className="field-label-text">Product description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            placeholder="Key specifications, bundle notes, or merchandising context"
            className="min-h-24 w-full rounded-xl border border-ink/10 bg-white/85 px-3.5 py-3 text-sm text-ink shadow-sm transition placeholder:text-ink/35 focus:border-fern focus:ring-2 focus:ring-fern/15"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="button-primary h-12 w-full self-end xl:w-auto"
        >
          {busy ? "Adding..." : "Add Product"}
        </button>
      </form>
      {error ? <div className="p-4 pt-0"><ErrorPanel message={error} /></div> : null}
    </GlassPanel>
  );
}
