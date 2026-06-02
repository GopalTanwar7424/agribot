from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str = ""
    gemini_api_key: str = ""
    app_name: str = "AgriBot"
    debug: bool = False
    upload_dir: str = "uploads"
    max_image_size_mb: int = 10
    max_history_turns: int = 20
    session_ttl_minutes: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()