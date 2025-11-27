import os
import sys
import sqlalchemy
from sqlalchemy import text

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERRO: variável DATABASE_URL não está definida.")
    sys.exit(2)

print("Usando DATABASE_URL:", DATABASE_URL)

try:
    engine = sqlalchemy.create_engine(DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        r = conn.execute(text("SELECT version();"))
        v = r.fetchone()
        print("Conectado com sucesso. versão do Postgres:", v[0] if v else v)
except Exception as e:
    print("Falha ao conectar:", e)
    sys.exit(1)
