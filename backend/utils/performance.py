# backend/utils/performance.py
import time
import asyncio
import logging
from functools import wraps
from typing import Any, Callable, Dict
from concurrent.futures import ThreadPoolExecutor
import psutil
import gc

logger = logging.getLogger("coreflowfit.performance")

class PerformanceMonitor:
    """Monitor de performance da aplicação"""
    
    def __init__(self):
        self.metrics = {
            "request_times": [],
            "memory_usage": [],
            "active_connections": 0
        }
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    def track_performance(self, operation: str):
        """Decorator para monitorar performance de funções"""
        def decorator(func):
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                start_memory = psutil.Process().memory_info().rss
                
                try:
                    result = func(*args, **kwargs)
                    return result
                finally:
                    duration = time.time() - start_time
                    end_memory = psutil.Process().memory_info().rss
                    memory_used = end_memory - start_memory
                    
                    self.metrics["request_times"].append(duration)
                    self.metrics["memory_usage"].append(memory_used)
                    
                    # Mantém apenas últimos 1000 registros
                    if len(self.metrics["request_times"]) > 1000:
                        self.metrics["request_times"] = self.metrics["request_times"][-1000:]
                        self.metrics["memory_usage"] = self.metrics["memory_usage"][-1000:]
                    
                    if duration > 1.0:  # Log operações lentas
                        logger.warning(
                            f"Operação lenta detectada: {operation} - {duration:.2f}s"
                        )
            
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                start_memory = psutil.Process().memory_info().rss
                
                try:
                    result = await func(*args, **kwargs)
                    return result
                finally:
                    duration = time.time() - start_time
                    end_memory = psutil.Process().memory_info().rss
                    memory_used = end_memory - start_memory
                    
                    self.metrics["request_times"].append(duration)
                    self.metrics["memory_usage"].append(memory_used)
                    
                    if duration > 1.0:
                        logger.warning(
                            f"Operação lenta detectada: {operation} - {duration:.2f}s"
                        )
            
            return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
        return decorator
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Retorna métricas de performance agregadas"""
        if not self.metrics["request_times"]:
            return {
                "average_response_time": 0,
                "p95_response_time": 0,
                "p99_response_time": 0,
                "max_response_time": 0,
                "requests_per_minute": 0,
                "memory_usage_mb": 0,
                "active_connections": self.metrics["active_connections"]
            }
        
        times = self.metrics["request_times"][-100:]  # Últimos 100 requests
        memory_usage = self.metrics["memory_usage"][-100:]
        
        sorted_times = sorted(times)
        p95_index = int(0.95 * len(sorted_times))
        p99_index = int(0.99 * len(sorted_times))
        
        return {
            "average_response_time": round(sum(times) / len(times), 3),
            "p95_response_time": round(sorted_times[p95_index], 3),
            "p99_response_time": round(sorted_times[p99_index], 3),
            "max_response_time": round(max(times), 3),
            "requests_per_minute": len(times),  # Aproximação
            "memory_usage_mb": round(sum(memory_usage) / len(memory_usage) / 1024 / 1024, 2),
            "active_connections": self.metrics["active_connections"]
        }
    
    def run_in_background(self, func: Callable, *args, **kwargs):
        """Executa função em background thread"""
        return self.executor.submit(func, *args, **kwargs)
    
    def cleanup(self):
        """Limpeza de recursos"""
        self.executor.shutdown(wait=False)
        gc.collect()

# Instância global
performance_monitor = PerformanceMonitor()

# Decorators de conveniência
def track_time(operation: str):
    return performance_monitor.track_performance(operation)

def background_task(func: Callable):
    """Decorator para executar tarefas em background"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        return performance_monitor.run_in_background(func, *args, **kwargs)
    return wrapper

# Otimizações específicas para a IA
def optimize_ia_operations():
    """Aplica otimizações para operações de IA"""
    import numpy as np
    try:
        # Configura numpy para melhor performance
        np.seterr(all='ignore')
        logger.info("Otimizações de IA aplicadas")
    except Exception as e:
        logger.warning(f"Otimizações de IA não aplicadas: {e}")