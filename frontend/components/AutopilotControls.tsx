"use client";

import { Gauge, Power } from "lucide-react";
import type { AutopilotSettings } from "@/lib/types";

type Props = {
  settings: AutopilotSettings;
  onChange: (next: AutopilotSettings) => void;
};

export function AutopilotControls({ settings, onChange }: Props) {
  const percent = Math.round(settings.minimum_margin_rate * 100);

  return (
    <section className="grid gap-5 border-b border-ink/10 bg-white px-5 py-5 md:grid-cols-[1fr_1.2fr] md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Control Plane</p>
          <h1 className="mt-1 text-2xl font-semibold md:text-4xl">Autopilot Mode</h1>
        </div>
        <button
          type="button"
          aria-pressed={settings.autopilot}
          title="Toggle autopilot"
          onClick={() => onChange({ ...settings, autopilot: !settings.autopilot })}
          className={`flex h-16 w-32 items-center rounded-full border p-2 transition ${
            settings.autopilot ? "border-fern bg-fern" : "border-ink/20 bg-mist"
          }`}
        >
          <span
            className={`grid h-12 w-12 place-items-center rounded-full bg-white shadow transition ${
              settings.autopilot ? "translate-x-16 text-fern" : "translate-x-0 text-ink/50"
            }`}
          >
            <Power size={24} />
          </span>
        </button>
      </div>

      <div className="flex flex-col justify-center gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Gauge size={18} />
            Minimum Margin Threshold
          </div>
          <div className="min-w-16 rounded border border-ink/15 bg-mist px-3 py-1 text-center text-sm font-semibold">
            {percent}%
          </div>
        </div>
        <input
          aria-label="Minimum margin threshold"
          type="range"
          min={1}
          max={80}
          value={percent}
          onChange={(event) =>
            onChange({ ...settings, minimum_margin_rate: Number(event.currentTarget.value) / 100 })
          }
          className="h-2 w-full accent-coral"
        />
      </div>
    </section>
  );
}

