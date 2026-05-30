"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiBase, fetchAnalyticsSummary, fetchDashboard, updateSettings } from "@/lib/api";
import type { AnalyticsSummary, AutopilotSettings, DashboardState, ScanResponse } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

const initialState: DashboardState = {
  settings: { autopilot: true, minimum_margin_rate: 0.12 },
  products: [],
  history: [],
  logs: ["[UI] Connecting to pricing engine..."],
  alerts: []
};

type DashboardContextValue = {
  state: DashboardState;
  summary: AnalyticsSummary | null;
  lastScan: ScanResponse | null;
  error: string | null;
  loading: boolean;
  streamConnected: boolean;
  refresh: () => Promise<void>;
  updateAutopilotSettings: (settings: AutopilotSettings) => Promise<void>;
  setLastScanResult: (scan: ScanResponse | null) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [lastScan, setLastScan] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamConnected, setStreamConnected] = useState(false);
  const { notify } = useToast();

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboard, analytics] = await Promise.all([fetchDashboard(), fetchAnalyticsSummary().catch(() => null)]);
      setState(dashboard);
      setSummary(analytics);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? `${err.message}. If Render is waking from sleep, wait a few seconds and refresh.`
          : "Unknown dashboard error";
      setError(message);
      notify("Dashboard data could not be refreshed.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const updateAutopilotSettings = useCallback(
    async (settings: AutopilotSettings) => {
      setState((current) => ({ ...current, settings }));
      try {
        await updateSettings(settings);
        notify(`Autopilot ${settings.autopilot ? "enabled" : "disabled"} with ${Math.round(settings.minimum_margin_rate * 100)}% margin floor.`, "success");
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Settings update failed");
        notify("Settings update failed.", "error");
      }
    },
    [notify, refresh]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const source = new EventSource(`${apiBase()}/logs/stream`);
    source.onmessage = (event: MessageEvent<string>) => {
      setStreamConnected(true);
      const parsed = JSON.parse(event.data) as { message: string };
      setState((current) => ({ ...current, logs: [...current.logs, parsed.message].slice(-120) }));
      void refresh();
    };
    source.onopen = () => setStreamConnected(true);
    source.onerror = () => {
      setStreamConnected(false);
      setError("Live log stream disconnected. Retrying automatically.");
    };
    return () => {
      setStreamConnected(false);
      source.close();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      state,
      summary,
      lastScan,
      error,
      loading,
      streamConnected,
      refresh,
      updateAutopilotSettings,
      setLastScanResult: setLastScan
    }),
    [state, summary, lastScan, error, loading, streamConnected, refresh, updateAutopilotSettings]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used inside DashboardProvider");
  }
  return context;
}
