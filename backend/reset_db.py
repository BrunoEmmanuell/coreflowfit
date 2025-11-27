# backend/reset_db.py
import logging
import sys
import time
from pathlib import Path

# Ajuste de Path para rodar da raiz
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.database import get_db_connection

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("reset_db")

def hard_reset():
    logger.warning("⚠️  INICIANDO HARD RESET DO BANCO DE DADOS...")
    logger.warning("ISTO VAI APAGAR TODOS OS DADOS! (Aguardando 3 segundos...)")
    time.sleep(3)
    
    try:
        with get_db_connection() as (conn, cur):
            # Forçar a queda de todas as conexões ativas para permitir o DROP
            # (Isso evita o erro "database is being accessed by other users")
            cur.execute("""
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = current_database()
                  AND pid <> pg_backend_pid();
            """)
            
            # Recriar o Schema Public
            logger.info("🗑️  Apagando schema public...")
            cur.execute("DROP SCHEMA public CASCADE;")
            cur.execute("CREATE SCHEMA public;")
            cur.execute("GRANT ALL ON SCHEMA public TO public;")
            
            conn.commit()
            logger.info("✅ Banco de dados ZERADO com sucesso.")
            
    except Exception as e:
        logger.error(f"❌ Erro ao resetar banco: {e}")
        sys.exit(1)

if __name__ == "__main__":
    hard_reset()