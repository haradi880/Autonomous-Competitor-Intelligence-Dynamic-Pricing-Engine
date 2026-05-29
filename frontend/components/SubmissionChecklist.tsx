"use client";

import { BookOpen, CheckCircle2, Cloud, Database, Network, Workflow } from "lucide-react";
import { apiDocsUrl } from "@/lib/api";

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

export function SubmissionChecklist() {
  return (
    <section className="border border-ink/10 bg-white">
      <div className="flex flex-col gap-3 border-b border-ink/10 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold">Project A Submission Readiness</h2>
          <p className="mt-1 text-sm text-ink/60">Reviewer path mapped directly to the take-home PDF requirements.</p>
        </div>
        <a
          href={apiDocsUrl()}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 border border-ink/15 bg-ink px-4 text-sm font-semibold text-white"
        >
          <BookOpen size={17} />
          Read API Docs
        </a>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="border border-ink/10 bg-mist p-3">
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
    </section>
  );
}
