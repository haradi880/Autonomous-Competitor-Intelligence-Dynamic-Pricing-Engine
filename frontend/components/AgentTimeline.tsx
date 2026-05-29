import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

type StageKey = "ingestion" | "classifier" | "analyst" | "decision" | "webhook";
type StageStatus = "pending" | "running" | "complete" | "failed";

type Props = {
  logs: string[];
  busy: boolean;
  failed: boolean;
};

const stages: Array<{ key: StageKey; label: string; token: string; detail: string }> = [
  { key: "ingestion", label: "Ingestion", token: "IngestionAgent", detail: "Markdown fetched via Jina" },
  { key: "classifier", label: "Classifier", token: "ClassifierAgent", detail: "Structured JSON parsed" },
  { key: "analyst", label: "Analyst", token: "AnalystAgent", detail: "Vector RPC and price/spec analysis" },
  { key: "decision", label: "Decision Maker", token: "DecisionMakerAgent", detail: "Pricing formula applied" },
  { key: "webhook", label: "Webhook", token: "WebhookAgent", detail: "Storefront update evaluated" }
];

function statusFor(index: number, logs: string[], busy: boolean, failed: boolean): StageStatus {
  const hitIndex = stages.findIndex((stage) => logs.some((log) => log.includes(stage.token)));
  const stageHit = logs.some((log) => log.includes(stages[index].token));
  if (failed && index === Math.max(0, hitIndex)) return "failed";
  if (stageHit) return "complete";
  if (busy && index === hitIndex + 1) return "running";
  return "pending";
}

function iconFor(status: StageStatus) {
  if (status === "complete") return <CheckCircle2 size={18} />;
  if (status === "failed") return <XCircle size={18} />;
  if (status === "running") return <Loader2 size={18} className="animate-spin" />;
  return <Circle size={18} />;
}

export function AgentTimeline({ logs, busy, failed }: Props) {
  return (
    <div className="grid gap-2 border-t border-ink/10 bg-white px-4 py-4 md:grid-cols-5">
      {stages.map((stage, index) => {
        const status = statusFor(index, logs, busy, failed);
        return (
          <div
            key={stage.key}
            className={`border px-3 py-3 text-sm ${
              status === "complete"
                ? "border-fern/30 bg-fern/10 text-fern"
                : status === "failed"
                  ? "border-coral/30 bg-coral/10 text-coral"
                  : status === "running"
                    ? "border-brass/30 bg-brass/10 text-brass"
                    : "border-ink/10 bg-mist text-ink/55"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {iconFor(status)}
              {stage.label}
            </div>
            <p className="mt-2 text-xs leading-4 opacity-80">{stage.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
