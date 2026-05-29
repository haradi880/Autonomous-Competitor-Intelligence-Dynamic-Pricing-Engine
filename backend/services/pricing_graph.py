import logging
from typing import Any, TypedDict
from uuid import UUID

from langgraph.graph import END, StateGraph

from config.settings import get_settings
from models.schemas import (
    AlertItem,
    CompetitorUrlInput,
    ExtractionResult,
    PricingDecision,
    PricingHistoryItem,
    Product,
    ScanResponse,
)
from services import supabase_store
from services.agent_engine import fetch_markdown_from_jina, parse_markdown_with_gemini
from services.pricing_engine import dispatch_storefront_webhook, generate_embedding
from services.state import app_state

logger = logging.getLogger(__name__)


class PricingGraphState(TypedDict, total=False):
    payload: CompetitorUrlInput
    logs: list[str]
    markdown: str
    extraction: ExtractionResult
    embedding: list[float]
    matched_product_id: UUID
    matched_product: Product
    match_distance: float
    match_confidence: float
    price_to_spec_ratio: float
    decision: PricingDecision


def _log(state: PricingGraphState, message: str) -> None:
    state.setdefault("logs", []).append(message)


async def ingestion_agent(state: PricingGraphState) -> PricingGraphState:
    payload = state["payload"]
    _log(state, "[IngestionAgent] Fetching Markdown via Jina Reader...")
    state["markdown"] = await fetch_markdown_from_jina(str(payload.competitor_url))
    _log(state, "[IngestionAgent] Markdown fetched via Jina.")
    return state


async def classifier_agent(state: PricingGraphState) -> PricingGraphState:
    _log(state, "[ClassifierAgent] Parsing competitor page into structured JSON...")
    state["extraction"] = await parse_markdown_with_gemini(state["markdown"])
    _log(state, "[ClassifierAgent] Parsed title, price, availability, and specs.")
    return state


async def analyst_agent(state: PricingGraphState) -> PricingGraphState:
    payload = state["payload"]
    extraction = state["extraction"]
    settings = get_settings()
    embedding_text = f"{extraction.title}\n{extraction.specs_summary}\n{extraction.specifications}"
    state["embedding"] = await generate_embedding(embedding_text)
    _log(state, "[AnalystAgent] Generated Gemini semantic embedding.")

    matches = await supabase_store.match_products(state["embedding"], settings.match_similarity_threshold)
    if matches:
        best = matches[0]
        matched_id = UUID(str(best["product_id"]))
        if matched_id != payload.product_id:
            alert = AlertItem(
                product_id=payload.product_id,
                severity="critical",
                category="mismatch",
                message=f"Competitor listing matched {matched_id}, not requested product {payload.product_id}.",
            )
            await app_state.add_alert(alert)
            await supabase_store.create_alert(alert)
            raise ValueError(alert.message)
        product = await supabase_store.get_product(matched_id)
        if product is None:
            raise ValueError(f"Matched product {matched_id} was not found in tracked_products")
        distance = float(best.get("distance") or 0)
        state["matched_product_id"] = matched_id
        state["matched_product"] = product
        state["match_distance"] = distance
        state["match_confidence"] = round(max(0.0, 1.0 - distance), 4)
        _log(state, f"[AnalystAgent] Vector RPC matched {matched_id} with distance {distance:.4f}.")
    else:
        fallback_snapshot = await app_state.snapshot()
        fallback = next((item for item in fallback_snapshot.products if item.id == payload.product_id), None)
        if fallback is None:
            alert = AlertItem(
                product_id=payload.product_id,
                severity="critical",
                category="match_failed",
                message="No Supabase vector match found for competitor listing.",
            )
            await app_state.add_alert(alert)
            await supabase_store.create_alert(alert)
            raise ValueError(alert.message)
        state["matched_product_id"] = payload.product_id
        state["matched_product"] = Product(
            id=fallback.id,
            title=fallback.title,
            base_cost=fallback.base_cost,
            current_price=fallback.current_price,
        )
        state["match_distance"] = 0.0
        state["match_confidence"] = 1.0
        _log(state, "[AnalystAgent] Supabase empty/unavailable; used local catalog fallback.")

    spec_count = max(1, len(extraction.specifications) or len(extraction.specs_summary.split(",")) or 1)
    state["price_to_spec_ratio"] = round(extraction.price / spec_count, 4)
    await supabase_store.persist_competitor_observation(
        payload.product_id,
        payload.competitor_name,
        extraction,
        state["embedding"],
    )
    _log(state, f"[AnalystAgent] Stored competitor observation at {extraction.currency} {extraction.price:.2f}.")
    return state


