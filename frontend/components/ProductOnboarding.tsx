"use client";

import { FormEvent, useState } from "react";
import { PackagePlus } from "lucide-react";
import { createTrackedProduct } from "@/lib/api";

type Props = {
  onComplete: () => Promise<void>;
};

export function ProductOnboarding({ onComplete }: Props) {
  const [title, setTitle] = useState("");
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
        current_price: Number(currentPrice)
      });
      setTitle("");
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product creation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-ink/10 bg-white">
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
        <PackagePlus size={18} />
        <h2 className="text-base font-semibold">Track Your Own Product</h2>
      </div>
      <form onSubmit={submit} className="grid gap-3 p-4 md:grid-cols-[1fr_120px_120px_auto]">
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          placeholder="Product title"
          className="h-10 border border-ink/15 px-3 text-sm"
        />
        <input
          required
          min="0.01"
          step="0.01"
          type="number"
          value={baseCost}
          onChange={(event) => setBaseCost(event.currentTarget.value)}
          placeholder="Base cost"
          className="h-10 border border-ink/15 px-3 text-sm"
        />
        <input
          required
          min="0.01"
          step="0.01"
          type="number"
          value={currentPrice}
          onChange={(event) => setCurrentPrice(event.currentTarget.value)}
          placeholder="Current price"
          className="h-10 border border-ink/15 px-3 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-10 bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Adding..." : "Add Product"}
        </button>
      </form>
      {error ? <div className="border-t border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div> : null}
    </section>
  );
}
