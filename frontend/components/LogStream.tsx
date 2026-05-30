"use client";

import { Terminal } from "lucide-react";
import { EmptyState } from "@/components/ui";

type Props = {
  logs: string[];
};

export function LogStream({ logs }: Props) {
  return (
    <aside className="flex h-[520px] flex-col rounded-xl border border-white/10 bg-ink/95 text-white shadow-xl backdrop-blur xl:sticky xl:top-5">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Terminal size={18} />
        <h2 className="text-base font-semibold">Execution Stream</h2>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4 font-mono text-xs leading-5 text-white/80">
        {logs.length === 0 ? (
          <div className="text-ink"><EmptyState title="No execution logs" description="Agent activity will stream here when scans run." /></div>
        ) : (
          logs.map((log, index) => (
            <p key={`${log}-${index}`} className="break-words rounded bg-white/5 px-2 py-1">
              {log}
            </p>
          ))
        )}
      </div>
    </aside>
  );
}
