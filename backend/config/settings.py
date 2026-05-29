from functools import lru_cache
from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Autonomous Competitor Intelligence API"
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    embedding_dimensions: int = 1536

    supabase_url: AnyHttpUrl | None = None
    supabase_service_role_key: str | None = None
    supabase_db_url: str | None = None
    match_similarity_threshold: float = 0.22

    storefront_webhook_url: str = "http://localhost:8000/api/v1/mock-storefront-webhook"
    request_timeout_seconds: float = 30.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
