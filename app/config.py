from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GENERATED_DOCS_DIR: Path = Path("generated_docs")
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
# Ensure generated_docs dir exists
settings.GENERATED_DOCS_DIR.mkdir(parents=True, exist_ok=True)
