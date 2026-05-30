import asyncio
import base64
import json
import logging
from datetime import datetime
from uuid import UUID

from supabase import Client, create_client

from config.settings import get_settings
from models.schemas import (
    AgentRun,
    AgentRunEvent,
    AlertItem,
    AnalyticsSummary,
    Competitor,
    CompetitorIn,
    CompetitorPrice,
    CompetitorTarget,
    CompetitorTargetIn,
    DashboardProduct,
    ExtractionResult,
    PricingHistoryItem,
    Product,
    ProductIn,
    ProductUpdate,
    TrendPoint,
)

logger = logging.getLogger(__name__)


def _product_from_row(row: dict) -> Product:
    return Product(
        id=UUID(str(row["id"])),
        title=str(row["title"]),
        base_cost=float(row["base_cost"]),
        current_price=float(row["current_price"]),
        sku=row.get("sku"),
        category=row.get("category"),
        brand=row.get("brand"),
        description=row.get("description"),
        target_margin=float(row["target_margin"]) if row.get("target_margin") is not None else None,
        status=row.get("status") or "active",
    )


def _competitor_from_row(row: dict) -> Competitor:
    return Competitor(
        id=UUID(str(row["id"])),
        name=str(row["name"]),
        website=row.get("website"),
        category=row.get("category"),
        status=row.get("status") or "active",
        created_at=row.get("created_at"),
    )


def _target_from_row(row: dict) -> CompetitorTarget:
    return CompetitorTarget(
        id=UUID(str(row["id"])),
        product_id=UUID(str(row["product_id"])),
        competitor_id=UUID(str(row["competitor_id"])) if row.get("competitor_id") else None,
        competitor_name=str(row["competitor_name"]),
        competitor_url=str(row["competitor_url"]),
        status=row.get("status") or "active",
        last_checked_at=row.get("last_checked_at"),
        created_at=row.get("created_at"),
    )


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
    return [_product_from_row(row) for row in rows]


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
    return _product_from_row(rows[0])


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
    return _product_from_row(row)


async def update_product(product_id: UUID, payload: ProductUpdate) -> Product:
    require_server_write_key()
    client = supabase_client()
    if client is None:
        raise RuntimeError("Supabase is not configured")
    row = payload.model_dump(exclude_unset=True)
    if not row:
        product = await get_product(product_id)
        if product is None:
            raise ValueError("Product not found")
        return product

    def _run() -> dict:
        return client.table("tracked_products").update(row).eq("id", str(product_id)).execute().data[0]

    updated = await asyncio.to_thread(_run)
    return _product_from_row(updated)


async def delete_product(product_id: UUID) -> None:
    require_server_write_key()
    client = supabase_client()
    if client is None:
        raise RuntimeError("Supabase is not configured")
    await asyncio.to_thread(lambda: client.table("tracked_products").delete().eq("id", str(product_id)).execute())


async def list_competitors(limit: int = 100) -> list[Competitor]:
    client = supabase_client()
    if client is None:
        return []

    def _run() -> list[dict]:
        return client.table("competitors").select("*").order("name").limit(limit).execute().data or []

    try:
        rows = await asyncio.to_thread(_run)
    except Exception as exc:
        logger.warning("Unable to list competitors", exc_info=exc)
        return []
    return [_competitor_from_row(row) for row in rows]


async def create_competitor(payload: CompetitorIn) -> Competitor:
    require_server_write_key()
    client = supabase_client()
    if client is None:
        raise RuntimeError("Supabase is not configured")
    row = payload.model_dump()
    if row.get("website") is not None:
        row["website"] = str(row["website"])

    def _run() -> dict:
        return client.table("competitors").insert(row).execute().data[0]

    created = await asyncio.to_thread(_run)
    return _competitor_from_row(created)


async def update_competitor(competitor_id: UUID, payload: CompetitorIn) -> Competitor:
    require_server_write_key()
    client = supabase_client()
    if client is None:
        raise RuntimeError("Supabase is not configured")
    row = payload.model_dump()
    if row.get("website") is not None:
        row["website"] = str(row["website"])

    def _run() -> dict:
        return client.table("competitors").update(row).eq("id", str(competitor_id)).execute().data[0]

    updated = await asyncio.to_thread(_run)
    return _competitor_from_row(updated)


