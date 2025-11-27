# backend/utils/error_handler.py
import logging
import traceback
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("coreflowfit.errors")

class CustomHTTPException(HTTPException):
    """Exceção HTTP personalizada com mais contexto"""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.context = context or {}

class ErrorHandler:
    """Manipulador global de erros"""
    
    @staticmethod
    async def handle_http_exception(request: Request, exc: HTTPException):
        """Manipula exceções HTTP"""
        error_context = {
            "path": request.url.path,
            "method": request.method,
            "client_ip": request.client.host if request.client else "unknown",
            "status_code": exc.status_code
        }
        
        # Log apropriado baseado no status code
        if exc.status_code >= 500:
            logger.error(
                f"Erro interno: {exc.detail}",
                extra={"context": error_context}
            )
        elif exc.status_code >= 400:
            logger.warning(
                f"Erro do cliente: {exc.detail}",
                extra={"context": error_context}
            )
        
        # Resposta de erro padronizada
        error_response = {
            "ok": False,
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": request.url.path
        }
        
        # Adiciona código de erro se disponível
        if hasattr(exc, 'error_code') and exc.error_code:
            error_response["error_code"] = exc.error_code
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response
        )
    
    @staticmethod
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        """Manipula erros de validação do Pydantic"""
        errors = []
        for error in exc.errors():
            errors.append({
                "field": " -> ".join(str(loc) for loc in error['loc']),
                "message": error['msg'],
                "type": error['type']
            })
        
        logger.warning(
            f"Erro de validação: {len(errors)} erro(s)",
            extra={
                "context": {
                    "path": request.url.path,
                    "method": request.method,
                    "errors": errors
                }
            }
        )
        
        return JSONResponse(
            status_code=422,
            content={
                "ok": False,
                "error": "Dados de entrada inválidos",
                "validation_errors": errors,
                "status_code": 422
            }
        )
    
    @staticmethod
    async def handle_generic_exception(request: Request, exc: Exception):
        """Manipula exceções genéricas não tratadas"""
        error_id = f"err_{hash(str(exc))}"  # ID único para o erro
        
        logger.critical(
            f"Erro não tratado: {str(exc)}",
            extra={
                "context": {
                    "error_id": error_id,
                    "path": request.url.path,
                    "method": request.method,
                    "client_ip": request.client.host if request.client else "unknown",
                    "traceback": traceback.format_exc()
                }
            }
        )
        
        # Em produção, não expõe detalhes internos
        is_production = True  # Mudar baseado em ambiente
        
        error_detail = {
            "ok": False,
            "error": "Erro interno do servidor",
            "error_id": error_id,
            "status_code": 500
        }
        
        if not is_production:
            error_detail["debug"] = {
                "exception_type": exc.__class__.__name__,
                "exception_message": str(exc),
                "traceback": traceback.format_exc().split('\n')
            }
        
        return JSONResponse(
            status_code=500,
            content=error_detail
        )

# Funções de conveniência para erros comuns
def raise_not_f_error(message: str = "Recurso não encontrado"):
    """Levanta erro 404 padronizado"""
    raise CustomHTTPException(
        status_code=404,
        detail=message,
        error_code="NOT_FOUND"
    )

def raise_validation_error(message: str = "Dados inválidos"):
    """Levanta erro 422 padronizado"""
    raise CustomHTTPException(
        status_code=422,
        detail=message,
        error_code="VALIDATION_ERROR"
    )

def raise_auth_error(message: str = "Não autorizado"):
    """Levanta erro 401 padronizado"""
    raise CustomHTTPException(
        status_code=401,
        detail=message,
        error_code="UNAUTHORIZED"
    )

def raise_permission_error(message: str = "Permissão negada"):
    """Levanta erro 403 padronizado"""
    raise CustomHTTPException(
        status_code=403,
        detail=message,
        error_code="FORBIDDEN"
    )

# Instância global
error_handler = ErrorHandler()