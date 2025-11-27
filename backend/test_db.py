# test_db.py
import sys
import os

# Adiciona o diretório raiz do projeto ao path do Python
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

print("🔍 Iniciando teste de banco de dados...")
print(f"📁 Diretório atual: {current_dir}")
print(f"📁 Diretório pai: {parent_dir}")

try:
    from backend.database import engine, Base
    from sqlalchemy import text
    print("✅ Módulos importados com sucesso")
    
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
            
except ImportError as e:
    print(f"❌ Erro de importação: {e}")
    print("💡 Verifique se o backend.database existe")
    # Lista o conteúdo do diretório para debug
    print("📁 Conteúdo do diretório atual:")
    for item in os.listdir(current_dir):
        print(f"   {item}")
    print("📁 Conteúdo do diretório pai:")
    for item in os.listdir(parent_dir):
        print(f"   {item}")
except Exception as e:
    print(f"❌ Erro inesperado: {e}")