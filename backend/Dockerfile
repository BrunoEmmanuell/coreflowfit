# backend/Dockerfile

# Estágio de Build (Usando versão estável - bookworm)
FROM python:3.11-slim-bookworm as builder

WORKDIR /app

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

# --- Estágio Final (Produção) ---
FROM python:3.11-slim-bookworm

WORKDIR /app

# Copia o ambiente virtual do estágio anterior
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# CORREÇÃO AQUI: Mudamos de libpq-5 para libpq5
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Copia o código fonte
COPY . /app/backend

# Cria usuário de segurança
RUN useradd -m appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]