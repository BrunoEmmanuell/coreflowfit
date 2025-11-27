# create_test_files.py
import os

# Conteúdo do test_db.py
test_db_content = '''import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import engine, Base
from sqlalchemy import text

def test_database_connection():
    print("🔗 Testando conexão com o banco Railway...")
    
    try:
        # Testa conexão básica
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"✅ PostgreSQL conectado: {version}")
            
        # Cria tabelas
        print("📦 Criando tabelas...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas criadas com sucesso!")
        
        # Verifica tabelas criadas
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            tables = [row[0] for row in result]
            print(f"📊 Tabelas no banco: {tables}")
            
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_database_connection()
    if success:
        print("🎉 Banco de dados configurado com sucesso!")
    else:
        print("💥 Falha na configuração do banco")
'''

# Escreve o arquivo test_db.py
with open('test_db.py', 'w', encoding='utf-8') as f:
    f.write(test_db_content)

print("✅ test_db.py criado com sucesso!")