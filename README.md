# Autonomous Competitor Intelligence & Dynamic Pricing Engine

Project A submission for the AI Full-Stack Developer take-home assessment.

## Live Demo

- Frontend: https://autonomous-competitor-intelligence.vercel.app/
- API Docs: https://autonomous-competitor-intelligence.onrender.com/docs
- Backend Health: https://autonomous-competitor-intelligence.onrender.com/api/v1/health

## Overview

This is an autonomous pricing command center for retail operators. It ingests competitor product URLs, extracts clean markdown with Jina Reader, classifies product facts with Gemini structured output, verifies product matches through Supabase pgvector, calculates profit-safe target prices, and optionally dispatches updates to a mock storefront webhook.

The dashboard is built for the assessment demo flow: competitor URL ingest -> LangGraph agent timeline -> vector verification -> pricing decision -> storefront action.

## Tech Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- Backend: Python, FastAPI, Uvicorn, Pydantic v2
- Agent Orchestration: LangGraph
- AI APIs: Gemini structured output and Gemini embeddings
- Scraping: Jina AI Reader
- Vector Database: Supabase PostgreSQL with pgvector
- Deployment: Render backend, Vercel frontend

## Core Features

- Competitor URL ingest workflow
- LangGraph agent timeline:
  - Ingestion
  - Classifier
  - Analyst
  - Decision Maker
  - Webhook
- Semantic product matching with vector distance
- Price-to-spec ratio calculation
- Pricing rule: 5% competitor undercut, never below margin floor
- Autopilot toggle for storefront updates
- Minimum margin threshold control
- Real-time execution log stream
- Operational alerts
- Pricing history chart
- User-added tracked products
- Swagger/OpenAPI documentation

## Assignment Alignment

- Supabase setup: `tracked_products`, `competitor_products`, `pricing_history`, `pricing_alerts`, vector index, and `match_products` RPC are defined in `database/schema.sql`.
- Agent state graph: `backend/services/pricing_graph.py` implements named LangGraph agents for ingestion, classification, analysis, decision making, and webhook dispatch.
- FastAPI integration: endpoints expose scan triggering, dashboard state, alerts, settings, logs, and the mock storefront webhook.
- Dashboard UI: the deployed app shows active products, competitor prices, price charts, execution logs, alerts, autopilot control, and competitor URL ingest.
- Deployment: backend is hosted on Render and frontend is hosted on Vercel.

## Repository Structure

```text
backend/
  config/
  models/
  routers/
  scripts/
  services/
  Dockerfile
  requirements.txt
database/
  schema.sql
frontend/
  app/
  components/
  lib/
  vercel.json
README.md
```

## Environment Variables

Backend environment variables:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSIONS=1536
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STOREFRONT_WEBHOOK_URL=https://autonomous-competitor-intelligence.onrender.com/api/v1/mock-storefront-webhook
CORS_ORIGIN_REGEX=https://.*\.vercel\.app
```

Frontend environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://autonomous-competitor-intelligence.onrender.com/api/v1
```

Never commit `.env` files. Rotate any keys that were exposed during development.

## Local Setup

Backend:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd backend
..\.venv\Scripts\uvicorn.exe main:app --reload --host 127.0.0.1 --port 8001
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Local URLs:

- Frontend: http://127.0.0.1:3000
- Backend docs: http://127.0.0.1:8001/docs

## Supabase Setup

1. Create a Supabase project.
2. Run `database/schema.sql` in the Supabase SQL Editor.
3. Add backend environment variables.
4. Seed demo products:

```powershell
cd backend
..\.venv\Scripts\python.exe scripts\seed_supabase.py
```

The seed script creates demo products and competitor embeddings for the dashboard.

## Deployment Notes

Render backend:

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Vercel frontend:

- Root Directory: `frontend`
- Framework: Next.js
- Build Command: `npm run build`
- Environment: `NEXT_PUBLIC_API_BASE_URL=https://autonomous-competitor-intelligence.onrender.com/api/v1`

## Verification

Backend:

```powershell
.\.venv\Scripts\python.exe -m compileall backend
```

Frontend:

```powershell
cd frontend
npm run typecheck
npm run lint
npm run build
npm audit
```

Live smoke checks:

- https://autonomous-competitor-intelligence.onrender.com/api/v1/health
- https://autonomous-competitor-intelligence.onrender.com/api/v1/dashboard
- https://autonomous-competitor-intelligence.onrender.com/api/v1/alerts
- https://autonomous-competitor-intelligence.onrender.com/docs

## Demo Flow

1. Open the frontend.
2. Show the Project A submission readiness panel.
3. Show seeded products in the catalog.
4. Click `Load Demo Scan`.
5. Run the competitor URL ingest.
6. Walk through the agent timeline.
7. Explain vector match confidence, distance, price-to-spec ratio, margin floor, and target price.
8. Show the execution stream and alerts.
9. Open the API docs.

## Loom Script

1. "I selected Project A: Autonomous Competitor Intelligence & Dynamic Pricing Engine."
2. "The frontend is hosted on Vercel and the FastAPI backend is hosted on Render."
3. "Supabase stores tracked products, competitor observations, pricing history, alerts, and pgvector embeddings."
4. "This ingest panel triggers a LangGraph workflow with five named agents."
5. "The analyst agent verifies semantic similarity through the `match_products` RPC."
6. "The decision agent applies the 5% undercut rule while respecting the margin floor."
7. "When autopilot is enabled, the webhook agent dispatches to the mock storefront endpoint."
8. "Swagger documents the backend endpoints at the hosted `/docs` URL."

## Final Submission Checklist

- GitHub repo contains no `.env` files.
- Supabase keys and Gemini keys are rotated before final review.
- Frontend Vercel URL is live.
- Backend Render docs URL is live.
- Supabase schema is included in `database/schema.sql`.
- Loom video is under 5 minutes.
