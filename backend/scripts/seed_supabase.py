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
        "sku": "ABP-14-512",
        "category": "Computing",
        "brand": "AeroBook",
        "description": "14 inch performance laptop with 16GB RAM, 512GB SSD, and lightweight aluminum chassis.",
        "base_cost": 780.00,
        "current_price": 949.00,
        "target_margin": 0.18,
        "competitor_name": "MarketWatch Reference",
        "competitor_price": 999.99,
        "competitor_url": "https://fakestoreapi.com/products/14",
        "embedding_text": "AeroBook Pro 14 Laptop 16GB RAM 512GB SSD 14 inch display",
    },
    {
        "id": "6468b79d-7a35-4d95-aec9-749ab4071239",
        "title": "PulseFit X2 Smartwatch",
        "sku": "PFX2-GPS",
        "category": "Wearables",
        "brand": "PulseFit",
        "description": "GPS smartwatch with heart-rate monitoring, sleep tracking, and waterproof sport modes.",
        "base_cost": 88.00,
        "current_price": 139.00,
        "target_margin": 0.22,
        "competitor_name": "MarketWatch Reference",
        "competitor_price": 129.99,
        "competitor_url": "https://fakestoreapi.com/products/1",
        "embedding_text": "PulseFit X2 Smartwatch heart rate GPS sleep tracking waterproof wearable",
    },
    {
        "id": "289df4c5-76a7-4d03-8a70-9d8549f19f55",
        "title": "SonicPod ANC Earbuds",
        "sku": "SPD-ANC-QI",
        "category": "Audio",
        "brand": "SonicPod",
        "description": "True wireless earbuds with active noise cancellation, wireless charging, and low-latency Bluetooth.",
        "base_cost": 42.00,
        "current_price": 79.00,
        "target_margin": 0.20,
        "competitor_name": "MarketWatch Reference",
        "competitor_price": 74.99,
        "competitor_url": "https://fakestoreapi.com/products/2",
        "embedding_text": "SonicPod ANC Earbuds active noise cancellation wireless charging bluetooth",
    },
]

COMPETITORS = [
    {
        "id": "18ea07cf-4d92-4bd5-a40b-c56a5ecb6c52",
        "name": "MarketWatch Reference",
        "website": "https://fakestoreapi.com",
        "category": "Reference marketplace",
        "status": "active",
    },
    {
        "id": "e2f86e40-eccd-43df-988b-496257984084",
        "name": "Northstar Retail",
        "website": "https://example.com",
        "category": "Electronics retailer",
        "status": "active",
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
            "sku": item["sku"],
            "category": item["category"],
            "brand": item["brand"],
            "description": item["description"],
            "base_cost": item["base_cost"],
            "current_price": item["current_price"],
            "target_margin": item["target_margin"],
            "status": "active",
        }
        for item in PRODUCTS
    ]
    client.table("tracked_products").upsert(internal_rows).execute()
    client.table("competitors").upsert(COMPETITORS).execute()

    competitor_rows = []
    competitor_target_rows = []
    pricing_history_rows = []
    for item in PRODUCTS:
        embedding = await generate_embedding(str(item["embedding_text"]))
        competitor_rows.append(
            {
                "product_id": str(UUID(str(item["id"]))),
                "competitor_name": item["competitor_name"],
                "title": f"{item['title']} - reference listing",
                "price": item["competitor_price"],
                "currency": "USD",
                "availability": "In stock",
                "specs_summary": item["embedding_text"],
                "specifications": {
                    "brand": item["brand"],
                    "category": item["category"],
                    "sku": item["sku"],
                },
                "embedding": embedding,
            }
        )
        competitor_target_rows.append(
            {
                "product_id": str(UUID(str(item["id"]))),
                "competitor_id": COMPETITORS[0]["id"],
                "competitor_name": item["competitor_name"],
                "competitor_url": item["competitor_url"],
                "status": "active",
            }
        )
        pricing_history_rows.extend(
            [
                {
                    "product_id": str(UUID(str(item["id"]))),
                    "old_price": round(float(item["current_price"]) * 1.04, 2),
                    "new_price": round(float(item["current_price"]) * 1.02, 2),
                    "competitor_price": round(float(item["competitor_price"]) * 1.03, 2),
                    "triggered_by": "seed_reference",
                },
                {
                    "product_id": str(UUID(str(item["id"]))),
                    "old_price": round(float(item["current_price"]) * 1.02, 2),
                    "new_price": float(item["current_price"]),
                    "competitor_price": float(item["competitor_price"]),
                    "triggered_by": "seed_reference",
                },
            ]
        )
    client.table("competitor_products").delete().in_("product_id", [item["id"] for item in PRODUCTS]).execute()
    client.table("competitor_products").insert(competitor_rows).execute()
    client.table("competitor_targets").delete().in_("product_id", [item["id"] for item in PRODUCTS]).execute()
    client.table("competitor_targets").insert(competitor_target_rows).execute()
    client.table("pricing_history").delete().in_("product_id", [item["id"] for item in PRODUCTS]).execute()
    client.table("pricing_history").insert(pricing_history_rows).execute()
    print(
        "seed_supabase=ok "
        f"products={len(internal_rows)} competitors={len(COMPETITORS)} "
        f"targets={len(competitor_target_rows)} observations={len(competitor_rows)} "
        f"history={len(pricing_history_rows)}"
    )


if __name__ == "__main__":
    asyncio.run(main())
