import asyncio
from uuid import UUID, uuid4

from models.schemas import (
    AlertItem,
    AutopilotSettings,
    CompetitorPrice,
    DashboardProduct,
    DashboardState,
    PricingHistoryItem,
    Product,
    ProductIn,
)


class AppState:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self.settings = AutopilotSettings(autopilot=True, minimum_margin_rate=0.12)
        self.products: dict[UUID, Product] = {
            UUID("4a50ce59-2854-4d5a-9fa4-02645f861bcc"): Product(
                id=UUID("4a50ce59-2854-4d5a-9fa4-02645f861bcc"),
                title="AeroBook Pro 14 Laptop",
                base_cost=780.00,
                current_price=949.00,
            ),
            UUID("6468b79d-7a35-4d95-aec9-749ab4071239"): Product(
                id=UUID("6468b79d-7a35-4d95-aec9-749ab4071239"),
                title="PulseFit X2 Smartwatch",
                base_cost=88.00,
                current_price=139.00,
            ),
            UUID("289df4c5-76a7-4d03-8a70-9d8549f19f55"): Product(
                id=UUID("289df4c5-76a7-4d03-8a70-9d8549f19f55"),
                title="SonicPod ANC Earbuds",
                base_cost=42.00,
                current_price=79.00,
            ),
        }
        self.competitors: dict[UUID, CompetitorPrice] = {}
        self.history: list[PricingHistoryItem] = []
        self.alerts: list[AlertItem] = []
        self.logs: list[str] = ["[System] Pricing intelligence engine booted."]
        self.log_queue: asyncio.Queue[str] = asyncio.Queue(maxsize=500)

    async def append_log(self, message: str) -> None:
        async with self._lock:
            self.logs.append(message)
            self.logs = self.logs[-200:]
        try:
            self.log_queue.put_nowait(message)
        except asyncio.QueueFull:
            _ = self.log_queue.get_nowait()
            self.log_queue.put_nowait(message)

    async def add_product(self, payload: ProductIn) -> Product:
        product = Product(id=uuid4(), **payload.model_dump())
        async with self._lock:
            self.products[product.id] = product
        await self.append_log(f"[Catalog] Added internal product {product.title}.")
        return product

    async def set_settings(self, settings: AutopilotSettings) -> AutopilotSettings:
        async with self._lock:
            self.settings = settings
        await self.append_log(
            f"[Control] Autopilot={'enabled' if settings.autopilot else 'disabled'}, "
            f"margin floor={settings.minimum_margin_rate:.0%}."
        )
        return settings

    async def upsert_competitor(self, price: CompetitorPrice) -> None:
        async with self._lock:
            self.competitors[price.product_id] = price

    async def update_product_price(self, product_id: UUID, new_price: float) -> None:
        async with self._lock:
            product = self.products[product_id]
            self.products[product_id] = product.model_copy(update={"current_price": round(new_price, 2)})

    async def add_history(self, item: PricingHistoryItem) -> None:
        async with self._lock:
            self.history.append(item)
            self.history = self.history[-500:]

    async def add_alert(self, item: AlertItem) -> None:
        async with self._lock:
            self.alerts.append(item)
            self.alerts = self.alerts[-200:]
        await self.append_log(f"[Alert] {item.category}: {item.message}")

    async def list_alerts(self) -> list[AlertItem]:
        async with self._lock:
            return list(self.alerts)

    async def snapshot(self) -> DashboardState:
        async with self._lock:
            products = []
            for product in self.products.values():
                competitor = self.competitors.get(product.id)
                margin_rate = (product.current_price - product.base_cost) / product.current_price
                products.append(
                    DashboardProduct(
                        id=product.id,
                        title=product.title,
                        base_cost=product.base_cost,
                        current_price=product.current_price,
                        competitor_price=competitor.price if competitor else None,
                        competitor_name=competitor.competitor_name if competitor else None,
                        margin_rate=round(margin_rate, 4),
                        floor_hit=margin_rate <= self.settings.minimum_margin_rate + 0.005,
                    )
                )
            return DashboardState(
                settings=self.settings,
                products=products,
                history=list(self.history),
                logs=list(self.logs),
                alerts=list(self.alerts),
            )


app_state = AppState()
