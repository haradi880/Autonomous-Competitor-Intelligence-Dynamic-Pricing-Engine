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
      <form onSubmit={submit} className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          placeholder="Product title"
          className="control-input"
        />
        <input
          value={sku}
          onChange={(event) => setSku(event.currentTarget.value)}
          placeholder="SKU"
          className="control-input"
        />
        <input
          value={brand}
          onChange={(event) => setBrand(event.currentTarget.value)}
          placeholder="Brand"
          className="control-input"
        />
        <input
          value={category}
          onChange={(event) => setCategory(event.currentTarget.value)}
          placeholder="Category"
          className="control-input"
        />
        <input
          required
          min="0.01"
          step="0.01"
          type="number"
          value={baseCost}
          onChange={(event) => setBaseCost(event.currentTarget.value)}
          placeholder="Base cost"
          className="control-input"
        />
        <input
          required
          min="0.01"
          step="0.01"
          type="number"
          value={currentPrice}
          onChange={(event) => setCurrentPrice(event.currentTarget.value)}
          placeholder="Current price"
          className="control-input"
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
          className="control-input"
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          placeholder="Product description"
          className="control-input xl:col-span-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="button-primary"
        >
          {busy ? "Adding..." : "Add Product"}
        </button>
      </form>
      {error ? <div className="p-4 pt-0"><ErrorPanel message={error} /></div> : null}
    </GlassPanel>
  );
}
