import asyncio
from pathlib import Path
import sys
from uuid import UUID

sys.path.append(str(Path(__file__).resolve().parents[1]))

from config.settings import get_settings
from services.pricing_engine import generate_embedding
from services.supabase_store import require_server_write_key
from supabase import create_client


PRODUCTS = [
    {
        "id": "4a50ce59-2854-4d5a-9fa4-02645f861bcc",
        "title": "AeroBook Pro 14 Laptop",
        "base_cost": 780.00,
        "current_price": 949.00,
        "competitor_name": "MarketWatch Demo",
        "competitor_price": 999.99,
        "embedding_text": "AeroBook Pro 14 Laptop 16GB RAM 512GB SSD 14 inch display",
    },
    {
        "id": "6468b79d-7a35-4d95-aec9-749ab4071239",
        "title": "PulseFit X2 Smartwatch",
        "base_cost": 88.00,
        "current_price": 139.00,
        "competitor_name": "MarketWatch Demo",
        "competitor_price": 129.99,
        "embedding_text": "PulseFit X2 Smartwatch heart rate GPS sleep tracking waterproof wearable",
    },
    {
        "id": "289df4c5-76a7-4d03-8a70-9d8549f19f55",
        "title": "SonicPod ANC Earbuds",
        "base_cost": 42.00,
        "current_price": 79.00,
        "competitor_name": "MarketWatch Demo",
        "competitor_price": 74.99,
        "embedding_text": "SonicPod ANC Earbuds active noise cancellation wireless charging bluetooth",
    },
]


async def main() -> None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
    require_server_write_key()

    client = create_client(str(settings.supabase_url), settings.supabase_service_role_key)

    internal_rows = [
        {
            "id": item["id"],
            "title": item["title"],
            "base_cost": item["base_cost"],
            "current_price": item["current_price"],
        }
        for item in PRODUCTS
    ]
    client.table("tracked_products").upsert(internal_rows).execute()

    competitor_rows = []
    for item in PRODUCTS:
        embedding = await generate_embedding(str(item["embedding_text"]))
        competitor_rows.append(
            {
                "product_id": str(UUID(str(item["id"]))),
                "competitor_name": item["competitor_name"],
                "price": item["competitor_price"],
                "embedding": embedding,
            }
        )
    client.table("competitor_products").delete().in_("product_id", [item["id"] for item in PRODUCTS]).execute()
    client.table("competitor_products").insert(competitor_rows).execute()
    print(f"seed_supabase=ok products={len(internal_rows)} competitor_embeddings={len(competitor_rows)}")


if __name__ == "__main__":
    asyncio.run(main())
