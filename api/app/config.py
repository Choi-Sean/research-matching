from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"  # development | production

    # MSSQL: mssql+pytds://USER:PASSWORD@HOST:1433/DBNAME  (local dev falls back to SQLite)
    database_url: str = "sqlite:///./dev.db"
    cors_origins: list[str] = ["http://localhost:3000"]
    frontend_url: str = "http://localhost:3000"

    secret_key: str = "dev-only-change-me-dev-only-change-me"
    access_token_minutes: int = 60 * 24 * 7
    require_edu_email: bool = True
    # Comma-separated. These accounts can open /admin.
    admin_emails: str = ""
    # Dev convenience: professors are verified on sign-up. Turn OFF in production.
    auto_verify_professors: bool = True

    # --- Scholarly data (OpenAlex) -------------------------------------------------
    openalex_mailto: str = ""
    openalex_api_key: str = ""

    # --- AI (Anthropic) ------------------------------------------------------------
    # Without a key every AI feature falls back to the built-in heuristic engine.
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-5-5"
    anthropic_effort: str = "low"  # low | medium | high — tasks here are short and structured
    anthropic_timeout_seconds: float = 60.0

    # --- Billing (Stripe, one-time payments) ---------------------------------------
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # --- Limits --------------------------------------------------------------------
    rate_limit_enabled: bool = True
    talent_searches_per_day: int = 30

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, v):
        if isinstance(v, str) and not v.strip().startswith("["):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def admin_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.admin_emails.split(",") if e.strip()}


settings = Settings()
