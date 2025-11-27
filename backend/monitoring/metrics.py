# backend/monitoring/metrics.py
import time
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from collections import defaultdict, deque
import psutil

logger = logging.getLogger("coreflowfit.metrics")

class MetricsCollector:
    """Coletor de métricas do sistema"""
    
    def __init__(self):
        self.request_metrics = deque(maxlen=1000)
        self.error_metrics = deque(maxlen=1000)
        self.ia_metrics = deque(maxlen=500)
        self.system_metrics = deque(maxlen=100)
        
        # Métricas em tempo real
        self.current_metrics = {
            "active_requests": 0,
            "active_ia_generations": 0,
            "database_connections": 0
        }
    
    def record_request(self, endpoint: str, method: str, status_code: int, 
                      processing_time: float, user_agent: str = None):
        """Registra métricas de requisição"""
        metric = {
            "timestamp": datetime.utcnow(),
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "processing_time": processing_time,
            "user_agent": user_agent
        }
        self.request_metrics.append(metric)
        
        if status_code >= 400:
            self.error_metrics.append(metric)
    
    def record_ia_generation(self, aluno_id: str, objetivo: str, tempo_geracao: float,
                           num_exercicios: int, sucesso: bool):
        """Registra métricas de geração de IA"""
        metric = {
            "timestamp": datetime.utcnow(),
            "aluno_id": aluno_id,
            "objetivo": objetivo,
            "tempo_geracao": tempo_geracao,
            "num_exercicios": num_exercicios,
            "sucesso": sucesso
        }
        self.ia_metrics.append(metric)
    
    def record_system_metrics(self):
        """Registra métricas do sistema"""
        metric = {
            "timestamp": datetime.utcnow(),
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent,
            "active_connections": self.current_metrics["active_requests"]
        }
        self.system_metrics.append(metric)
    
    def increment_counter(self, counter: str, amount: int = 1):
        """Incrementa contador de métricas"""
        if counter in self.current_metrics:
            self.current_metrics[counter] += amount
    
    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Retorna métricas para dashboard"""
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)
        
        # Filtra métricas da última hora
        recent_requests = [
            m for m in self.request_metrics 
            if m["timestamp"] > one_hour_ago
        ]
        
        recent_ia = [
            m for m in self.ia_metrics
            if m["timestamp"] > one_hour_ago
        ]
        
        recent_errors = [
            m for m in self.error_metrics
            if m["timestamp"] > one_hour_ago
        ]
        
        # Calcula métricas
        total_requests = len(recent_requests)
        total_ia_requests = len(recent_ia)
        error_count = len(recent_errors)
        
        if recent_requests:
            avg_response_time = sum(
                r["processing_time"] for r in recent_requests
            ) / len(recent_requests)
            
            # Agrupa por endpoint
            endpoints = defaultdict(list)
            for req in recent_requests:
                endpoints[req["endpoint"]].append(req["processing_time"])
            
            endpoint_stats = {}
            for endpoint, times in endpoints.items():
                endpoint_stats[endpoint] = {
                    "count": len(times),
                    "avg_time": sum(times) / len(times),
                    "max_time": max(times)
                }
        else:
            avg_response_time = 0
            endpoint_stats = {}
        
        # Métricas de IA
        ia_success_rate = 0
        if recent_ia:
            successful_ia = len([m for m in recent_ia if m["sucesso"]])
            ia_success_rate = (successful_ia / len(recent_ia)) * 100
        
        # Métricas do sistema
        system_health = "healthy"
        current_system = psutil.virtual_memory()
        if current_system.percent > 90:
            system_health = "critical"
        elif current_system.percent > 80:
            system_health = "warning"
        
        return {
            "requests": {
                "total_last_hour": total_requests,
                "error_rate": (error_count / total_requests * 100) if total_requests else 0,
                "avg_response_time": round(avg_response_time, 3),
                "endpoint_stats": endpoint_stats
            },
            "ia": {
                "generations_last_hour": total_ia_requests,
                "success_rate": round(ia_success_rate, 1),
                "active_generations": self.current_metrics["active_ia_generations"]
            },
            "system": {
                "health": system_health,
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": current_system.percent,
                "active_connections": self.current_metrics["active_requests"]
            },
            "cache": self._get_cache_metrics()
        }
    
    def _get_cache_metrics(self) -> Dict[str, Any]:
        """Obtém métricas do cache"""
        try:
            from backend.cache.redis_manager import get_redis_cache
            cache = get_redis_cache()
            return cache.get_stats()
        except Exception as e:
            return {"status": "unavailable", "error": str(e)}
    
    def get_health_check(self) -> Dict[str, Any]:
        """Health check detalhado"""
        checks = {
            "api": {"status": "healthy", "details": "Operacional"},
            "database": {"status": "healthy", "details": "Operacional"},
            "cache": {"status": "healthy", "details": "Operacional"},
            "ia_engine": {"status": "healthy", "details": "Operacional"}
        }
        
        # Verifica banco de dados
        try:
            from backend.database import execute_query
            execute_query("SELECT 1", fetchone=True)
        except Exception as e:
            checks["database"]["status"] = "unhealthy"
            checks["database"]["details"] = str(e)
        
        # Verifica cache
        cache_stats = self._get_cache_metrics()
        if cache_stats.get("status") != "connected":
            checks["cache"]["status"] = "unhealthy"
            checks["cache"]["details"] = "Cache não disponível"
        
        # Verifica IA
        try:
            from backend.ia.gerador_treino_ia import gerar_treino_ia
        except Exception as e:
            checks["ia_engine"]["status"] = "unhealthy"
            checks["ia_engine"]["details"] = str(e)
        
        # Status geral
        overall_status = "healthy"
        if any(check["status"] != "healthy" for check in checks.values()):
            overall_status = "degraded"
        if any(check["status"] == "unhealthy" for check in checks.values()):
            overall_status = "unhealthy"
        
        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "checks": checks,
            "metrics": self.get_dashboard_metrics()
        }

# Instância global
metrics_collector = MetricsCollector()

# Middleware para coletar métricas automáticas
async def metrics_middleware(request, call_next):
    """Middleware para coletar métricas de requisições"""
    start_time = time.time()
    metrics_collector.increment_counter("active_requests", 1)
    
    try:
        response = await call_next(request)
        
        # Registra a requisição
        processing_time = time.time() - start_time
        user_agent = request.headers.get("user-agent", "unknown")
        
        metrics_collector.record_request(
            endpoint=request.url.path,
            method=request.method,
            status_code=response.status_code,
            processing_time=processing_time,
            user_agent=user_agent
        )
        
        # Adiciona header de tempo de processamento
        response.headers["X-Processing-Time"] = f"{processing_time:.3f}"
        
        return response
        
    except Exception as e:
        # Registra erro
        processing_time = time.time() - start_time
        metrics_collector.record_request(
            endpoint=request.url.path,
            method=request.method,
            status_code=500,
            processing_time=processing_time,
            user_agent=request.headers.get("user-agent", "unknown")
        )
        raise e
        
    finally:
        metrics_collector.increment_counter("active_requests", -1)