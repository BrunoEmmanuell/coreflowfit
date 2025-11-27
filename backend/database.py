# backend/database.py
from dotenv import load_dotenv
import pathlib
import os
import time
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

# Carrega variáveis de ambiente
load_dotenv(dotenv_path=str(pathlib.Path(__file__).resolve().parent / ".env"))

# ====================================================
# DATABASE URL
# ====================================================
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não definida em .env")

def ensure_sslmode(url: str) -> str:
    # CORREÇÃO: Se estiver em desenvolvimento, NÃO força SSL para o Docker
    if os.getenv("ENVIRONMENT") == "development":
        return url

    # Para produção (Railway/Render), força SSL
    if url.startswith("postgres://") or url.startswith("postgresql://"):
        parsed = urlparse(url)
        q = parse_qs(parsed.query)
        if "sslmode" not in q:
            q["sslmode"] = ["require"]
            new_query = urlencode(q, doseq=True)
            parsed = parsed._replace(query=new_query)
            return urlunparse(parsed)
    return url

DATABASE_URL = ensure_sslmode(DATABASE_URL)

# ====================================================
# ENGINE / POOL
# ====================================================
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
else:
    try:
        pool_size = int(os.getenv("PG_POOL_MIN", "1"))
        pg_pool_max = int(os.getenv("PG_POOL_MAX", "5"))
        max_overflow = max(0, pg_pool_max - pool_size)
    except Exception:
        pool_size = 1
        max_overflow = 4

    engine = create_engine(
        DATABASE_URL,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ====================================================
# BASE DECLARATIVA
# ====================================================
Base = declarative_base()

# ====================================================
# EXECUTE QUERY (helper)
# ====================================================
def execute_query(query: str, params: dict | None = None, *, fetch: bool = True):
    params = params or {}
    with engine.connect() as conn:
        result = conn.execute(text(query), params)
        if fetch:
            try:
                rows = result.mappings().all()
                return rows
            except Exception:
                return []
        return {"rowcount": result.rowcount}

# ====================================================
# DEPENDENCIES
# ====================================================
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_conn() -> Generator:
    conn = engine.connect()
    try:
        yield conn
    finally:
        try:
            conn.close()
        except Exception:
            pass

# ====================================================
# TESTE DE CONEXÃO
# ====================================================
def test_connection(retries: int = 5, delay: float = 2.0):
    last_exc = None
    for attempt in range(1, retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("DB connection: OK")
            return True
        except Exception as e:
            last_exc = e
            print(f"DB connection attempt {attempt} failed: {e}")
            time.sleep(delay)
    print(f"DB connection failed after {retries} attempts. Last error: {last_exc}")
    return False

if os.getenv("ENVIRONMENT", "development") != "development":
    test_connection(retries=3, delay=2)