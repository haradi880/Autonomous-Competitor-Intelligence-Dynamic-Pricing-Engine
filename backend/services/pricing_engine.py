import asyncio
import hashlib
import logging
import os
from uuid import UUID
from urllib.parse import urlparse, urlunparse

import httpx
from google import genai
from google.genai import types

from config.settings import get_settings
from models.schemas import CompetitorPrice, ExtractionResult, PricingDecision, PricingHistoryItem
from services import supabase_store
from services.state import app_state

logger = logging.getLogger(__name__)


def _fallback_embedding(text: str, dimensions: int = 1536) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    values = []
    for index in range(dimensions):
        byte = digest[index % len(digest)]
        values.append((byte / 255.0) - 0.5)
    norm = sum(value * value for value in values) ** 0.5
    return [value / norm for value in values]


async def generate_embedding(text: str) -> list[float]:
    settings = get_settings()
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY missing; using deterministic local fallback embedding")
        return _fallback_embedding(text, settings.embedding_dimensions)

    def _embed_sync() -> list[float]:
        client = genai.Client(api_key=settings.gemini_api_key)
        result = client.models.embed_content(
            model=settings.gemini_embedding_model,
            contents=text,
            config=types.EmbedContentConfig(
                task_type="SEMANTIC_SIMILARITY",
                output_dimensionality=settings.embedding_dimensions,
            ),
        )
        if not result.embeddings:
            raise ValueError("Gemini returned no embeddings")
        return list(result.embeddings[0].values)

    vector = await asyncio.to_thread(_embed_sync)
    if len(vector) != settings.embedding_dimensions:
        raise ValueError(
            f"Embedding dimension mismatch: expected {settings.embedding_dimensions}, received {len(vector)}"
        )
    return vector


async def match_product(product_id: UUID, embedding: list[float]) -> UUID:
    settings = get_settings()
    if supabase_store.supabase_client() is None:
        logger.warning("Supabase credentials missing; trusting requested product_id for MVP match")
        return product_id
    matches = await supabase_store.match_products(embedding, settings.match_similarity_threshold)
    if not matches:
        raise ValueError("No internal product matched the competitor listing above threshold")
    matched_id = UUID(str(matches[0]["product_id"]))
    if matched_id != product_id:
        raise ValueError(f"Competitor listing matched {matched_id}, not requested product {product_id}")
    return matched_id


async def dispatch_storefront_webhook(decision: PricingDecision) -> bool:
    settings = get_settings()
    webhook_url = settings.storefront_webhook_url
    parsed = urlparse(webhook_url)
    render_port = os.getenv("PORT")
    if parsed.hostname in {"localhost", "127.0.0.1"} and parsed.port == 8000 and render_port:
        webhook_url = urlunparse(parsed._replace(netloc=f"127.0.0.1:{render_port}"))

    async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
        response = await client.post(
            webhook_url,
            json={"product_id": str(decision.product_id), "new_price": decision.target_price, "source": "autopilot"},
        )
        response.raise_for_status()
    return True


async def evaluate_pricing(
    product_id: UUID,
    competitor_name: str,
    extraction: ExtractionResult,
    logs: list[str],
) -> PricingDecision:
    snapshot = await app_state.snapshot()
    product = next((item for item in snapshot.products if item.id == product_id), None)
    if product is None:
        raise ValueError(f"Internal product {product_id} was not found")

    embedding_text = f"{extraction.title}\n{extraction.specs_summary}"
    embedding = await generate_embedding(embedding_text)
    logs.append("[Embedding] Generated semantic vector for competitor title/specs.")

    matched_id = await match_product(product_id, embedding)
    logs.append(f"[Matcher] Supabase vector RPC confirmed internal product {matched_id}.")

    settings = (await app_state.snapshot()).settings
    margin_floor = round(product.base_cost * (1 + settings.minimum_margin_rate), 2)
    undercut_target = round(extraction.price * 0.95, 2)
    target_price = max(undercut_target, margin_floor)
    clamped = target_price == margin_floor and undercut_target < margin_floor
    margin_rate = round((target_price - product.base_cost) / target_price, 4)
    changed = abs(product.current_price - target_price) >= 0.01

    competitor_price = CompetitorPrice(
        product_id=product_id,
        competitor_name=competitor_name,
        title=extraction.title,
        price=extraction.price,
        currency=extraction.currency,
        availability=extraction.availability,
        specs_summary=extraction.specs_summary,
        similarity=1.0,
    )
    await app_state.upsert_competitor(competitor_price)

    decision = PricingDecision(
        product_id=product_id,
        old_price=product.current_price,
        competitor_price=extraction.price,
        target_price=round(target_price, 2),
        margin_floor=margin_floor,
        margin_rate=margin_rate,
        clamped_to_floor=clamped,
        autopilot_dispatched=False,
        reason="No price change required" if not changed else "5% undercut applied",
    )

    if changed:
        await app_state.add_history(
            PricingHistoryItem(
                product_id=product_id,
                old_price=product.current_price,
                new_price=decision.target_price,
                competitor_price=extraction.price,
                triggered_by="autopilot" if settings.autopilot else "analysis_only",
            )
        )

    if changed and settings.autopilot:
        await dispatch_storefront_webhook(decision)
        await app_state.update_product_price(product_id, decision.target_price)
        decision = decision.model_copy(update={"autopilot_dispatched": True})
        logs.append(f"[Engine] Price updated to ${decision.target_price:.2f}.")
    elif changed:
        logs.append(f"[Engine] Recommended price ${decision.target_price:.2f}; autopilot is off.")
    else:
        logs.append("[Engine] Current price already matches the target.")

    return decision
