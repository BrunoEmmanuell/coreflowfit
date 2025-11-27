# backend/middleware/security.py
import time
import logging
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Callable
import re

logger = logging.getLogger("coreflowfit.security")

class SecurityMiddleware:
    def __init__(self):
        self.rate_limits = {}
        self.blocked_ips = set()
        
    async def __call__(self, request: Request, call_next: Callable):
        # 1. Verificação de IP bloqueado
        client_ip = request.client.host
        if client_ip in self.blocked_ips:
            return JSONResponse(
                status_code=429,
                content={"detail": "IP temporariamente bloqueado"}
            )
        
        # 2. Rate Limiting básico
        current_time = time.time()
        window_size = 60  # 1 minuto
        
        if client_ip not in self.rate_limits:
            self.rate_limits[client_ip] = []
        
        # Remove requisições antigas
        self.rate_limits[client_ip] = [
            req_time for req_time in self.rate_limits[client_ip]
            if current_time - req_time < window_size
        ]
        
        # Verifica limite (100 req/minuto)
        if len(self.rate_limits[client_ip]) >= 100:
            self.blocked_ips.add(client_ip)
            logger.warning(f"IP bloqueado por excesso de requisições: {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Muitas requisições. Tente novamente mais tarde."}
            )
        
        self.rate_limits[client_ip].append(current_time)
        
        # 3. Prevenção de SQL Injection básica
        if await self._detect_sql_injection(request):
            logger.warning(f"Tentativa de SQL Injection detectada de {client_ip}")
            return JSONResponse(
                status_code=400,
                content={"detail": "Requisição suspeita detectada"}
            )
        
        # 4. Prevenção de XSS básica
        if await self._detect_xss(request):
            logger.warning(f"Tentativa de XSS detectada de {client_ip}")
            return JSONResponse(
                status_code=400,
                content={"detail": "Conteúdo malicioso detectado"}
            )
        
        try:
            response = await call_next(request)
            return response
            
        except Exception as e:
            logger.error(f"Erro no middleware de segurança: {e}")
            raise
    
    async def _detect_sql_injection(self, request: Request) -> bool:
        """Detecta padrões básicos de SQL Injection"""
        sql_patterns = [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR\s+1=1)\b)",
            r"(\b(ALTER|CREATE|EXEC|EXECUTE|TRUNCATE)\b)",
            r"('|\"|;|--|\/\*|\*\/)",
        ]
        
        # Verifica query parameters
        for param_name, param_value in request.query_params.items():
            if isinstance(param_value, str):
                for pattern in sql_patterns:
                    if re.search(pattern, param_value, re.IGNORECASE):
                        return True
        
        # Verifica body para métodos POST/PUT
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.json()
                if isinstance(body, dict):
                    for key, value in body.items():
                        if isinstance(value, str):
                            for pattern in sql_patterns:
                                if re.search(pattern, value, re.IGNORECASE):
                                    return True
            except:
                pass
        
        return False
    
    async def _detect_xss(self, request: Request) -> bool:
        """Detecta padrões básicos de XSS"""
        xss_patterns = [
            r"<script.*?>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"alert\(",
            r"document\.cookie",
        ]
        
        # Verifica query parameters
        for param_name, param_value in request.query_params.items():
            if isinstance(param_value, str):
                for pattern in xss_patterns:
                    if re.search(pattern, param_value, re.IGNORECASE):
                        return True
        
        return False

# Instância global
security_middleware = SecurityMiddleware()