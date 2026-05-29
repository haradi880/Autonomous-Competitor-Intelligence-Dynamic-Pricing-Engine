# Autonomous Competitor Intelligence & Dynamic Pricing Engine

Assessment-ready MVP with FastAPI, LangGraph, Gemini, Supabase pgvector, and a Next.js dashboard.

## 1. Environment

Backend env lives in `backend/.env`:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSIONS=1536
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_or_service_role_key
STOREFRONT_WEBHOOK_URL=http://localhost:8000/api/v1/mock-storefront-webhook
```

Use a Supabase server secret/service-role key for backend writes. Publishable keys can read demo data but cannot seed, persist observations, or update prices.

Frontend env lives in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## 2. Supabase Setup

Run `database/schema.sql` in the Supabase SQL Editor. It creates:

- `tracked_products`
- `competitor_products`
- `pricing_history`
- `pricing_alerts`
- `match_products(sample_embedding, similarity_threshold)`
- compatibility views for `internal_products` and `competitor_prices`

Then seed demo products and embeddings:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd backend
..\.venv\Scripts\python.exe scripts\seed_supabase.py
```

## 3. Run Locally

Backend:

```powershell
cd backend
..\.venv\Scripts\uvicorn.exe main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## 4. Verification

```powershell
.\.venv\Scripts\python.exe -m compileall backend
cd frontend
npm run typecheck
npm run lint
npm run build
```

Smoke endpoints:

- `GET /api/v1/health`
- `GET /api/v1/dashboard`
- `GET /api/v1/alerts`
- `POST /api/v1/scan`

## 5. Deployment

Cloud Run backend:

```powershell
cd backend
gcloud run deploy competitor-pricing-api --source . --region us-central1 --allow-unauthenticated
```

Set backend environment variables in Cloud Run before production use.

Vercel frontend:

```powershell
cd frontend
vercel
```

Set `NEXT_PUBLIC_API_BASE_URL` to the Cloud Run API URL plus `/api/v1`.

## 6. Assignment Alignment

- Supabase: `tracked_products`, `competitor_products`, `pricing_history`, `pricing_alerts`, pgvector index, and `match_products` RPC are defined in `database/schema.sql`.
- LangGraph: the scan pipeline runs named agents for ingestion, classification, vector analysis, pricing decision, and webhook dispatch.
- FastAPI: `/api/v1/scan`, `/api/v1/dashboard`, `/api/v1/alerts`, `/api/v1/settings`, `/api/v1/logs/stream`, and Swagger `/docs` are available.
- Dashboard: the UI includes autopilot controls, competitor URL ingest, agent timeline, catalog intelligence, alerts, logs, and Recharts price history.
- Deployment: `backend/Dockerfile` targets Cloud Run and `frontend/vercel.json` targets Vercel.

## 7. Five-Minute Loom Script

1. Open the dashboard and state the selected project: Autonomous Competitor Intelligence & Dynamic Pricing Engine.
2. Show seeded Supabase rows in `tracked_products` and `competitor_products`.
3. Use `Load Demo Scan`, explain the competitor URL ingest workflow, then run a scan.
4. Walk through the agent timeline: Ingestion, Classifier, Analyst, Decision Maker, Webhook.
5. Show semantic match confidence, vector distance, price-to-spec ratio, margin floor, and target price.
6. Point to the log stream and alerts panel as evidence of live agent execution.
7. Open `/docs` to show the FastAPI endpoints and close with the Cloud Run/Vercel deployment path.

## 8. Deployment Checklist

- Rotate any keys that were pasted into local files or chat.
- Run `database/schema.sql` in Supabase SQL Editor.
- Set backend env vars in Cloud Run: Gemini key, Supabase URL, Supabase service-role/secret key, embedding model, webhook URL.
- Run `scripts/seed_supabase.py` once against the production Supabase project.
- Set Vercel `NEXT_PUBLIC_API_BASE_URL` to the deployed API URL plus `/api/v1`.
- Smoke test `/api/v1/health`, `/api/v1/dashboard`, `/api/v1/alerts`, `/docs`, and the Vercel dashboard URL.
- Record Loom after confirming a demo scan produces either a full decision or a clean third-party availability error.

## 9. Final Submission Package

- Public GitHub repository with no `.env` files or leaked secrets.
- Live frontend URL from Vercel.
- Live API docs URL from Cloud Run or Render at `/docs`.
- Supabase schema exported as `database/schema.sql`.
- Loom video under 5 minutes following the script above.
- Short note in the submission explaining Gemini/Jina are live third-party services and may return temporary availability errors, which the UI surfaces cleanly.
