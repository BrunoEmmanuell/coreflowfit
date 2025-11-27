# backend/cache/redis_manager.py
import redis
import json
import pickle
import logging
from typing import Any, Optional, Dict, List, Union
from functools import wraps
from datetime import timedelta
import hashlib

logger = logging.getLogger("coreflowfit.cache")

class RedisCacheManager:
    """Gerenciador avançado de cache com Redis"""
    
    def __init__(self, host: str = 'localhost', port: int = 6379, db: int = 0, 
                 password: str = None, prefix: str = "coreflowfit"):
        try:
            self.redis_client = redis.Redis(
                host=host,
                port=port,
                db=db,
                password=password,
                decode_responses=False,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            self.prefix = prefix
            self._verify_connection()
        except Exception as e:
            logger.error(f"Falha ao conectar com Redis: {e}")
            self.redis_client = None
    
    def _verify_connection(self):
        """Verifica e loga status da conexão"""
        if self.redis_client and self.redis_client.ping():
            logger.info("✅ Cache Redis conectado com sucesso")
        else:
            logger.warning("❌ Cache Redis não disponível")
    
    def _build_key(self, key: str) -> str:
        """Constrói chave com prefixo"""
        return f"{self.prefix}:{key}"
    
    def set(self, key: str, value: Any, expire: int = 3600) -> bool:
        """Armazena valor no cache com expiração"""
        if not self.redis_client:
            return False
            
        try:
            serialized_value = pickle.dumps(value)
            full_key = self._build_key(key)
            return self.redis_client.setex(full_key, expire, serialized_value)
        except Exception as e:
            logger.error(f"Erro ao salvar no cache: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """Recupera valor do cache"""
        if not self.redis_client:
            return None
            
        try:
            full_key = self._build_key(key)
            serialized_value = self.redis_client.get(full_key)
            if serialized_value is None:
                return None
            return pickle.loads(serialized_value)
        except Exception as e:
            logger.error(f"Erro ao recuperar do cache: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Remove chave do cache"""
        if not self.redis_client:
            return False
            
        try:
            full_key = self._build_key(key)
            return bool(self.redis_client.delete(full_key))
        except Exception as e:
            logger.error(f"Erro ao deletar do cache: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Verifica se chave existe"""
        if not self.redis_client:
            return False
            
        try:
            full_key = self._build_key(key)
            return bool(self.redis_client.exists(full_key))
        except Exception as e:
            logger.error(f"Erro ao verificar existência: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Remove chaves por padrão"""
        if not self.redis_client:
            return 0
            
        try:
            full_pattern = self._build_key(pattern)
            keys = self.redis_client.keys(full_pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Erro ao limpar cache: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do cache"""
        if not self.redis_client:
            return {"status": "disabled"}
            
        try:
            info = self.redis_client.info()
            return {
                "status": "connected",
                "used_memory": info.get('used_memory_human', 'N/A'),
                "connected_clients": info.get('connected_clients', 0),
                "keyspace_hits": info.get('keyspace_hits', 0),
                "keyspace_misses": info.get('keyspace_misses', 0),
                "hit_rate": round(
                    info.get('keyspace_hits', 0) / 
                    max(1, info.get('keyspace_hits', 0) + info.get('keyspace_misses', 0)), 
                    2
                )
            }
        except Exception as e:
            logger.error(f"Erro ao obter stats: {e}")
            return {"status": "error", "error": str(e)}

# Instância global
redis_cache = None

def get_redis_cache() -> RedisCacheManager:
    """Retorna instância do cache Redis"""
    global redis_cache
    if redis_cache is None:
        from backend.config import settings
        redis_host = getattr(settings, 'REDIS_HOST', 'localhost')
        redis_port = getattr(settings, 'REDIS_PORT', 6379)
        redis_db = getattr(settings, 'REDIS_DB', 0)
        redis_password = getattr(settings, 'REDIS_PASSWORD', None)
        
        redis_cache = RedisCacheManager(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            password=redis_password
        )
    return redis_cache

def cached(key_pattern: str, expire: int = 3600):
    """Decorator para cache de funções"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache = get_redis_cache()
            
            # Gera chave única baseada na função e argumentos
            key_parts = [key_pattern, func.__module__, func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            
            key = hashlib.md5(":".join(key_parts).encode()).hexdigest()
            
            # Tenta recuperar do cache
            cached_result = cache.get(key)
            if cached_result is not None:
                logger.debug(f"Cache HIT: {key_pattern}")
                return cached_result
            
            # Executa função e armazena resultado
            result = func(*args, **kwargs)
            cache.set(key, result, expire=expire)
            logger.debug(f"Cache MISS: {key_pattern} - Armazenado por {expire}s")
            
            return result
        return wrapper
    return decorator

def invalidate_cache(pattern: str = "*"):
    """Invalida cache por padrão"""
    cache = get_redis_cache()
    deleted = cache.clear_pattern(pattern)
    logger.info(f"Cache invalidado: {deleted} chaves removidas")
    return deleted