#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
/////////////////////////////////////////////////////////////////////////
//                                                                     //
//   ███████╗███████╗████████╗████████╗██╗███╗   ██╗ ██████╗ ███████╗  //
//   ██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██║████╗  ██║██╔════╝ ██╔════╝  //
//   ███████╗█████╗     ██║      ██║   ██║██╔██╗ ██║██║  ███╗███████╗  //
//   ╚════██║██╔══╝     ██║      ██║   ██║██║╚██╗██║██║   ██║╚════██║  //
//   ███████║███████╗   ██║      ██║   ██║██║ ╚████║╚██████╔╝███████║  //
//   ╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝  //
//                                                                     //
//  SETTINGS MODULE - Configuration control center                     //
//                                                                     //
//  [CODEX:CONFIG]                                                     //
//  Environment modes: development, testing, production                //
//  Configuration sources: .env file, environment variables            //
//  Database supported: PostgreSQL                                     //
//                                                                     //
//  Encryption key rotation: 30 days                                   //
//  API rate limiting: Tiered by user role                             //
//  Secrets management: Vault integration (production)                 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
"""

import os
import yaml
import secrets
from pathlib import Path
from typing import List, Optional, Dict, Any, Union
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field, validator

# Base directory for the application
BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = BASE_DIR / "config"

class OllamaSettings(BaseSettings):
    """
    [CODEX:OLLAMA]
    Configuration settings for Ollama AI integration
    Default model is llama3.2 as per project requirements
    """
    enabled: bool = True
    model: str = "llama3.2"  # Default model as per project requirements
    api_host: str = "http://localhost:11434"
    api_key: Optional[str] = None
    stream: bool = True
    max_tokens: int = 1000
    temperature: float = 0.7
    prompt_template: str = "You are a helpful assistant."

    class Config:
        env_prefix = "OLLAMA_"
        env_file = ".env"
        case_sensitive = False


class DatabaseSettings(BaseSettings):
    """
    [CODEX:DATABASE]
    Database connection settings
    Handles connection string formation based on environment
    """
    engine: str = "postgresql+asyncpg"
    host: str = "localhost"
    port: int = 5432
    username: str = "postgres"
    password: str = "postgres"
    database: str = "chaos"
    
    # Connection pooling settings
    pool_size: int = 5
    max_overflow: int = 10
    pool_timeout: int = 30
    pool_recycle: int = 3600
    
    # Database URL construction
    @property
    def url(self) -> str:
        return f"{self.engine}://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"

    class Config:
        env_prefix = "DB_"
        env_file = ".env"


class Settings(BaseSettings):
    """
    [CODEX:SETTINGS]
    Core application settings
    Controls environment-specific configurations and integrations
    """
    # Basic application settings
    app_name: str = "C.H.A.O.S"
    environment: str = "development"
    debug: bool = True
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    api_prefix: str = "/api"
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    
    # CORS settings
    cors_origins: List[str] = ["*"]
    
    # Database settings
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 3600
    create_tables: bool = False
    
    # JWT settings
    jwt_secret: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    jwt_algorithm: str = "HS256"
    jwt_expiration: int = 60 * 24  # 1 day in minutes
    
    # Real-time settings
    websocket_ttl: int = 3600  # 1 hour
    
    # Storage settings
    upload_dir: Path = BASE_DIR / "uploads"
    max_upload_size: int = 10 * 1024 * 1024  # 10 MB
    
    # Ollama AI settings
    ollama: OllamaSettings = OllamaSettings()
    
    # Cross-platform path handling
    @validator("upload_dir", pre=True)
    def validate_upload_dir(cls, v):
        if isinstance(v, str):
            return Path(v)
        return v
    
    @property
    def database_url(self) -> str:
        """Get the database URL from environment or use default"""
        db_settings = DatabaseSettings()
        return os.environ.get("DATABASE_URL", db_settings.url)
    
    def load_yaml_config(self, config_type: str) -> Dict[str, Any]:
        """
        [CODEX:YAML_LOAD]
        Load configuration from YAML file
        Supports loading specific configuration sections
        
        Args:
            config_type: Type of configuration to load (e.g., 'ollama')
            
        Returns:
            Dictionary of configuration values
        """
        config_file = CONFIG_DIR / f"{config_type}_config.yaml"
        
        if not config_file.exists():
            return {}
            
        with open(config_file, "r") as f:
            return yaml.safe_load(f)
    
    def update_from_yaml(self) -> "Settings":
        """
        [CODEX:UPDATE_CONFIG]
        Update settings from YAML configuration files
        Priority: default < yaml < environment variables
        
        Returns:
            Updated Settings instance
        """
        # Update Ollama settings from YAML
        ollama_config = self.load_yaml_config("ollama")
        if ollama_config:
            for key, value in ollama_config.items():
                if hasattr(self.ollama, key):
                    setattr(self.ollama, key, value)
        
        return self
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    [CODEX:GET_SETTINGS]
    Get application settings with caching
    Uses LRU cache to avoid reloading on every access
    
    Returns:
        Settings: Application settings instance
    """
    settings = Settings()
    return settings.update_from_yaml()
