"""
╔══════════════════════════════════════════════════════════════════════╗
║ C.H.A.O.S SERVER SETTINGS                                            ║
║ ------------------------------------------                           ║
║ This module provides configuration settings for the CHAOS server     ║
║ using environment variables with sane defaults.                      ║
║                                                                      ║
║ The configuration is structured as a Pydantic BaseSettings class     ║
║ that loads values from environment variables and .env files.         ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import os
import secrets
from typing import List, Optional, Union
from functools import lru_cache

from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Server configuration settings loaded from environment variables.
    Uses Pydantic for validation and type conversion.
    """

    # ╔═══════════════════════════════════════════════════╗
    # ║ CORE SERVER SETTINGS                              ║
    # ╚═══════════════════════════════════════════════════╝
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    PROJECT_NAME: str = "C.H.A.O.S"
    
    # Security Settings
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    ALGORITHM: str = "HS256"
    
    # CORS Settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    
    # ╔═══════════════════════════════════════════════════╗
    # ║ DATABASE SETTINGS                                 ║
    # ╚═══════════════════════════════════════════════════╝
    
    DATABASE_URL: Optional[str] = None
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "chaos_user"
    DB_PASSWORD: str = "your_password"
    DB_NAME: str = "chaos_db"
    
    # Database Pool Settings
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    SQL_ECHO: bool = False
    
    # ╔═══════════════════════════════════════════════════╗
    # ║ VOICE SETTINGS                                    ║
    # ╚═══════════════════════════════════════════════════╝
    
    VOICE_SAMPLE_RATE: int = 44100
    VOICE_CHANNELS: int = 1
    VOICE_CHUNK_SIZE: int = 1024
    VOICE_FORMAT: str = "wav"
    VOICE_MAX_DURATION: int = 300  # seconds
    VOICE_STORAGE_PATH: str = "storage/voice"
    
    # ╔═══════════════════════════════════════════════════╗
    # ║ AI INTEGRATION SETTINGS                           ║
    # ╚═══════════════════════════════════════════════════╝
    
    AI_ENABLED: bool = True
    AI_MODEL: str = "llama3.2"
    AI_HOST: str = "localhost"
    AI_PORT: int = 11434
    AI_TEMPERATURE: float = 0.7
    AI_MAX_TOKENS: int = 2048
    AI_PRE_PROMPT: str = "You are an AI assistant for the CHAOS voice messaging platform."
    
    # ╔═══════════════════════════════════════════════════╗
    # ║ LOGGING SETTINGS                                  ║
    # ╚═══════════════════════════════════════════════════╝
    
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: Optional[str] = "logs/chaos.log"
    LOG_ROTATION: str = "1 day"
    LOG_RETENTION: str = "30 days"
    
    # ╔═══════════════════════════════════════════════════╗
    # ║ VALIDATORS AND COMPUTED FIELDS                    ║
    # ╚═══════════════════════════════════════════════════╝
    
    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v: Optional[str], values) -> str:
        """
        Builds the database connection string from individual components
        if not explicitly provided.
        """
        if isinstance(v, str) and v:
            return v
        
        # Extract database connection parameters
        user = values.data.get("DB_USER")
        password = values.data.get("DB_PASSWORD")
        host = values.data.get("DB_HOST")
        port = values.data.get("DB_PORT")
        name = values.data.get("DB_NAME")
        
        # Build connection string
        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{name}"
    
    # Load settings from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached instance of the settings.
    
    This ensures that settings are loaded only once during the application
    lifecycle, improving performance.
    
    Returns:
        Settings: Application configuration settings
    """
    return Settings()
