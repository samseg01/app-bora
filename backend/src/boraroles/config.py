from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://boraroles:boraroles@localhost:5432/boraroles"

    jwt_secret: str = "change-me-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 43200

    env: str = "development"
    cors_origins: str = "http://localhost:3000"

    frescor_live_window_minutes: int = 30
    frescor_live_min_sinais: int = 3
    frescor_warm_window_minutes: int = 120

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
