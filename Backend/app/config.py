from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "UK Wind Forecast Analytics API"
    api_v1_prefix: str = "/api"

    elexon_base_url: str = (
        "https://data.elexon.co.uk/bmrs/api/v1"
    )
    elexon_timeout_seconds: float = 30.0

    frontend_origins: list[str] = [
        "http://localhost:5173"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()