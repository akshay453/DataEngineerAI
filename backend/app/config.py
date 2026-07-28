"""
Centralized settings, loaded from environment variables (.env file locally).

Keeping this separate from day one means when you split services across
two laptops, you only ever change the .env file — never the code.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # URL of the AI server (Laptop 1, running Ollama).
    # Example: http://192.168.1.20:11434
    AI_SERVER_URL: str = "http://localhost:11434"

    # Which model to ask Ollama for. Must match what you `ollama pull`ed.
    OLLAMA_MODEL: str = "qwen2.5"

    # PostgreSQL connection string.
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/dataengineer_ai"

    class Config:
        env_file = ".env"


settings = Settings()
