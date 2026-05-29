import asyncio
import base64
import json
import logging
from uuid import UUID

from supabase import Client, create_client

from config.settings import get_settings
from models.schemas import (
    AlertItem,
    CompetitorPrice,
    DashboardProduct,
    ExtractionResult,
    PricingHistoryItem,
    Product,
    ProductIn,
)

logger = logging.getLogger(__name__)


def supabase_client() -> Client | None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    return create_client(str(settings.supabase_url), settings.supabase_service_role_key)


def has_server_write_key() -> bool:
    key = get_settings().supabase_service_role_key or ""
    if key.startswith("sb_secret_"):
        return True
    if key.count(".") != 2:
        return False
    try:
        payload = key.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload.encode("utf-8")))
        return decoded.get("role") == "service_role"
    except Exception:
        return False


def require_server_write_key() -> None:
    if not has_server_write_key():
        raise PermissionError(
            "Supabase backend writes require SUPABASE_SERVICE_ROLE_KEY to be a server secret/service_role key."
        )


async def list_products() -> list[Product]:
    client = supabase_client()
    if client is None:
        return []

    def _run() -> list[dict]:
        return client.table("tracked_products").select("*").order("title").execute().data or []

    rows = await asyncio.to_thread(_run)
    return [
        Product(
            id=UUID(str(row["id"])),
            title=str(row["title"]),
            base_cost=float(row["base_cost"]),
            current_price=float(row["current_price"]),
        )
        for row in rows
    ]


async def get_product(product_id: UUID) -> Product | None:
    client = supabase_client()
    if client is None:
        return None

    def _run() -> list[dict]:
        return (
            client.table("tracked_products")
            .select("*")
            .eq("id", str(product_id))
            .limit(1)
            .execute()
            .data
            or []
        )

    rows = await asyncio.to_thread(_run)
    if not rows:
        return None
    row = rows[0]
    return Product(
        id=UUID(str(row["id"])),
        title=str(row["title"]),
        base_cost=float(row["base_cost"]),
        current_price=float(row["current_price"]),
    )


async def create_product(payload: ProductIn) -> Product:
    require_server_write_key()
    client = supabase_client()
    if client is None:
        raise RuntimeError("Supabase is not configured")

    def _run() -> dict:
        return (
            client.table("tracked_products")
            .insert(payload.model_dump())
            .execute()
            .data[0]
        )

    row = await asyncio.to_thread(_run)
    return Product(
        id=UUID(str(row["id"])),
        title=str(row["title"]),
        base_cost=float(row["base_cost"]),
        current_price=float(row["current_price"]),
    )


async def latest_competitors() -> dict[UUID, CompetitorPrice]:
    client = supabase_client()
    if client is None:
        return {}

    def _run() -> list[dict]:
        return (
            client.table("competitor_products")
            .select("id, product_id, competitor_name, title, price, currency, availability, specs_summary, created_at")
            .order("created_at", desc=True)
            .execute()
            .data
            or []
        )

    rows = await asyncio.to_thread(_run)
    latest: dict[UUID, CompetitorPrice] = {}
    for row in rows:
        product_id = UUID(str(row["product_id"]))
        if product_id in latest:
            continue
        latest[product_id] = CompetitorPrice(
            id=UUID(str(row["id"])),
            product_id=product_id,
            competitor_name=str(row["competitor_name"]),
            title=str(row.get("title") or "Unknown competitor product"),
            price=float(row["price"]),
            currency=str(row.get("currency") or "USD"),
            availability=str(row.get("availability") or "Unknown"),
            specs_summary=str(row.get("specs_summary") or "No specs captured"),
            similarity=1.0,
        )
    return latest


async def persist_competitor_observation(
    product_id: UUID,
    competitor_name: str,
    extraction: ExtractionResult,
    embedding: list[float],
) -> None:
    require_server_write_key()
    client = supabase_client()
    if client is None:
        raise RuntimeError("Supabase is not configured")

    row = {
        "product_id": str(product_id),
        "competitor_name": competitor_name,
        "title": extraction.title,
        "price": extraction.price,
        "currency": extraction.currency,
        "availability": extraction.availability,
        "specs_summary": extraction.specs_summary,
        "color": extraction.color,
        "stock": extraction.stock,
        "specifications": extraction.specifications,
        "embedding": embedding,
    }
    await asyncio.to_thread(lambda: client.table("competitor_products").insert(row).execute())


