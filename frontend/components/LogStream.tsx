"use client";

import { Terminal } from "lucide-react";

type Props = {
  logs: string[];
};

export function LogStream({ logs }: Props) {
  return (
    <aside className="flex h-[520px] flex-col border border-ink/10 bg-ink text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Terminal size={18} />
        <h2 className="text-base font-semibold">Execution Stream</h2>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4 font-mono text-xs leading-5 text-white/80">
        {logs.map((log, index) => (
          <p key={`${log}-${index}`} className="break-words">
            {log}
          </p>
        ))}
      </div>
    </aside>
  );
}

