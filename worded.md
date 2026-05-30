# Detailed Project Brief For GPT / Reviewer Explanation

## Project Name

Autonomous Competitor Intelligence & Dynamic Pricing Engine

## One-Line Summary

This project is a production-oriented MVP for Project A: an autonomous pricing command center that ingests competitor product URLs, extracts structured pricing data with AI, verifies semantic product matches using Supabase pgvector, applies deterministic pricing rules, and optionally dispatches storefront price updates through a webhook.

## Live Deployment

- Frontend dashboard: https://autonomous-competitor-intelligence.vercel.app/
- Backend Swagger docs: https://autonomous-competitor-intelligence.onrender.com/docs
- Backend health endpoint: https://autonomous-competitor-intelligence.onrender.com/api/v1/health

## What Problem It Solves

Retailers often lose margin or competitiveness because competitor prices change faster than manual teams can track. A human operator normally has to open competitor pages, read messy product content, decide whether the product is truly comparable, check margin rules, and then update the storefront.

This MVP automates that workflow:

1. A user tracks an internal product.
2. A user adds competitor product URLs.
3. The backend extracts clean Markdown from the competitor page.
4. Gemini converts unstructured product content into strict JSON.
5. Gemini embeddings and Supabase pgvector verify whether the competitor listing semantically matches the tracked product.
6. The pricing engine calculates a target price.
7. The engine logs the decision, stores scan history, raises alerts, and dispatches a webhook when autopilot is enabled.

## Assignment Alignment

The take-home assignment asked for Project A: Autonomous Competitor Intelligence & Dynamic Pricing Engine.

This implementation maps directly to the requested flow:

Competitor URL Ingested -> Agent Analysis & Vector Verification -> Storefront Webhook Update

The implemented system includes:

- Competitor URL ingestion workflow.
- Jina Reader Markdown extraction.
- Gemini structured product parsing.
- Gemini embedding generation.
- Supabase PostgreSQL with pgvector.
- Vector similarity RPC through `match_products`.
- LangGraph stateful named-agent pipeline.
- Deterministic pricing formula.
- Autopilot toggle.
- Minimum margin threshold slider.
- Persistent alerts.
- Persistent pricing history.
- Persistent scan runs and agent events.
- Multi-page Next.js dashboard.
- Render backend deployment.
- Vercel frontend deployment.

## Technical Stack

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide Icons
- Recharts
- Vercel deployment

### Backend

- Python 3.11+
- FastAPI
- Uvicorn
- Pydantic v2 strict schemas
- LangGraph for the stateful agent workflow
- Render deployment

### Database

- Supabase PostgreSQL
- pgvector extension
- Vector similarity search through a SQL RPC function

### AI / Scraping Providers

- Jina Reader API for clean Markdown extraction
- Gemini for structured JSON parsing
- Gemini embeddings for semantic similarity

## Major Backend Modules

### `backend/models/schemas.py`

Defines strict Pydantic models for backend input/output contracts.

Important schemas:

- `ProductIn`
- `Product`
- `CompetitorUrlInput`
- `CompetitorTargetIn`
- `CompetitorTarget`
- `ExtractionResult`
- `PricingDecision`
- `ScanResponse`
- `AgentRun`
- `AgentRunEvent`
- `DashboardState`
- `AlertItem`

This keeps API input and output type-safe and validates user data before it reaches the pricing engine.

### `backend/services/agent_engine.py`

Handles competitor page extraction and AI parsing.

Flow:

1. Receives a competitor URL.
2. Prepends the URL with `https://r.jina.ai/`.
3. Fetches clean Markdown.
4. Sends Markdown to Gemini.
5. Uses Gemini structured JSON output against the `ExtractionResult` schema.

Production behavior:

- Demo/local fallback fixtures are disabled by default.
- `ENABLE_DEMO_FALLBACKS=false` keeps production using real Jina/Gemini behavior.

### `backend/services/pricing_graph.py`

Implements the LangGraph pipeline with named agents:

- `IngestionAgent`
- `ClassifierAgent`
- `AnalystAgent`
- `DecisionMakerAgent`
- `WebhookAgent`

Each agent performs a clear step and appends logs for the UI execution stream.

### `backend/services/pricing_engine.py`

