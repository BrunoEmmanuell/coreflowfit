#!/bin/bash
# Script de inicialização para o Render

# O Render define a porta em $PORT. Usamos 8000 como fallback para desenvolvimento local.
PORT=${PORT:-8000}

echo "Iniciando Uvicorn na porta $PORT..."
exec uvicorn backend.main:app --host 0.0.0.0 --port $PORT
