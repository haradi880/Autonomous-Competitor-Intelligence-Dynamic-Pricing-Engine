import asyncio
import json
import logging

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from fastapi.responses import StreamingResponse

from models.schemas import (
    AlertItem,
    AutopilotSettings,
    CompetitorUrlInput,
    DashboardState,
    Product,
    ProductIn,
    ScanResponse,
    WebhookPayload,
)
from services import supabase_store
from services.pricing_graph import run_pricing_graph
from services.state import app_state

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=dict[str, str])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/dashboard", response_model=DashboardState)
async def dashboard() -> DashboardState:
    fallback = await app_state.snapshot()
    try:
        products = await supabase_store.dashboard_products(fallback.settings.minimum_margin_rate)
        history = await supabase_store.list_pricing_history()
        alerts = await supabase_store.list_alerts()
        if products:
            return DashboardState(
                settings=fallback.settings,
                products=products,
                history=history or fallback.history,
                logs=fallback.logs,
                alerts=alerts or fallback.alerts,
            )
    except Exception as exc:
        logger.warning("Falling back to in-memory dashboard state", exc_info=exc)
    return fallback


@router.get("/alerts", response_model=list[AlertItem])
async def alerts() -> list[AlertItem]:
    try:
        persisted = await supabase_store.list_alerts()
        if persisted:
            return persisted
    except Exception as exc:
        logger.warning("Falling back to in-memory alerts", exc_info=exc)
    return await app_state.list_alerts()


@router.post("/settings", response_model=AutopilotSettings)
async def update_settings(payload: AutopilotSettings) -> AutopilotSettings:
    return await app_state.set_settings(payload)


@router.post("/products", response_model=Product, status_code=201)
async def create_product(payload: ProductIn) -> Product:
    try:
        product = await supabase_store.create_product(payload)
        await app_state.append_log(f"[Catalog] Added tracked product {product.title}.")
        return product
    except Exception as exc:
        await app_state.append_log(f"[Catalog] Supabase create failed; using local fallback: {exc}")
        return await app_state.add_product(payload)


@router.post("/scan", response_model=ScanResponse)
async def scan_competitor(payload: CompetitorUrlInput) -> ScanResponse:
    try:
        await app_state.append_log(f"[Graph] Started scan for {payload.competitor_url}.")
        response = await run_pricing_graph(payload)
        for entry in response.logs:
            await app_state.append_log(entry)
        return response
    except ValidationError as exc:
        logger.exception("Competitor scan produced invalid structured product data")
        await app_state.append_log(f"[Error] Product extraction failed validation: {exc}")
        raise HTTPException(
            status_code=422,
            detail="The URL was reachable, but it did not contain a valid product price/spec page.",
        ) from exc
    except Exception as exc:
        logger.exception("Competitor scan failed")
        await app_state.append_log(f"[Error] {exc}")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/logs/stream")
async def stream_logs() -> StreamingResponse:
    async def event_stream():
        snapshot = await app_state.snapshot()
        for message in snapshot.logs[-40:]:
            yield f"data: {json.dumps({'message': message})}\n\n"
        while True:
            try:
                message = await asyncio.wait_for(app_state.log_queue.get(), timeout=20)
                yield f"data: {json.dumps({'message': message})}\n\n"
            except asyncio.TimeoutError:
                yield "event: ping\ndata: {}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/mock-storefront-webhook", response_model=dict[str, str])
async def mock_storefront_webhook(payload: WebhookPayload) -> dict[str, str]:
    await app_state.append_log(
        f"[Webhook] Storefront accepted {payload.product_id} at ${payload.new_price:.2f}."
    )
    return {"status": "accepted"}
