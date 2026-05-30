"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Cloud, Database, Radio, RefreshCcw, Server, Timer } from "lucide-react";
import { GlassPanel, LoadingLabel, StatusBadge } from "@/components/ui";

type Props = {
  loading: boolean;
  error: string | null;
  streamConnected: boolean;
  productCount: number;
  logCount: number;
  onRetry: () => void;
};

type StepTone = "complete" | "running" | "failed" | "pending";

const stepStyles: Record<StepTone, string> = {
  complete: "border-fern/20 bg-fern/10 text-fern",
  running: "border-violet/25 bg-violet/10 text-violet",
  failed: "border-coral/25 bg-coral/10 text-coral",
  pending: "border-ink/10 bg-white/60 text-ink/45"
};

function StatusStep({
  icon,
  label,
  detail,
  tone
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  tone: StepTone;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-ink/10 bg-white/65 p-3">
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${stepStyles[tone]}`}>
        {tone === "complete" ? <CheckCircle2 size={16} /> : icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-ink/55">{detail}</p>
      </div>
    </div>
  );
}

export function SystemStatusPanel({ loading, error, streamConnected, productCount, logCount, onRetry }: Props) {
  const backendTone: StepTone = error && productCount === 0 ? "failed" : loading ? "running" : "complete";
  const dataTone: StepTone = productCount > 0 ? "complete" : loading ? "running" : error ? "failed" : "pending";
  const streamTone: StepTone = streamConnected ? "complete" : error ? "running" : "pending";

  return (
    <GlassPanel className="overflow-hidden">
      <div className="border-b border-ink/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Hosted demo status</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-ink">Processing Center</h2>
            <p className="mt-1 text-xs leading-5 text-ink/55">
              Render free instances may sleep. When that happens, the first request can take a little longer while the API wakes.
            </p>
          </div>
          <StatusBadge tone={error ? "warning" : loading ? "info" : "success"}>
            {error ? "Recovering" : loading ? "Waking" : "Ready"}
          </StatusBadge>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {loading ? <LoadingLabel label="Preparing reviewer environment..." /> : null}
        <StatusStep
          icon={<Server size={16} />}
          label="Backend API"
          detail={backendTone === "running" ? "Waking Render service and checking FastAPI." : "FastAPI endpoint is reachable."}
          tone={backendTone}
        />
        <StatusStep
          icon={<Database size={16} />}
          label="Supabase Data"
          detail={productCount > 0 ? `${productCount} tracked products loaded.` : "Loading products, targets, alerts, and pricing history."}
          tone={dataTone}
        />
        <StatusStep
          icon={<Radio size={16} />}
          label="Live Stream"
          detail={streamConnected ? `${logCount} execution ticks received.` : "Opening Server-Sent Events channel for agent logs."}
          tone={streamTone}
        />
        <StatusStep
          icon={<Cloud size={16} />}
          label="AI Pipeline"
          detail="Scans run Jina extraction, Gemini parsing, vector matching, pricing logic, and webhook evaluation."
          tone={productCount > 0 ? "complete" : "pending"}
        />
      </div>

      {error ? (
        <div className="border-t border-brass/20 bg-brass/10 p-4">
          <div className="flex gap-2 text-sm text-brass">
            <AlertTriangle size={17} className="mt-0.5 shrink-0" />
            <p className="leading-6">{error}</p>
          </div>
          <button type="button" onClick={onRetry} className="button-secondary mt-3 h-9 w-full border-brass/25 text-brass">
            <RefreshCcw size={16} />
            Retry connection
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-ink/10 bg-mist/70 px-4 py-3 text-xs text-ink/55">
          <Timer size={15} />
          Cold-start friendly UI is active for reviewers.
        </div>
      )}
    </GlassPanel>
  );
}
