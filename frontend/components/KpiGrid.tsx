"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, BarChart3, Boxes, Crosshair, Target } from "lucide-react";
import type { AnalyticsSummary } from "@/lib/types";

type Props = {
  summary: AnalyticsSummary | null;
};

const iconClass = "h-5 w-5";

export function KpiGrid({ summary }: Props) {
  const items = [
    { label: "Products Tracked", value: summary?.total_products ?? 0, icon: <Boxes className={iconClass} />, tone: "text-fern" },
    { label: "Active Products", value: summary?.active_products ?? 0, icon: <Target className={iconClass} />, tone: "text-brass" },
    { label: "Competitor Targets", value: summary?.active_competitors ?? 0, icon: <Crosshair className={iconClass} />, tone: "text-coral" },
    { label: "Recent Scans", value: summary?.recent_scans ?? 0, icon: <Activity className={iconClass} />, tone: "text-ink" },
    {
      label: "Avg Price Gap",
      value: summary?.average_price_gap === null || summary?.average_price_gap === undefined ? "N/A" : `${Math.round(summary.average_price_gap * 100)}%`,
      icon: <BarChart3 className={iconClass} />,
      tone: "text-fern"
    },
    { label: "Active Alerts", value: summary?.active_alerts ?? 0, icon: <AlertTriangle className={iconClass} />, tone: "text-coral" }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.035 }}
          whileHover={{ y: -2 }}
          className="rounded-lg border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur"
        >
          <div className={`mb-4 inline-grid h-10 w-10 place-items-center rounded-md bg-mist ${item.tone}`}>{item.icon}</div>
          <p className="text-2xl font-semibold">{item.value}</p>
          <p className="mt-1 text-xs font-semibold uppercase text-ink/50">{item.label}</p>
        </motion.div>
      ))}
    </section>
  );
}
