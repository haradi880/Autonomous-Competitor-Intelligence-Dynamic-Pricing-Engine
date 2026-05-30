"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function GlassPanel({ children, className = "" }: PanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`glass-panel ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function SectionHeader({
  icon,
  title,
  description,
  action
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-ink/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon ? <span className="grid h-10 w-10 place-items-center rounded-lg bg-mist text-ink">{icon}</span> : null}
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-5 text-ink/55">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="w-full sm:w-auto sm:shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const toneClass = {
    success: "border-fern/25 bg-fern/10 text-fern",
    warning: "border-brass/25 bg-brass/10 text-brass",
    danger: "border-coral/25 bg-coral/10 text-coral",
    info: "border-violet/25 bg-violet/10 text-violet",
    neutral: "border-ink/10 bg-mist text-ink/65"
  }[tone];
  return <span className={`status-badge ${toneClass}`}>{children}</span>;
}

export function SkeletonBlock({ className = "h-24" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gradient-to-r from-ink/5 via-white/70 to-ink/5 ${className}`} />;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-ink/15 bg-white/50 p-6 text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-mist text-ink/50">
          <Inbox size={20} />
        </span>
        <p className="mt-3 font-semibold">{title}</p>
        <p className="mt-1 max-w-md text-sm leading-6 text-ink/55">{description}</p>
      </div>
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-coral/25 bg-coral/10 px-4 py-3 text-sm text-coral sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <p>{message}</p>
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="button-secondary h-9 border-coral/25 text-coral">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function LoadingLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </span>
  );
}
