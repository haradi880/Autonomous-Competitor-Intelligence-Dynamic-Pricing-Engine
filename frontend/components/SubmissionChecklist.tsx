"use client";

import { BookOpen, CheckCircle2, Cloud, Database, Network, Workflow } from "lucide-react";
import { apiDocsUrl } from "@/lib/api";
import { GlassPanel, SectionHeader } from "@/components/ui";

const items = [
  {
    icon: <Database size={18} />,
    title: "Supabase pgvector",
    detail: "tracked_products, competitor_products, pricing_history, alerts, vector RPC"
  },
  {
    icon: <Workflow size={18} />,
    title: "LangGraph Agents",
    detail: "Ingestion, Classifier, Analyst, Decision Maker, Webhook"
  },
  {
    icon: <Network size={18} />,
    title: "FastAPI Surface",
    detail: "scan trigger, dashboard state, alerts, settings, logs, mock storefront webhook"
  },
  {
    icon: <Cloud size={18} />,
    title: "Deployable",
    detail: "Cloud Run Dockerfile, Vercel config, env-only secrets"
  }
];

type Props = {
  expanded?: boolean;
};

export function SubmissionChecklist({ expanded = false }: Props) {
  return (
    <GlassPanel>
      <SectionHeader
        title="Project A Submission Readiness"
        description="Reviewer path mapped directly to the take-home PDF requirements."
        action={
        <a
          href={apiDocsUrl()}
          target="_blank"
          rel="noreferrer"
          className="button-primary h-10"
        >
          <BookOpen size={17} />
          Read API Docs
        </a>
        }
      />
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="glass-panel-subtle p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-fern">{item.icon}</span>
              {item.title}
            </div>
            <p className="mt-2 text-xs leading-5 text-ink/65">{item.detail}</p>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-fern">
              <CheckCircle2 size={14} />
              Implemented
            </div>
          </div>
        ))}
      </div>
      {expanded ? (
        <div className="grid gap-3 border-t border-ink/10 p-4 text-sm md:grid-cols-2">
          <div className="glass-panel-subtle p-3">
            <p className="font-semibold">Hosted Services</p>
            <p className="mt-2 text-ink/65">Frontend runs on Vercel. Backend FastAPI docs are available from Render.</p>
          </div>
          <div className="glass-panel-subtle p-3">
            <p className="font-semibold">Final Safety Step</p>
            <p className="mt-2 text-ink/65">Rotate exposed API keys before submitting the repository and live URLs.</p>
          </div>
        </div>
      ) : null}
    </GlassPanel>
  );
}
