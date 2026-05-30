import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  GitBranch,
  Globe2,
  LineChart,
  Lock,
  Network,
  ShieldCheck,
  Workflow,
  Zap
} from "lucide-react";

const backendDocs = "https://autonomous-competitor-intelligence.onrender.com/docs";
const frontendUrl = "https://autonomous-competitor-intelligence.vercel.app/";

const stack = [
  { name: "Next.js App Router", detail: "Multi-page operator console with responsive navigation and client-side live state.", icon: <Code2 size={19} /> },
  { name: "Tailwind CSS", detail: "Shared visual system for glass panels, cards, controls, status badges, and mobile layouts.", icon: <Zap size={19} /> },
  { name: "Framer Motion", detail: "Subtle transitions for cards, timeline states, toasts, and interface feedback.", icon: <GitBranch size={19} /> },
  { name: "FastAPI", detail: "Typed REST API for products, competitors, scans, alerts, analytics, and settings.", icon: <Network size={19} /> },
  { name: "LangGraph", detail: "Stateful named-agent workflow for the autonomous pricing pipeline.", icon: <Workflow size={19} /> },
  { name: "Supabase pgvector", detail: "PostgreSQL storage plus vector similarity search for semantic product matching.", icon: <Database size={19} /> },
  { name: "Jina Reader", detail: "Converts competitor product pages into clean Markdown for LLM parsing.", icon: <Globe2 size={19} /> },
  { name: "Gemini", detail: "Structured JSON extraction and semantic embeddings for product intelligence.", icon: <BrainCircuit size={19} /> }
];

const agents = [
  {
    name: "Ingestion Agent",
    purpose: "Receives the competitor URL and fetches clean Markdown through Jina Reader.",
    output: "Raw product-page text ready for structured parsing."
  },
  {
    name: "Classifier Agent",
    purpose: "Uses Gemini structured output to extract title, price, currency, availability, stock, and specs.",
    output: "Strict `ExtractionResult` JSON validated by Pydantic."
  },
  {
    name: "Analyst Agent",
    purpose: "Generates embeddings, calls Supabase `match_products`, computes confidence, trend, volatility, and price-to-spec signals.",
    output: "Verified semantic match and analyst metrics."
  },
  {
    name: "Decision Maker Agent",
    purpose: "Applies 5% undercut pricing while enforcing the configured margin floor.",
    output: "Explainable pricing decision with guardrail reasoning."
  },
  {
    name: "Webhook Agent",
    purpose: "Dispatches the storefront update only when the price changed and autopilot is enabled.",
    output: "Webhook action, recommendation, or persisted no-op."
  }
];

const dataTables = [
  "tracked_products",
  "competitors",
  "competitor_targets",
  "competitor_products",
  "agent_runs",
  "agent_run_events",
  "pricing_history",
  "pricing_alerts"
];

const endpoints = [
  "GET /api/v1/dashboard",
  "POST /api/v1/products",
  "GET /api/v1/competitors",
  "POST /api/v1/competitor-targets/{id}/scan",
  "GET /api/v1/analytics/summary",
  "GET /api/v1/logs/stream"
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-5 lg:px-8">
      <section className="glass-panel overflow-hidden">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.15fr_0.85fr] lg:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fern">Documentation</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Autonomous Competitor Intelligence & Dynamic Pricing Engine
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/65 sm:text-base">
              This page explains how the deployed Project A system works: the stack, agents, data flow, pricing logic,
              persistence layer, and production deployment path. It is written for reviewers, operators, and engineers
              who need to understand the product without reading every source file first.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a href={backendDocs} target="_blank" rel="noreferrer" className="button-primary">
                <Code2 size={17} />
                Open API Docs
              </a>
              <a href={frontendUrl} target="_blank" rel="noreferrer" className="button-secondary">
                <Globe2 size={17} />
                Live Dashboard
              </a>
            </div>
          </div>
          <div className="grid gap-3 rounded-2xl border border-ink/10 bg-white/65 p-4">
            {[
              ["Frontend", "Vercel-hosted Next.js SaaS console"],
              ["Backend", "Render-hosted FastAPI service"],
              ["Database", "Supabase PostgreSQL with pgvector"],
              ["AI", "Gemini structured parsing and embeddings"],
              ["Scraping", "Jina Reader Markdown extraction"]
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-3 border-b border-ink/10 pb-3 last:border-b-0 last:pb-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</span>
                <span className="text-right text-sm font-semibold text-ink/75">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stack.map((item) => (
          <article key={item.name} className="glass-panel p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-mist text-fern">{item.icon}</span>
            <h2 className="mt-4 font-semibold">{item.name}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="glass-panel">
          <div className="border-b border-ink/10 p-4">
            <div className="flex items-center gap-2">
              <Bot size={19} />
              <h2 className="font-semibold">Agent Workflow</h2>
            </div>
            <p className="mt-1 text-sm text-ink/55">Competitor URL ingestion to pricing action, implemented as named LangGraph nodes.</p>
          </div>
          <div className="divide-y divide-ink/10">
            {agents.map((agent, index) => (
              <article key={agent.name} className="grid gap-3 p-4 sm:grid-cols-[48px_1fr]">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-sm font-semibold text-white">{index + 1}</div>
                <div>
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-ink/60">{agent.purpose}</p>
                  <p className="mt-2 inline-flex rounded-full border border-fern/20 bg-fern/10 px-3 py-1 text-xs font-semibold text-fern">
                    {agent.output}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="glass-panel p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} />
              <h2 className="font-semibold">Pricing Rule</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/60">
              Target price starts at <strong>competitor price x 0.95</strong>. If that violates the configured margin floor,
              the engine clamps to <strong>base cost x margin threshold</strong>.
            </p>
          </section>
          <section className="glass-panel p-4">
            <div className="flex items-center gap-2">
              <Lock size={18} />
              <h2 className="font-semibold">Security</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/60">
              Secrets are environment-only. Supabase writes require a server-side service role key; publishable keys are not used for backend mutations.
            </p>
          </section>
        </aside>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2">
            <Database size={18} />
            <h2 className="font-semibold">Persistence Model</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {dataTables.map((table) => (
              <span key={table} className="status-badge border-ink/10 bg-mist text-ink/70">{table}</span>
            ))}
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2">
            <Network size={18} />
            <h2 className="font-semibold">API Surface</h2>
          </div>
          <div className="mt-4 space-y-2">
            {endpoints.map((endpoint) => (
              <code key={endpoint} className="block rounded-lg border border-ink/10 bg-white/70 px-3 py-2 text-xs text-ink/70">
                {endpoint}
              </code>
            ))}
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2">
            <LineChart size={18} />
            <h2 className="font-semibold">Operator Workflow</h2>
          </div>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-ink/65">
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-1 text-fern" />Create a tracked product with cost and target margin.</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-1 text-fern" />Add competitor records and target URLs.</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-1 text-fern" />Run scans and review agent reasoning.</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-1 text-fern" />Use autopilot to dispatch approved price updates.</li>
          </ol>
        </div>
      </section>

      <section className="mt-5 glass-panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Cloud size={18} />
              <h2 className="font-semibold">Deployment Ready</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Frontend deploys on Vercel. Backend deploys on Render or Cloud Run using the Docker-ready FastAPI service.
              Supabase schema is stored in `database/schema.sql` for reproducible setup.
            </p>
          </div>
          <Link href="/readiness" className="button-secondary shrink-0">
            View readiness
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
