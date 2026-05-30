import asyncio
import logging
import random

import httpx
from google import genai
from google.genai import errors as genai_errors

from config.settings import get_settings
from models.schemas import ExtractionResult

logger = logging.getLogger(__name__)


def _fixture_markdown_for_url(target_url: str) -> str | None:
    if "fakestoreapi.com/products/1" not in target_url:
        return None
    return """
# Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops

Price: $109.95 USD
Availability: In stock
Color: unspecified
Category: men's clothing
Specifications:
- Backpack
- Fits 15 inch laptops
- Durable fabric
- Casual daypack
Source: Local fallback fixture
""".strip()


async def fetch_markdown_from_jina(target_url: str) -> str:
    settings = get_settings()
    reader_url = f"https://r.jina.ai/{target_url}"
    logger.info("Fetching competitor markdown through Jina Reader", extra={"url": target_url})
    async with httpx.AsyncClient(timeout=settings.request_timeout_seconds, follow_redirects=True) as client:
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                response = await client.get(reader_url, headers={"Accept": "text/markdown"})
                response.raise_for_status()
                break
            except (httpx.HTTPStatusError, httpx.TimeoutException, httpx.TransportError) as exc:
                last_error = exc
                if isinstance(exc, httpx.HTTPStatusError):
                    fallback = _fixture_markdown_for_url(target_url) if settings.enable_demo_fallbacks else None
                    if exc.response.status_code in {429, 451, 502, 503, 504} and fallback is not None:
                        logger.warning("Jina unavailable/rate-limited; using local fixture fallback")
                        return fallback
                    if exc.response.status_code < 500 and exc.response.status_code != 429:
                        raise
                if attempt == 2:
                    raise
                await asyncio.sleep((1.4 * (attempt + 1)) + random.random())
        else:
            raise RuntimeError(f"Jina Reader failed: {last_error}")
    markdown = response.text.strip()
    if len(markdown) < 80:
        raise ValueError("Jina Reader returned insufficient page content for reliable extraction")
    logger.info("Jina Reader extraction complete", extra={"chars": len(markdown)})
    return markdown


def _fixture_fallback_extraction(markdown: str) -> ExtractionResult | None:
    normalized = markdown.lower()
    if "fakestoreapi" not in normalized and "fjallraven" not in normalized:
        return None
    return ExtractionResult(
        title="Fjallraven Foldsack No. 1 Backpack",
        price=109.95,
        currency="USD",
        availability="In stock",
        specs_summary="Backpack, fits 15 inch laptops, casual daypack, durable fabric",
        color="unspecified",
        stock="In stock",
        specifications={
            "category": "men's clothing",
            "capacity": "fits 15 inch laptops",
            "type": "backpack",
        },
    )


def _parse_with_gemini_sync(markdown: str) -> ExtractionResult:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is required for Gemini structured parsing")

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = (
        "Extract product pricing facts from this competitor product page. "
        "Return only fields required by the schema. Use a concise specs_summary.\n\n"
        f"{markdown[:60000]}"
    )
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_json_schema": ExtractionResult.model_json_schema(),
                },
            )
            break
        except genai_errors.ServerError as exc:
            last_error = exc
            fallback = _fixture_fallback_extraction(markdown) if settings.enable_demo_fallbacks else None
            if fallback is not None:
                logger.warning("Gemini unavailable; using local fixture extraction")
                return fallback
            if attempt == 2:
                raise
            import time

            time.sleep(1.5 * (attempt + 1))
    else:
        raise RuntimeError(f"Gemini structured parsing failed: {last_error}")
    if not response.text:
        raise ValueError("Gemini returned an empty structured response")
    return ExtractionResult.model_validate_json(response.text)


async def parse_markdown_with_gemini(markdown: str) -> ExtractionResult:
    logger.info("Parsing markdown with Gemini structured output")
    result = await asyncio.to_thread(_parse_with_gemini_sync, markdown)
    logger.info("Gemini parsing complete", extra={"title": result.title, "price": result.price})
    return result


async def extract_competitor_product(target_url: str) -> tuple[str, ExtractionResult]:
    markdown = await fetch_markdown_from_jina(target_url)
    extraction = await parse_markdown_with_gemini(markdown)
    return markdown, extraction