async def match_products(embedding: list[float], threshold: float) -> list[dict]:
    client = supabase_client()
    if client is None:
        return []

    def _run() -> list[dict]:
        return (
            client.rpc(
                "match_products",
                {"sample_embedding": embedding, "similarity_threshold": threshold},
            )
            .execute()
            .data
            or []
        )

    return await asyncio.to_thread(_run)


async def update_product_price(product_id: UUID, new_price: float) -> None:
    require_server_write_key()
    client = supabase_client()
    if client is None:
        raise RuntimeError("Supabase is not configured")
    await asyncio.to_thread(
        lambda: client.table("tracked_products").update({"current_price": round(new_price, 2)}).eq("id", str(product_id)).execute()
    )


async def persist_pricing_history(item: PricingHistoryItem) -> None:
    require_server_write_key()
    client = supabase_client()
    if client is None:
        raise RuntimeError("Supabase is not configured")
    row = {
        "id": str(item.id),
        "product_id": str(item.product_id),
        "old_price": item.old_price,
        "new_price": item.new_price,
        "competitor_price": item.competitor_price,
        "triggered_by": item.triggered_by,
        "created_at": item.created_at.isoformat(),
    }
    await asyncio.to_thread(lambda: client.table("pricing_history").insert(row).execute())


async def list_pricing_history(limit: int = 100) -> list[PricingHistoryItem]:
    client = supabase_client()
    if client is None:
        return []

    def _run() -> list[dict]:
        return (
            client.table("pricing_history")
            .select("*")
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
            .data
            or []
        )

    rows = await asyncio.to_thread(_run)
    return [
        PricingHistoryItem(
            id=UUID(str(row["id"])),
            product_id=UUID(str(row["product_id"])),
            old_price=float(row["old_price"]),
            new_price=float(row["new_price"]),
            competitor_price=float(row.get("competitor_price") or 0),
            triggered_by=str(row["triggered_by"]),
        )
        for row in rows
    ]


async def create_alert(alert: AlertItem) -> None:
    client = supabase_client()
    if client is None or not has_server_write_key():
        return
    row = {
        "id": str(alert.id),
        "product_id": str(alert.product_id) if alert.product_id else None,
        "severity": alert.severity,
        "category": alert.category,
        "message": alert.message,
        "created_at": alert.created_at.isoformat(),
    }
    await asyncio.to_thread(lambda: client.table("pricing_alerts").insert(row).execute())


async def list_alerts(limit: int = 50) -> list[AlertItem]:
    client = supabase_client()
    if client is None:
        return []

    def _run() -> list[dict]:
        return (
            client.table("pricing_alerts")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
            .data
            or []
        )

    rows = await asyncio.to_thread(_run)
    return [
        AlertItem(
            id=UUID(str(row["id"])),
            product_id=UUID(str(row["product_id"])) if row.get("product_id") else None,
            severity=row["severity"],
            category=str(row["category"]),
            message=str(row["message"]),
        )
        for row in rows
    ]


async def dashboard_products(settings_margin: float) -> list[DashboardProduct]:
    products = await list_products()
    competitors = await latest_competitors()
    result: list[DashboardProduct] = []
    for product in products:
        competitor = competitors.get(product.id)
        margin_rate = (product.current_price - product.base_cost) / product.current_price
        result.append(
            DashboardProduct(
                id=product.id,
                title=product.title,
                base_cost=product.base_cost,
                current_price=product.current_price,
                competitor_price=competitor.price if competitor else None,
                competitor_name=competitor.competitor_name if competitor else None,
                margin_rate=round(margin_rate, 4),
                floor_hit=margin_rate <= settings_margin + 0.005,
            )
        )
    return result
