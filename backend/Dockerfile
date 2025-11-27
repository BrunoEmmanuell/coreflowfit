# backend/Dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

# Variáveis para otimização do Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instala dependências de compilação
RUN apt-get update && apt-get install -y --no-install-recommends gcc python3-dev libpq-dev

# Cria ambiente virtual
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Instala dependências do projeto
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- Estágio Final (Imagem Leve) ---
FROM python:3.11-slim

WORKDIR /app

# Copia o ambiente virtual do estágio anterior
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Instala bibliotecas do sistema necessárias para o PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends libpq-5 && \
    rm -rf /var/lib/apt/lists/*

# Copia o código fonte
COPY . /app/backend

# Cria usuário de segurança (não rodar como root)
RUN useradd -m appuser
USER appuser

EXPOSE 8000

# Comando para iniciar a API
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]