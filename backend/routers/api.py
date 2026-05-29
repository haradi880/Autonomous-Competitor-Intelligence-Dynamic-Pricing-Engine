import asyncio
import json
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from fastapi.responses import StreamingResponse

from models.schemas import (
    AgentRun,
    AlertItem,
    AutopilotSettings,
    CompetitorTarget,
    CompetitorTargetIn,
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


@router.get("/competitor-targets", response_model=list[CompetitorTarget])
async def competitor_targets() -> list[CompetitorTarget]:
    return await supabase_store.list_competitor_targets()


@router.post("/competitor-targets", response_model=CompetitorTarget, status_code=201)
async def create_competitor_target(payload: CompetitorTargetIn) -> CompetitorTarget:
    try:
        target = await supabase_store.create_competitor_target(payload)
        await app_state.append_log(f"[Targets] Added {target.competitor_name} target for product {target.product_id}.")
        return target
    except Exception as exc:
        logger.exception("Competitor target create failed")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/scans", response_model=list[AgentRun])
async def scans() -> list[AgentRun]:
    return await supabase_store.list_agent_runs()


@router.get("/scans/{run_id}", response_model=AgentRun)
async def scan_detail(run_id: UUID) -> AgentRun:
    run = await supabase_store.get_agent_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Scan run not found")
    return run


async def _execute_scan(payload: CompetitorUrlInput, target_id: UUID | None = None) -> ScanResponse:
    run = await supabase_store.create_agent_run(
        product_id=payload.product_id,
        competitor_name=payload.competitor_name,
        competitor_url=str(payload.competitor_url),
        target_id=target_id,
    )
    try:
        await app_state.append_log(f"[Graph] Started scan for {payload.competitor_url}.")
        response = await run_pricing_graph(payload)
        for entry in response.logs:
            await app_state.append_log(entry)
            if run is not None:
                await supabase_store.append_agent_run_event(run.id, entry)
        if run is not None:
            await supabase_store.complete_agent_run(run.id, "complete")
        if target_id is not None:
            await supabase_store.touch_competitor_target(target_id)
        return response
    except ValidationError as exc:
        logger.exception("Competitor scan produced invalid structured product data")
        await app_state.append_log(f"[Error] Product extraction failed validation: {exc}")
        if run is not None:
            await supabase_store.append_agent_run_event(run.id, f"[Error] Product extraction failed validation: {exc}", "failed")
            await supabase_store.complete_agent_run(run.id, "failed", "The URL was reachable, but it did not contain a valid product price/spec page.")
        raise HTTPException(
            status_code=422,
            detail="The URL was reachable, but it did not contain a valid product price/spec page.",
        ) from exc
    except Exception as exc:
        logger.exception("Competitor scan failed")
        await app_state.append_log(f"[Error] {exc}")
        if run is not None:
            await supabase_store.append_agent_run_event(run.id, f"[Error] {exc}", "failed")
            await supabase_store.complete_agent_run(run.id, "failed", str(exc))
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/scan", response_model=ScanResponse)
async def scan_competitor(payload: CompetitorUrlInput) -> ScanResponse:
    return await _execute_scan(payload)


@router.post("/competitor-targets/{target_id}/scan", response_model=ScanResponse)
async def scan_competitor_target(target_id: UUID) -> ScanResponse:
    target = await supabase_store.get_competitor_target(target_id)
    if target is None:
        raise HTTPException(status_code=404, detail="Competitor target not found")
    return await _execute_scan(
        CompetitorUrlInput(
            product_id=target.product_id,
            competitor_name=target.competitor_name,
            competitor_url=target.competitor_url,
        ),
        target_id=target.id,
    )


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
