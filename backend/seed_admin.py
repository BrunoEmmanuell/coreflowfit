# backend/seed_admin.py
"""
Seed admin — cria usuário instrutor/admin se não existir.
Uso:
  (venv ativo) python -m backend.seed_admin
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql
from passlib.hash import pbkdf2_sha256  # usa pbkdf2, não bcrypt

# Carrega .env (o arquivo .env deve estar em backend/.env ou ajustar o caminho)
BASE = os.path.dirname(__file__)
load_dotenv(dotenv_path=os.path.join(BASE, ".env"))

DB_URL = os.getenv("DATABASE_URL") or os.getenv("DATABASE_URL".upper())
if not DB_URL:
    print("ERRO: DATABASE_URL não encontrado no backend/.env")
    sys.exit(1)

# valores padrão — edite aqui se quiser
ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@coreflowfit.app"
ADMIN_FULLNAME = "Admin CoreFlowFit"
ADMIN_PASSWORD = "admin123"  # troque após criar (senha temporária)

def get_conn():
    return psycopg2.connect(DB_URL)

def create_admin_if_not_exists():
    # Sanity check: imprimir repr da senha para depurar (remova depois)
    # print("DEBUG: admin password repr:", repr(ADMIN_PASSWORD))
    # Gera hash seguro com pbkdf2_sha256
    hashed = pbkdf2_sha256.hash(ADMIN_PASSWORD)

    q = sql.SQL(
        """
        INSERT INTO instrutores (username, email, nome_completo, hashed_password, criado_em)
        SELECT %s, %s, %s, %s, %s
        WHERE NOT EXISTS (SELECT 1 FROM instrutores WHERE username = %s OR email = %s)
        """
    )
    now = datetime.utcnow()
    params = (ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_FULLNAME, hashed, now, ADMIN_USERNAME, ADMIN_EMAIL)

    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(q, params)
        conn.commit()
        cur.close()
        conn.close()
        print("Seed concluída: admin criado (ou já existia).")
        print(f"username: {ADMIN_USERNAME}  email: {ADMIN_EMAIL}")
        print("Senha temporária (troque após logar):", ADMIN_PASSWORD)
    except Exception as e:
        print("Erro ao tentar inserir admin:", e)
        print("Verifique se a tabela 'instrutores' existe com as colunas:")
        print("username, email, nome_completo, hashed_password, criado_em")
        sys.exit(1)

if __name__ == "__main__":
    create_admin_if_not_exists()
