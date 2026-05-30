import { AlertTriangle, Info, Siren } from "lucide-react";
import type { AlertItem } from "@/lib/types";

type Props = {
  alerts: AlertItem[];
};

function iconFor(severity: AlertItem["severity"]) {
  if (severity === "critical") return <Siren size={16} />;
  if (severity === "warning") return <AlertTriangle size={16} />;
  return <Info size={16} />;
}

export function AlertsPanel({ alerts }: Props) {
  return (
    <section className="rounded-lg border border-white/70 bg-white/85 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <h2 className="text-base font-semibold">Operational Alerts</h2>
        <span className="text-xs font-semibold text-ink/55">{alerts.length}</span>
      </div>
      <div className="divide-y divide-ink/10">
        {alerts.length === 0 ? (
          <p className="px-4 py-4 text-sm text-ink/55">No active alerts.</p>
        ) : (
          alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="flex gap-3 px-4 py-3 text-sm">
              <span
                className={`mt-0.5 ${
                  alert.severity === "critical"
                    ? "text-coral"
                    : alert.severity === "warning"
                      ? "text-brass"
                      : "text-fern"
                }`}
              >
                {iconFor(alert.severity)}
              </span>
              <div>
                <p className="font-semibold">{alert.category.replaceAll("_", " ")}</p>
                <p className="mt-1 text-ink/65">{alert.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
