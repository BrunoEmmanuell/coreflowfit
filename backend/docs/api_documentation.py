# backend/docs/api_documentation.py
"""
Documentação da API CoreFlowFit

Esta documentação descreve todos os endpoints disponíveis na API CoreFlowFit v4.0.
"""

API_DOCS = {
    "title": "CoreFlowFit API",
    "version": "4.0.0",
    "description": """
# CoreFlowFit API

API inteligente para geração e gestão de treinos personalizados.

## Autenticação

A API usa autenticação JWT (JSON Web Token). Para acessar endpoints protegidos:

1. Faça login em `/api/v1/auth/login` para obter um token
2. Inclua o token no header: `Authorization: Bearer <seu_token>`

## Endpoints Principais

### Autenticação
- `POST /api/v1/auth/register` - Registrar novo instrutor
- `POST /api/v1/auth/login` - Login e obtenção de token

### Alunos
- `GET /api/v1/alunos/` - Listar alunos do instrutor
- `POST /api/v1/alunos/completo` - Criar aluno completo (com medidas e saúde)

### Treinos
- `GET /api/v1/treinos/{treino_id}` - Obter treino específico
- `POST /api/v1/ia/gerar-treino` - Gerar novo treino com IA

### Saúde e Medidas
- `POST /api/v1/saude/save` - Salvar dados de saúde
- `POST /api/v1/medidas/` - Registrar medidas corporais
- `GET /api/v1/medidas/aluno/{aluno_id}` - Histórico de medidas

### IA
- `POST /api/v1/ia/gerar-treino` - Gerar treino personalizado
- `POST /api/v1/ia/feedback` - Registrar feedback sobre treino

## Códigos de Resposta

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autorizado
- `403` - Proibido
- `404` - Recurso não encontrado
- `422` - Dados de entrada inválidos
- `429` - Muitas requisições
- `500` - Erro interno do servidor

## Exemplos de Uso

### Gerar Treino
```json
POST /api/v1/ia/gerar-treino
{
  "aluno_id": "uuid-do-aluno",
  "divisao_preferida": "abc"
}
POST /api/v1/medidas/
{
  "aluno_id": 1,
  "peso": 70.5,
  "altura": 1.75,
  "cintura": 85.0,
  "quadril": 95.0
}
### 19. **backend/config/production.py** - CONFIGURAÇÕES DE PRODUÇÃO
```python
# backend/config/production.py
import os
from backend.config import Settings

class ProductionSettings(Settings):
    """Configurações específicas para produção"""
    
    # Segurança
    DEBUG: bool = False
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY_PROD")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hora em produção
    
    # Banco de Dados
    DATABASE_URL: str = os.getenv("DATABASE_URL_PROD")
    
    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "redis-prod")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD")
    
    # CORS
    BACKEND_CORS_ORIGINS: list = [
        "https://coreflowfit.com",
        "https://www.coreflowfit.com",
        "https://app.coreflowfit.com"
    ]
    
    # Monitoramento
    LOG_LEVEL: str = "WARNING"
    ENABLE_METRICS: bool = True
    
    # Performance
    MAX_WORKERS: int = 4
    KEEP_ALIVE: int = 5
    
    class Config:
        env_file = ".env.production"

# Instância para produção
production_settings = ProductionSettings()
# backend/Dockerfile
FROM python:3.9-slim

# Define variáveis de ambiente
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

# Cria diretório da aplicação
WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements e instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia código da aplicação
COPY . .

# Cria usuário não-root para segurança
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Comando de inicialização
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]