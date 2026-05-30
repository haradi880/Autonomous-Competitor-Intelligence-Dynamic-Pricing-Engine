"use client";

import { Radio, Terminal } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/ui";

type Props = {
  logs: string[];
  streamConnected: boolean;
};

export function LogStream({ logs, streamConnected }: Props) {
  return (
    <aside className="flex max-h-[70vh] min-h-[360px] min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-ink/95 text-white shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Terminal size={18} className="shrink-0" />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">Execution Stream</h2>
            <p className="text-xs text-white/45">Live LangGraph agent ticks</p>
          </div>
        </div>
        <StatusBadge tone={streamConnected ? "success" : "warning"}>
          <Radio size={12} />
          {streamConnected ? "Live" : "Connecting"}
        </StatusBadge>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 py-4 font-mono text-xs leading-5 text-white/80">
        {logs.length === 0 ? (
          <div className="text-ink"><EmptyState title="No execution logs" description="Agent activity will stream here when scans run." /></div>
        ) : (
          logs.map((log, index) => (
            <p key={`${log}-${index}`} className="whitespace-pre-wrap break-words rounded bg-white/5 px-2 py-1">
              {log}
            </p>
          ))
        )}
      </div>
    </aside>
  );
}