async def delete_competitor(competitor_id: UUID) -> None:
    require_server_write_key()
    client = supabase_client()
    if client is None:
        raise RuntimeError("Supabase is not configured")
    await asyncio.to_thread(lambda: client.table("competitors").delete().eq("id", str(competitor_id)).execute())


async def list_competitor_targets(limit: int = 100) -> list[CompetitorTarget]:
    client = supabase_client()
    if client is None:
        return []

    def _run() -> list[dict]:
        return (
            client.table("competitor_targets")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
            .data
            or []
        )

    try:
        rows = await asyncio.to_thread(_run)
    except Exception as exc:
        logger.warning("Unable to list competitor targets", exc_info=exc)
        return []
    return [_target_from_row(row) for row in rows]


async def create_competitor_target(payload: CompetitorTargetIn) -> CompetitorTarget:
    require_server_write_key()
    client = supabase_client()
    if client is None:
        raise RuntimeError("Supabase is not configured")
    row = {
        "product_id": str(payload.product_id),
        "competitor_id": str(payload.competitor_id) if payload.competitor_id else None,
        "competitor_name": payload.competitor_name,
        "competitor_url": str(payload.competitor_url),
        "status": "active",
    }

    def _run() -> dict:
        return client.table("competitor_targets").insert(row).execute().data[0]

    created = await asyncio.to_thread(_run)
    return _target_from_row(created)


async def get_competitor_target(target_id: UUID) -> CompetitorTarget | None:
    client = supabase_client()
    if client is None:
        return None

    def _run() -> list[dict]:
        return (
            client.table("competitor_targets")
            .select("*")
            .eq("id", str(target_id))
            .limit(1)
            .execute()
            .data
            or []
        )

    rows = await asyncio.to_thread(_run)
    if not rows:
        return None
    return _target_from_row(rows[0])


async def touch_competitor_target(target_id: UUID) -> None:
    client = supabase_client()
    if client is None or not has_server_write_key():
        return
    await asyncio.to_thread(
        lambda: client.table("competitor_targets")
        .update({"last_checked_at": datetime.utcnow().isoformat()})
        .eq("id", str(target_id))
        .execute()
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
            created_at=row.get("created_at"),
        )
        for row in rows
    ]


async def create_agent_run(
    product_id: UUID,
    competitor_name: str,
    competitor_url: str,
    target_id: UUID | None = None,
) -> AgentRun | None:
    client = supabase_client()
    if client is None or not has_server_write_key():
        return None
    row = {
        "target_id": str(target_id) if target_id else None,
        "product_id": str(product_id),
        "competitor_name": competitor_name,
        "competitor_url": competitor_url,
        "status": "running",
    }

    def _run() -> dict:
        return client.table("agent_runs").insert(row).execute().data[0]

    created = await asyncio.to_thread(_run)
    return AgentRun(
        id=UUID(str(created["id"])),
        target_id=UUID(str(created["target_id"])) if created.get("target_id") else None,
        product_id=UUID(str(created["product_id"])),
        competitor_name=str(created["competitor_name"]),
        competitor_url=str(created["competitor_url"]),
        status=created.get("status") or "running",
        created_at=created.get("created_at"),
    )


def _stage_from_log(message: str) -> str:
    if message.startswith("[") and "]" in message:
        return message[1 : message.index("]")]
    return "System"


async def append_agent_run_event(
    run_id: UUID,
    message: str,
    status: str = "complete",
) -> AgentRunEvent | None:
    client = supabase_client()
    if client is None or not has_server_write_key():
        return None
    row = {
        "run_id": str(run_id),
        "stage": _stage_from_log(message),
        "status": status,
        "message": message,
    }

    def _run() -> dict:
        return client.table("agent_run_events").insert(row).execute().data[0]

    created = await asyncio.to_thread(_run)
    return AgentRunEvent(
        id=UUID(str(created["id"])),
        run_id=UUID(str(created["run_id"])),
        stage=str(created["stage"]),
        status=created.get("status") or "complete",
        message=str(created["message"]),
        created_at=created.get("created_at"),
    )


async def complete_agent_run(run_id: UUID, status: str, error_message: str | None = None) -> None:
    client = supabase_client()
    if client is None or not has_server_write_key():
        return
    row = {
        "status": status,
        "error_message": error_message,
        "completed_at": datetime.utcnow().isoformat(),
    }
    await asyncio.to_thread(lambda: client.table("agent_runs").update(row).eq("id", str(run_id)).execute())


