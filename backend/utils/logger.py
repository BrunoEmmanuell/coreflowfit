# backend/utils/logger.py
import logging
import sys
from pathlib import Path
from datetime import datetime
import json
from typing import Dict, Any
import traceback

class JSONFormatter(logging.Formatter):
    """Formata logs em JSON para melhor processamento"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Adiciona contexto adicional se disponível
        if hasattr(record, 'context'):
            log_entry['context'] = record.context
            
        # Adiciona exceção se houver
        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }
        
        return json.dumps(log_entry, ensure_ascii=False)

def setup_logging():
    """Configura sistema de logging completo"""
    
    # Cria diretório de logs se não existir
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configura root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Remove handlers existentes
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Handler para arquivo (JSON)
    file_handler = logging.FileHandler(
        log_dir / f"coreflowfit_{datetime.now().strftime('%Y%m%d')}.log",
        encoding='utf-8'
    )
    file_handler.setFormatter(JSONFormatter())
    file_handler.setLevel(logging.INFO)
    
    # Handler para console (formato legível)
    console_handler = logging.StreamHandler(sys.stdout)
    console_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_format)
    console_handler.setLevel(logging.INFO)
    
    # Adiciona handlers
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    # Logger específico para segurança
    security_logger = logging.getLogger("coreflowfit.security")
    security_handler = logging.FileHandler(
        log_dir / f"security_{datetime.now().strftime('%Y%m%d')}.log",
        encoding='utf-8'
    )
    security_handler.setFormatter(JSONFormatter())
    security_logger.addHandler(security_handler)
    security_logger.setLevel(logging.INFO)
    
    # Logger específico para IA
    ia_logger = logging.getLogger("coreflowfit.ia")
    ia_handler = logging.FileHandler(
        log_dir / f"ia_{datetime.now().strftime('%Y%m%d')}.log",
        encoding='utf-8'
    )
    ia_handler.setFormatter(JSONFormatter())
    ia_logger.addHandler(ia_handler)
    ia_logger.setLevel(logging.INFO)

def log_with_context(message: str, level: str = "info", **context):
    """Log com contexto adicional"""
    logger = logging.getLogger("coreflowfit.app")
    
    # Cria record com contexto
    extra = {'context': context}
    
    if level.lower() == "debug":
        logger.debug(message, extra=extra)
    elif level.lower() == "info":
        logger.info(message, extra=extra)
    elif level.lower() == "warning":
        logger.warning(message, extra=extra)
    elif level.lower() == "error":
        logger.error(message, extra=extra)
    elif level.lower() == "critical":
        logger.critical(message, extra=extra)

# Configura logging na importação
setup_logging()