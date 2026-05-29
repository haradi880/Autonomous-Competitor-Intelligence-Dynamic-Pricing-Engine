from datetime import datetime
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class StrictBaseModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ProductIn(StrictBaseModel):
    title: str = Field(min_length=3, max_length=240)
    base_cost: float = Field(gt=0)
    current_price: float = Field(gt=0)

    @field_validator("current_price")
    @classmethod
    def current_price_must_cover_cost(cls, value: float, info) -> float:
        base_cost = info.data.get("base_cost")
        if base_cost is not None and value < base_cost:
            raise ValueError("current_price must be greater than or equal to base_cost")
        return round(value, 2)


class Product(ProductIn):
    id: UUID = Field(default_factory=uuid4)


class CompetitorUrlInput(StrictBaseModel):
    product_id: UUID
    competitor_url: HttpUrl
    competitor_name: str = Field(default="Unknown Competitor", min_length=2, max_length=120)


class CompetitorTargetIn(StrictBaseModel):
    product_id: UUID
    competitor_name: str = Field(min_length=2, max_length=120)
    competitor_url: HttpUrl


class CompetitorTarget(CompetitorTargetIn):
    id: UUID = Field(default_factory=uuid4)
    status: Literal["active", "paused"] = "active"
    last_checked_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExtractionResult(StrictBaseModel):
    title: str = Field(min_length=2, max_length=240, description="Competitor product title")
    price: float = Field(gt=0, description="Numeric sale price, excluding currency symbols")
    currency: str = Field(min_length=1, max_length=8, description="ISO or displayed currency")
    availability: str = Field(min_length=2, max_length=80)
    specs_summary: str = Field(min_length=2, max_length=1200)
    color: str | None = Field(default=None, max_length=80)
    stock: str | None = Field(default=None, max_length=80)
    specifications: dict[str, str] = Field(default_factory=dict)


class CompetitorPrice(StrictBaseModel):
    id: UUID = Field(default_factory=uuid4)
    product_id: UUID
    competitor_name: str
    title: str
    price: float
    currency: str
    availability: str
    specs_summary: str
    similarity: float = Field(ge=0, le=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PricingHistoryItem(StrictBaseModel):
    id: UUID = Field(default_factory=uuid4)
    product_id: UUID
    old_price: float
    new_price: float
    competitor_price: float
    triggered_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PricingDecision(StrictBaseModel):
    product_id: UUID
    old_price: float
    competitor_price: float
    target_price: float
    margin_floor: float
    margin_rate: float
    clamped_to_floor: bool
    autopilot_dispatched: bool
    reason: str
    match_distance: float | None = None
    match_confidence: float | None = Field(default=None, ge=0, le=1)
    price_to_spec_ratio: float | None = None


class ScanResponse(StrictBaseModel):
    extraction: ExtractionResult
    decision: PricingDecision
    logs: list[str]


class AgentRunEvent(StrictBaseModel):
    id: UUID = Field(default_factory=uuid4)
    run_id: UUID
    stage: str = Field(min_length=2, max_length=80)
    status: Literal["pending", "running", "complete", "failed"] = "complete"
    message: str = Field(min_length=2, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AgentRun(StrictBaseModel):
    id: UUID = Field(default_factory=uuid4)
    target_id: UUID | None = None
    product_id: UUID
    competitor_name: str = Field(min_length=2, max_length=120)
    competitor_url: HttpUrl
    status: Literal["running", "complete", "failed"] = "running"
    error_message: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    events: list[AgentRunEvent] = Field(default_factory=list)


class AutopilotSettings(StrictBaseModel):
    autopilot: bool
    minimum_margin_rate: float = Field(ge=0.01, le=0.8)


class AlertItem(StrictBaseModel):
    id: UUID = Field(default_factory=uuid4)
    product_id: UUID | None = None
    severity: Literal["info", "warning", "critical"] = "info"
    category: str = Field(min_length=2, max_length=80)
    message: str = Field(min_length=2, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DashboardProduct(StrictBaseModel):
    id: UUID
    title: str
    base_cost: float
    current_price: float
    competitor_price: float | None = None
    competitor_name: str | None = None
    margin_rate: float
    floor_hit: bool


class DashboardState(StrictBaseModel):
    settings: AutopilotSettings
    products: list[DashboardProduct]
    history: list[PricingHistoryItem]
    logs: list[str]
    alerts: list[AlertItem] = Field(default_factory=list)


class WebhookPayload(StrictBaseModel):
    product_id: UUID
    new_price: float = Field(gt=0)
    source: Literal["autopilot", "manual", "test"] = "autopilot"
