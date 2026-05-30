"use client";

import { FormEvent, useState } from "react";
import { PackagePlus } from "lucide-react";
import { createTrackedProduct } from "@/lib/api";

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
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product creation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-white/70 bg-white/85 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
        <PackagePlus size={18} />
        <h2 className="text-base font-semibold">Track Your Own Product</h2>
      </div>
      <form onSubmit={submit} className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          placeholder="Product title"
          className="h-10 border border-ink/15 px-3 text-sm"
        />
        <input
          value={sku}
          onChange={(event) => setSku(event.currentTarget.value)}
          placeholder="SKU"
          className="h-10 rounded-md border border-ink/15 px-3 text-sm"
        />
        <input
          value={brand}
          onChange={(event) => setBrand(event.currentTarget.value)}
          placeholder="Brand"
          className="h-10 rounded-md border border-ink/15 px-3 text-sm"
        />
        <input
          value={category}
          onChange={(event) => setCategory(event.currentTarget.value)}
          placeholder="Category"
          className="h-10 rounded-md border border-ink/15 px-3 text-sm"
        />
        <input
          required
          min="0.01"
          step="0.01"
          type="number"
          value={baseCost}
          onChange={(event) => setBaseCost(event.currentTarget.value)}
          placeholder="Base cost"
          className="h-10 rounded-md border border-ink/15 px-3 text-sm"
        />
        <input
          required
          min="0.01"
          step="0.01"
          type="number"
          value={currentPrice}
          onChange={(event) => setCurrentPrice(event.currentTarget.value)}
          placeholder="Current price"
          className="h-10 rounded-md border border-ink/15 px-3 text-sm"
        />
        <input
          required
          min="1"
          max="80"
          step="1"
          type="number"
          value={targetMargin}
          onChange={(event) => setTargetMargin(event.currentTarget.value)}
          placeholder="Target margin %"
          className="h-10 rounded-md border border-ink/15 px-3 text-sm"
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          placeholder="Product description"
          className="h-10 rounded-md border border-ink/15 px-3 text-sm xl:col-span-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-10 rounded-md bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Adding..." : "Add Product"}
        </button>
      </form>
      {error ? <div className="border-t border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div> : null}
    </section>
  );
}