Handles embedding generation and webhook dispatch.

Important behavior:

- Uses Gemini embeddings.
- Applies webhook dispatch to the configured storefront endpoint.
- Handles Render-local webhook URL rewriting when needed.

### `backend/services/supabase_store.py`

Centralizes all Supabase persistence.

It handles:

- Products
- Competitor observations
- Competitor targets
- Agent scan runs
- Agent run events
- Pricing history
- Alerts
- Vector RPC matching

This keeps database writes out of routers and services that should focus on workflow logic.

### `backend/routers/api.py`

Exposes the REST API.

Important endpoints:

- `GET /api/v1/health`
- `GET /api/v1/dashboard`
- `GET /api/v1/alerts`
- `POST /api/v1/settings`
- `POST /api/v1/products`
- `POST /api/v1/scan`
- `GET /api/v1/competitor-targets`
- `POST /api/v1/competitor-targets`
- `POST /api/v1/competitor-targets/{target_id}/scan`
- `GET /api/v1/scans`
- `GET /api/v1/scans/{run_id}`
- `GET /api/v1/logs/stream`
- `POST /api/v1/mock-storefront-webhook`

## Database Schema

The Supabase schema lives in:

`database/schema.sql`

It creates the production tables:

- `tracked_products`
- `competitor_products`
- `competitor_targets`
- `agent_runs`
- `agent_run_events`
- `pricing_history`
- `pricing_alerts`

It also creates:

- pgvector extension
- HNSW vector index
- `match_products(sample_embedding, similarity_threshold)` RPC
- compatibility views for older table names

The backend expects a Supabase service-role key for writes. This is production-safe because public/publishable keys are not allowed to write sensitive pricing data.

## Pricing Logic

The pricing formula is deterministic:

Target Price = Competitor Price * 0.95

That means the system attempts to undercut the competitor by 5%.

However, it also enforces a margin floor:

Minimum Allowed Price = Internal Base Cost * (1 + Minimum Margin Rate)

If the 5% undercut would go below the margin floor, the engine clamps the target price to the margin floor.

Example:

- Competitor price: `$100`
- 5% undercut: `$95`
- Internal base cost: `$90`
- 12% margin floor: `$100.80`
- Final target price: `$100.80`

In this case, the price is clamped because selling at `$95` would violate the margin rule.

## Frontend Pages

The frontend is now a multi-page production operator console.

### `/`

Command Center overview:

- Autopilot controls
- Margin slider
- Competitor target workflow
- One-off scan panel
- Catalog intelligence
- Pricing trajectory chart
- Alerts
- Live log stream

### `/products`

Product management:

- Add tracked products
- View catalog intelligence
- Review pricing trajectory

### `/competitors`

Competitor monitoring:

- Add competitor product URLs
- Persist competitor targets
- Run scans against saved targets
- Run one-off competitor scans

### `/scans`

Scan history:

- Shows persisted agent run records
- Shows scan status
- Shows competitor URL and timestamp

### `/alerts`

Operational alert center:

- Match failures
- Margin floor clamps
- Webhook failures
- Recommendations when autopilot is off

### `/readiness`

Submission readiness:

- Assignment alignment
- Hosted services
- Final safety notes
- API docs link

## User Workflow

The expected user path is:

1. Open the Vercel dashboard.
2. Go to Products.
3. Add a tracked product with base cost and current price.
4. Go to Competitors.
5. Add a competitor name and competitor product URL.
6. Run Scan.
7. Watch the LangGraph execution logs.
8. Review semantic match confidence, vector distance, price-to-spec ratio, target price, margin floor, and webhook status.
9. Check Alerts if something failed or was clamped.
10. Check Scans for persistent execution records.

## Why This Feels Production-Ready

The project avoids a toy/demo-only flow and supports real operator behavior:

- Users can add their own products.
- Users can add their own competitor URLs.
- Scan targets are persisted.
- Scan runs are persisted.
- Alerts are persisted.
- Pricing history is persisted.
- API contracts are typed with Pydantic and TypeScript.
- Secrets are loaded from environment variables.
- Backend write access requires a server-side Supabase key.
- Frontend is deployed separately from backend.
- README documents deployment and verification.

## Verification Status

