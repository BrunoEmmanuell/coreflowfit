# backend/ia/test_elite_scenarios.py
import sys
import uuid
import json
from pathlib import Path
from datetime import date, timedelta

# Ajuste de Path para rodar da raiz
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.database import get_db_connection
from backend.ia.gerador_treino_ia import gerar_treino_ia

def criar_cenario_aluno(nome_cenario, fase_ciclo="hipertrofia", feedbacks_recentes=[]):
    """Cria um aluno temporário e injeta histórico específico no DB."""
    aluno_id = str(uuid.uuid4())
    instrutor_id = str(uuid.uuid4())
    
    print(f"\n🧪 --- CRIANDO CENÁRIO: {nome_cenario} ---")
    
    with get_db_connection() as (conn, cur):
        # Criar Aluno
        cur.execute("""
            INSERT INTO alunos (id, nome, email, data_nascimento, sexo, objetivo, nivel_experiencia, historico_lesoes)
            VALUES (%s, 'Tester Elite', %s, '2000-01-01', 'masculino', 'hipertrofia', 'avancado', 'nenhuma')
        """, (aluno_id, f"test_{aluno_id[:8]}@ia.com"))
        
        # 1. Injetar Ciclo (Periodização)
        cur.execute("""
            INSERT INTO ciclos_treino (aluno_id, fase, data_inicio, semanas_planeadas, ativo)
            VALUES (%s, %s, %s, 8, TRUE)
        """, (aluno_id, fase_ciclo, date.today()))
        
        # 2. Injetar Feedbacks (Auto-Regulação)
        # Cria treinos falsos passados para associar o feedback
        for nota in feedbacks_recentes:
            treino_id = str(uuid.uuid4())
            cur.execute("INSERT INTO treinos_gerados (id, aluno_id, gerado_em) VALUES (%s, %s, NOW())", (treino_id, aluno_id))
            cur.execute("""
                INSERT INTO feedbacks (treino_id, aluno_id, nota, criado_em) 
                VALUES (%s, %s, %s, NOW())
            """, (treino_id, aluno_id, nota))
            
        conn.commit()
        print(f"   ✅ Aluno {aluno_id} configurado na fase '{fase_ciclo}' com histórico de notas {feedbacks_recentes}")
        return aluno_id

def analisar_resultado(resultado):
    if not resultado.get("ok"):
        print("   ❌ Erro na geração.")
        return

    decisions = resultado["meta"]["decisions"]
    elite = decisions.get("elite_strategy", {})
    plano = resultado["plano"]
    dia_a = plano[0]["exercicios"][0] # Primeiro exercício do dia A
    
    print(f"   🧠 Cérebro Decidiu: {elite.get('foco_fase')} | Reps: {elite.get('reps_range')}")
    print(f"   💪 Exemplo Prático: {dia_a['nome']} -> {dia_a['series']} Séries de {dia_a['reps']}")
    
    # Verificar Técnicas
    tecnicas_encontradas = []
    for dia in plano:
        for ex in dia["exercicios"]:
            if ex.get("tecnica"):
                tecnicas_encontradas.append(ex["tecnica"])
    
    if tecnicas_encontradas:
        print(f"   🔥 Técnicas Usadas: {list(set(tecnicas_encontradas))}")
    else:
        print("   🧊 Nenhuma técnica avançada (como esperado para esta fase).")

def run_tests():
    # CENÁRIO 1: FORÇA PURA
    # Esperado: Reps baixas (3-6), Carga Alta, Sem dropsets
    id_forca = criar_cenario_aluno("Fase de Força Bruta", fase_ciclo="forca", feedbacks_recentes=[4, 5, 4])
    res_forca = gerar_treino_ia(aluno_id=id_forca, objetivo="forca", nivel_atividade="avancado", sexo="masculino", peso=80, altura=1.80, idade=25)
    analisar_resultado(res_forca)

    # CENÁRIO 2: ALUNO EXAUSTO (Auto-Regulação)
    # Esperado: Volume reduzido (series -1), Foco em recuperação
    id_cansado = criar_cenario_aluno("Aluno Exausto/Overreaching", fase_ciclo="hipertrofia", feedbacks_recentes=[1, 2, 1]) # Notas baixas!
    res_cansado = gerar_treino_ia(aluno_id=id_cansado, objetivo="hipertrofia", nivel_atividade="avancado", sexo="masculino", peso=80, altura=1.80, idade=25)
    analisar_resultado(res_cansado)

    # CENÁRIO 3: METABÓLICO (Semana Ímpar)
    # Esperado: Reps altas (12-15), Dropsets ativos
    # Nota: O cérebro calcula semanas pela data. Vamos confiar no padrão hipertrofia.
    id_meta = criar_cenario_aluno("Hipertrofia Metabólica", fase_ciclo="hipertrofia", feedbacks_recentes=[4, 4, 5])
    res_meta = gerar_treino_ia(aluno_id=id_meta, objetivo="hipertrofia", nivel_atividade="avancado", sexo="masculino", peso=80, altura=1.80, idade=25)
    analisar_resultado(res_meta)

if __name__ == "__main__":
    run_tests()