async def decision_maker_agent(state: PricingGraphState) -> PricingGraphState:
    payload = state["payload"]
    product = state["matched_product"]
    extraction = state["extraction"]
    settings = (await app_state.snapshot()).settings
    margin_floor = round(product.base_cost * (1 + settings.minimum_margin_rate), 2)
    undercut_target = round(extraction.price * 0.95, 2)
    target_price = max(undercut_target, margin_floor)
    clamped = target_price == margin_floor and undercut_target < margin_floor
    margin_rate = round((target_price - product.base_cost) / target_price, 4)
    changed = abs(product.current_price - target_price) >= 0.01
    decision = PricingDecision(
        product_id=payload.product_id,
        old_price=product.current_price,
        competitor_price=extraction.price,
        target_price=round(target_price, 2),
        margin_floor=margin_floor,
        margin_rate=margin_rate,
        clamped_to_floor=clamped,
        autopilot_dispatched=False,
        reason="No price change required" if not changed else "5% undercut applied",
        match_distance=state.get("match_distance"),
        match_confidence=state.get("match_confidence"),
        price_to_spec_ratio=state.get("price_to_spec_ratio"),
    )
    state["decision"] = decision

    if clamped:
        alert = AlertItem(
            product_id=payload.product_id,
            severity="warning",
            category="margin_floor",
            message=f"Price clamped to margin floor ${margin_floor:.2f}.",
        )
        await app_state.add_alert(alert)
        await supabase_store.create_alert(alert)
    _log(state, f"[DecisionMakerAgent] Target price calculated at ${decision.target_price:.2f}.")
    return state


async def webhook_agent(state: PricingGraphState) -> PricingGraphState:
    decision = state["decision"]
    settings = (await app_state.snapshot()).settings
    changed = abs(decision.old_price - decision.target_price) >= 0.01
    history_item = PricingHistoryItem(
        product_id=decision.product_id,
        old_price=decision.old_price,
        new_price=decision.target_price,
        competitor_price=decision.competitor_price,
        triggered_by="autopilot" if settings.autopilot else "analysis_only",
    )

    if changed:
        await app_state.add_history(history_item)
        await supabase_store.persist_pricing_history(history_item)

    if changed and settings.autopilot:
        try:
            await dispatch_storefront_webhook(decision)
            await app_state.update_product_price(decision.product_id, decision.target_price)
            await supabase_store.update_product_price(decision.product_id, decision.target_price)
            state["decision"] = decision.model_copy(update={"autopilot_dispatched": True})
            _log(state, f"[WebhookAgent] Storefront update dispatched at ${decision.target_price:.2f}.")
        except Exception as exc:
            alert = AlertItem(
                product_id=decision.product_id,
                severity="critical",
                category="webhook_failed",
                message=str(exc),
            )
            await app_state.add_alert(alert)
            await supabase_store.create_alert(alert)
            raise
    elif changed:
        alert = AlertItem(
            product_id=decision.product_id,
            severity="info",
            category="recommendation",
            message=f"Recommended price ${decision.target_price:.2f}; autopilot is off.",
        )
        await app_state.add_alert(alert)
        await supabase_store.create_alert(alert)
        _log(state, "[WebhookAgent] Autopilot disabled; recommendation persisted.")
    else:
        _log(state, "[WebhookAgent] No storefront update required.")
    return state


def build_pricing_graph():
    graph = StateGraph(PricingGraphState)
    graph.add_node("IngestionAgent", ingestion_agent)
    graph.add_node("ClassifierAgent", classifier_agent)
    graph.add_node("AnalystAgent", analyst_agent)
    graph.add_node("DecisionMakerAgent", decision_maker_agent)
    graph.add_node("WebhookAgent", webhook_agent)
    graph.set_entry_point("IngestionAgent")
    graph.add_edge("IngestionAgent", "ClassifierAgent")
    graph.add_edge("ClassifierAgent", "AnalystAgent")
    graph.add_edge("AnalystAgent", "DecisionMakerAgent")
    graph.add_edge("DecisionMakerAgent", "WebhookAgent")
    graph.add_edge("WebhookAgent", END)
    return graph.compile()


pricing_graph = build_pricing_graph()


async def run_pricing_graph(payload: CompetitorUrlInput) -> ScanResponse:
    initial: PricingGraphState = {"payload": payload, "logs": []}
    final_state: dict[str, Any] = await pricing_graph.ainvoke(initial)
    return ScanResponse(
        extraction=final_state["extraction"],
        decision=final_state["decision"],
        logs=final_state["logs"],
    )
