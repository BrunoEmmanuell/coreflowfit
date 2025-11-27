# setup_database.py
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import Base, engine, apply_schema_from_file

def setup_database():
    print("🚀 Configurando banco de dados Railway...")
    
    try:
        # 1. Cria tabelas do SQLAlchemy
        print("📦 Criando tabelas base...")
        Base.metadata.create_all(bind=engine)
        
        # 2. Aplica schema completo
        print("📋 Aplicando schema SQL...")
        apply_schema_from_file()
        
        print("✅ Banco de dados configurado com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro na configuração: {e}")
        return False

if __name__ == "__main__":
    success = setup_database()
    if success:
        print("🎉 Sistema pronto para uso!")
    else:
        print("💥 Configure o banco manualmente")