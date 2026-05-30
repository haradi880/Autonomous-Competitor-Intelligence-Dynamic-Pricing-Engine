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
    <section className="border-b border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur sm:px-5 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1600px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)] lg:items-center">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Control Plane</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-4xl">Autopilot Mode</h1>
        </div>
        <button
          type="button"
          aria-pressed={settings.autopilot}
          title="Toggle autopilot"
          onClick={() => onChange({ ...settings, autopilot: !settings.autopilot })}
          className={`flex h-14 w-28 shrink-0 items-center rounded-full border p-1.5 transition-colors duration-200 ${
            settings.autopilot ? "border-fern bg-fern" : "border-ink/20 bg-mist"
          }`}
        >
          <span
            className={`grid h-11 w-11 place-items-center rounded-full bg-white shadow transition-transform duration-200 ease-out ${
              settings.autopilot ? "translate-x-14 text-fern" : "translate-x-0 text-ink/50"
            }`}
          >
            <Power size={24} />
          </span>
        </button>
      </div>

      <div className="flex flex-col justify-center gap-3 rounded-2xl border border-ink/10 bg-white/70 p-4">
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
      </div>
    </section>
  );
}
