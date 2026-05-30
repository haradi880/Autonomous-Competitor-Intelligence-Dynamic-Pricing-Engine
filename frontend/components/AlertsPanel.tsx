import { AlertTriangle, Info, Siren } from "lucide-react";
import type { AlertItem } from "@/lib/types";
import { EmptyState, GlassPanel, SectionHeader } from "@/components/ui";

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
    <GlassPanel>
      <SectionHeader title="Operational Alerts" description={`${alerts.length} active events across pricing, matching, and webhooks.`} />
      <div className="divide-y divide-ink/10">
        {alerts.length === 0 ? (
          <div className="p-4"><EmptyState title="No active alerts" description="The pricing engine has not reported any issues requiring attention." /></div>
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
    </GlassPanel>
  );
}
