"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { fetchScans } from "@/lib/api";
import type { AgentRun } from "@/lib/types";

function statusIcon(status: AgentRun["status"]) {
  if (status === "complete") return <CheckCircle2 size={16} />;
  if (status === "failed") return <AlertCircle size={16} />;
  return <Clock3 size={16} />;
}

export function ScanHistoryPanel() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    try {
      setRuns(await fetchScans());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load scan history");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <section className="border border-ink/10 bg-white">
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
        <Activity size={18} />
        <div>
          <h2 className="text-base font-semibold">Agent Scan History</h2>
          <p className="text-xs text-ink/55">Persistent execution records for each competitor analysis run.</p>
        </div>
      </div>
      {error ? <div className="border-b border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div> : null}
      <div className="divide-y divide-ink/10">
        {runs.length === 0 ? (
          <p className="px-4 py-4 text-sm text-ink/55">No persisted scans yet. Run a competitor target to populate this timeline.</p>
        ) : (
          runs.map((run) => (
            <div key={run.id} className="px-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div
                    className={`inline-flex items-center gap-2 text-sm font-semibold ${
                      run.status === "failed" ? "text-coral" : run.status === "complete" ? "text-fern" : "text-brass"
                    }`}
                  >
                    {statusIcon(run.status)}
                    {run.status}
                  </div>
                  <p className="mt-2 font-semibold">{run.competitor_name}</p>
                  <a href={run.competitor_url} target="_blank" rel="noreferrer" className="text-sm text-ink/60 underline">
                    {run.competitor_url}
                  </a>
                </div>
                <p className="text-xs text-ink/50">{new Date(run.created_at).toLocaleString()}</p>
              </div>
              {run.error_message ? <p className="mt-3 text-sm text-coral">{run.error_message}</p> : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
