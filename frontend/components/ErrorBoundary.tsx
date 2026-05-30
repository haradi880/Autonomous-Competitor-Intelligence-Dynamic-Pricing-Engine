"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Frontend boundary caught an error", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-cloud p-6">
          <section className="glass-panel max-w-lg p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-coral/10 text-coral">
              <AlertTriangle size={22} />
            </span>
            <h1 className="mt-4 text-xl font-semibold">Interface recovery needed</h1>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              The dashboard hit a frontend rendering issue. Refreshing usually restores the session without changing backend data.
            </p>
            <button type="button" onClick={() => location.reload()} className="button-primary mt-5">
              <RefreshCcw size={17} />
              Reload dashboard
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
