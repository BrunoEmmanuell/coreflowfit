# backend/limpar_inteligente.py
from backend.database import execute_query

def limpar_duplicatas():
    print("🧹 Iniciando limpeza inteligente de alunos duplicados...")
    
    # Esta query mantém apenas o aluno mais recente de cada nome
    # e apaga os mais antigos.
    query = """
        DELETE FROM alunos
        WHERE id IN (
            SELECT id
            FROM (
                SELECT id,
                ROW_NUMBER() OVER (PARTITION BY nome ORDER BY criado_em DESC) as row_num
                FROM alunos
            ) t
            WHERE t.row_num > 1
        );
    """
    
    try:
        rows_deleted = execute_query(query)
        print(f"✅ Limpeza concluída! Foram removidos {rows_deleted} alunos duplicados.")
        print("✨ Agora você terá apenas 1 registo para cada nome.")
    except Exception as e:
        print(f"❌ Erro ao limpar: {e}")

if __name__ == "__main__":
    limpar_duplicatas()