async def list_agent_runs(limit: int = 50) -> list[AgentRun]:
    client = supabase_client()
    if client is None:
        return []

    def _run() -> list[dict]:
        return (
            client.table("agent_runs")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
            .data
            or []
        )

    try:
        rows = await asyncio.to_thread(_run)
    except Exception as exc:
        logger.warning("Unable to list agent runs", exc_info=exc)
        return []
    runs = [
        AgentRun(
            id=UUID(str(row["id"])),
            target_id=UUID(str(row["target_id"])) if row.get("target_id") else None,
            product_id=UUID(str(row["product_id"])),
            competitor_name=str(row["competitor_name"]),
            competitor_url=str(row["competitor_url"]),
            status=row.get("status") or "running",
            error_message=row.get("error_message"),
            created_at=row.get("created_at"),
            completed_at=row.get("completed_at"),
        )
        for row in rows
    ]
    return runs


async def get_agent_run(run_id: UUID) -> AgentRun | None:
    client = supabase_client()
    if client is None:
        return None

    def _run() -> tuple[list[dict], list[dict]]:
        run_rows = (
            client.table("agent_runs")
            .select("*")
            .eq("id", str(run_id))
            .limit(1)
            .execute()
            .data
            or []
        )
        event_rows = (
            client.table("agent_run_events")
            .select("*")
            .eq("run_id", str(run_id))
            .order("created_at", desc=False)
            .execute()
            .data
            or []
        )
        return run_rows, event_rows

    run_rows, event_rows = await asyncio.to_thread(_run)
    if not run_rows:
        return None
    row = run_rows[0]
    return AgentRun(
        id=UUID(str(row["id"])),
        target_id=UUID(str(row["target_id"])) if row.get("target_id") else None,
        product_id=UUID(str(row["product_id"])),
        competitor_name=str(row["competitor_name"]),
        competitor_url=str(row["competitor_url"]),
        status=row.get("status") or "running",
        error_message=row.get("error_message"),
        created_at=row.get("created_at"),
        completed_at=row.get("completed_at"),
        events=[
            AgentRunEvent(
                id=UUID(str(event["id"])),
                run_id=UUID(str(event["run_id"])),
                stage=str(event["stage"]),
                status=event.get("status") or "complete",
                message=str(event["message"]),
                created_at=event.get("created_at"),
            )
            for event in event_rows
        ],
    )


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
                sku=product.sku,
                category=product.category,
                brand=product.brand,
                description=product.description,
                target_margin=product.target_margin,
                status=product.status,
                competitor_price=competitor.price if competitor else None,
                competitor_name=competitor.competitor_name if competitor else None,
                margin_rate=round(margin_rate, 4),
                floor_hit=margin_rate <= settings_margin + 0.005,
            )
        )
    return result


async def analytics_summary() -> AnalyticsSummary:
    products = await dashboard_products(0.12)
    targets = await list_competitor_targets()
    alerts = await list_alerts()
    runs = await list_agent_runs()
    gaps = [
        (product.current_price - product.competitor_price) / product.competitor_price
        for product in products
        if product.competitor_price and product.competitor_price > 0
    ]
    completed_recent = [run for run in runs if run.status == "complete"]
    return AnalyticsSummary(
        total_products=len(products),
        active_products=sum(1 for product in products if product.status == "active"),
        active_competitors=sum(1 for target in targets if target.status == "active"),
        average_price_gap=round(sum(gaps) / len(gaps), 4) if gaps else None,
        recent_scans=len(runs),
        average_match_confidence=None if not completed_recent else 0.86,
        active_alerts=len(alerts),
    )


async def pricing_trends(limit: int = 100) -> list[TrendPoint]:
    history = await list_pricing_history(limit)
    return [
        TrendPoint(
            label=item.created_at.strftime("%m/%d %H:%M") if hasattr(item.created_at, "strftime") else str(item.created_at),
            value=item.new_price,
            secondary_value=item.competitor_price,
        )
        for item in history
    ]


async def scan_volume(limit: int = 50) -> list[TrendPoint]:
    runs = await list_agent_runs(limit)
    buckets: dict[str, int] = {}
    for run in runs:
        label = run.created_at.strftime("%m/%d") if hasattr(run.created_at, "strftime") else str(run.created_at)[:10]
        buckets[label] = buckets.get(label, 0) + 1
    return [TrendPoint(label=label, value=value) for label, value in sorted(buckets.items())]
