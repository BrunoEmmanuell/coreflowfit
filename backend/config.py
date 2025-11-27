# backend/config.py - VERSÃO CORRIGIDA
import os
from typing import Dict, Any, List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    """Configurações da aplicação usando Pydantic v2"""
    
    # API
    api_v1_str: str = "/api/v1"
    project_name: str = "CoreFlowFit"
    version: str = "4.0.0"
    
    # Segurança
    jwt_secret_key: str = "change-me-in-production-2024"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24  # 24 horas
    
    # Banco de Dados
    database_url: str = "postgresql://user:pass@localhost:5432/coreflowfit"
    
    # CORS
    backend_cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # IA
    ia_models_dir: str = "backend/models"
    ia_training_data_dir: str = "backend/data"
    ia_max_training_examples: int = 10000
    
    # Treino
    max_exercises_per_group: int = 6
    min_exercises_per_group: int = 1
    default_series: int = 3
    default_reps: str = "8-12"
    
    # Segurança Avançada
    rate_limit_per_minute: int = 100
    max_request_size: int = 16 * 1024 * 1024  # 16MB
    enable_sql_injection_protection: bool = True
    enable_xss_protection: bool = True
    
    # Ambiente
    environment: str = "development"
    debug: bool = False
    log_level: str = "INFO"

    class Config:
        case_sensitive = False
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # 🔥 IGNORA variáveis de ambiente extras

    @property
    def is_development(self):
        return self.environment == "development"
    
    @property
    def is_production(self):
        return self.environment == "production"
    
    @property
    def is_staging(self):
        return self.environment == "staging"

# Instância global
settings = Settings()

# Configurações específicas por ambiente
ENV_CONFIGS: Dict[str, Dict[str, Any]] = {
    "development": {
        "debug": True,
        "log_level": "DEBUG",
        "jwt_access_token_expire_minutes": 60 * 24 * 7,
    },
    "staging": {
        "debug": False,
        "log_level": "INFO",
        "enable_sql_injection_protection": True,
        "enable_xss_protection": True,
    },
    "production": {
        "debug": False,
        "log_level": "WARNING",
        "enable_sql_injection_protection": True,
        "enable_xss_protection": True,
        "rate_limit_per_minute": 50,
    }
}

def get_environment_config() -> Dict[str, Any]:
    """Retorna configurações específicas do ambiente atual"""
    return ENV_CONFIGS.get(settings.environment, {})