The following checks were run successfully on May 30, 2026:

```powershell
.\.venv\Scripts\python.exe -m compileall backend
cd frontend
npm run typecheck
npm run lint
npm run build
```

Results:

- Python compile: passed
- TypeScript typecheck: passed
- ESLint: passed
- Next.js production build: passed

Live endpoint checks:

- Frontend Vercel URL: returned `200`
- Backend `/api/v1/health`: returned `200`
- Backend `/api/v1/dashboard`: returned `200`

Note: Render free-tier services can take a few seconds to wake from sleep.

## What To Tell A Reviewer

This is not just a static dashboard. It is an end-to-end system:

- The frontend gives an operator a real workflow.
- FastAPI exposes typed endpoints for dashboard state, product creation, competitor target management, scan triggering, alerts, logs, and history.
- LangGraph coordinates the scan as a stateful agent pipeline.
- Gemini and Jina perform the AI extraction and semantic analysis.
- Supabase pgvector verifies product similarity.
- The deterministic pricing engine makes the pricing decision.
- The webhook simulates storefront integration.
- The entire app is deployed with a real frontend and backend URL.

## Suggested GPT Prompt To Explain The Project

Use this prompt if you want GPT to help you prepare your final spoken explanation:

```text
I built an Autonomous Competitor Intelligence & Dynamic Pricing Engine for Project A of a technical assessment.

Please help me explain it professionally in 3 minutes.

The stack is:
- FastAPI backend with Python 3.11
- Pydantic v2 schemas
- LangGraph named-agent pipeline
- Jina Reader for Markdown extraction
- Gemini for structured JSON parsing and embeddings
- Supabase PostgreSQL with pgvector
- Next.js App Router frontend with TypeScript, Tailwind, Lucide Icons, and Recharts
- Backend deployed on Render
- Frontend deployed on Vercel

The workflow is:
1. User tracks an internal product.
2. User adds a competitor target URL.
3. IngestionAgent fetches Markdown through Jina.
4. ClassifierAgent parses title, price, availability, and specs with Gemini.
5. AnalystAgent generates embeddings and calls Supabase match_products RPC.
6. DecisionMakerAgent applies 5% competitor undercut while enforcing a configurable margin floor.
7. WebhookAgent dispatches a storefront update only if autopilot is enabled.

The frontend includes:
- Command Center
- Products page
- Competitors page
- Scans page
- Alerts page
- Readiness page
- Autopilot toggle
- Minimum margin slider
- Pricing trajectory chart
- Live execution logs

Please create a confident reviewer-facing explanation that emphasizes production readiness, assignment alignment, and engineering decisions.
```

## Five-Minute Loom Script

1. Open the Vercel frontend.
2. Explain that this is Project A: autonomous competitor intelligence and dynamic pricing.
3. Show the Command Center and autopilot/margin controls.
4. Go to Products and explain tracked products, base cost, and current price.
5. Go to Competitors and add or select a competitor URL target.
6. Run a scan.
7. Walk through the five agents: Ingestion, Classifier, Analyst, Decision Maker, Webhook.
8. Show match confidence, vector distance, price-to-spec ratio, and target price.
9. Open Alerts to show operational monitoring.
10. Open Scans to show persisted execution history.
11. Open Render Swagger docs and show the FastAPI surface.
12. Close by saying the project is deployed, environment-variable based, and ready for extension into real Shopify/Stripe/storefront integrations.

## Known Operational Notes

- Gemini and Jina are live third-party services. They may occasionally return rate limit or availability errors.
- The UI surfaces those failures through logs and alerts instead of silently hiding them.
- Render free-tier hosting can sleep and may need a short wake-up period.
- Supabase schema must be applied before using newly added persistent target/scan tables in a fresh environment.

## Security Notes

- No production secrets should be committed.
- `.env` and `.env.local` are ignored.
- Supabase backend writes require a server-side key.
- Any keys that were pasted during development should be rotated before final submission.

## Final Submission Assets

- GitHub repository with source code.
- Vercel frontend URL.
- Render backend Swagger docs URL.
- Supabase schema in `database/schema.sql`.
- README with setup, deployment, and Loom script.
- This `worded.md` as a detailed project explanation and GPT briefing document.
