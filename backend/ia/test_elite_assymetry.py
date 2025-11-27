# backend/ia/test_elite_assymetry.py
import sys
from pathlib import Path

# Ajuste de Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.database import get_db_connection
from backend.ia.gerador_treino_ia import gerar_treino_ia

def test_assimetria():
    print("🚀 Iniciando Caça à Assimetria...")

    aluno_assimetrico_id = None
    tipo_assimetria = ""

    # 1. Procurar um aluno com assimetria no banco
    try:
        with get_db_connection() as (conn, cur):
            # Busca alguém com diferença > 1.5cm
            cur.execute("""
                SELECT aluno_id, braco_direito, braco_esquerdo, coxa_direita, coxa_esquerda, p.nome
                FROM medidas_corpo m
                JOIN alunos p ON p.id = m.aluno_id
                WHERE ABS(braco_direito - braco_esquerdo) > 1.5
                   OR ABS(coxa_direita - coxa_esquerda) > 1.5
                LIMIT 1
            """)
            res = cur.fetchone()
            
            if res:
                aluno_assimetrico_id = res['aluno_id']
                nome = res['nome']
                bd, be = float(res['braco_direito'] or 0), float(res['braco_esquerdo'] or 0)
                cd, ce = float(res['coxa_direita'] or 0), float(res['coxa_esquerda'] or 0)
                
                print(f"🎯 Alvo Encontrado: {nome}")
                if abs(bd - be) > 1.5:
                    print(f"   ⚠️ Assimetria de Braços: Dir {bd}cm vs Esq {be}cm")
                    tipo_assimetria = "braços"
                if abs(cd - ce) > 1.5:
                    print(f"   ⚠️ Assimetria de Pernas: Dir {cd}cm vs Esq {ce}cm")
                    if not tipo_assimetria: tipo_assimetria = "pernas"
            else:
                print("❌ Nenhum aluno com assimetria encontrado.")
                return

    except Exception as e:
        print(f"❌ Erro SQL: {e}")
        return

    # 2. Gerar Treino
    print(f"\n🏋️ Gerando Treino para corrigir {tipo_assimetria}...")
    
    resultado = gerar_treino_ia(
        aluno_id=aluno_assimetrico_id,
        objetivo="hipertrofia",
        nivel_atividade="intermediario",
        sexo="masculino", 
        idade=25, peso=75, altura=1.75,
        divisao_preferida="ABC",
        preferencia_abc="padrao"
    )

    # 3. Analisar
    explicacoes = resultado["meta"]["explicacoes"]
    plano = resultado["plano"]

    print("\n🧠 --- CÉREBRO DA IA ---")
    for exp in explicacoes:
        if "Elite AI" in exp:
            print(f"   💡 {exp}")

    print("\n💪 --- TREINO GERADO (Verificar Unilaterais e RPE) ---")
    
    dias_foco = ["A", "B"] if "braços" in tipo_assimetria else ["C"]

    for dia in plano:
        if dia["dia"] in dias_foco:
            print(f"\n📅 {dia['nome_dia']}")
            
            if dia.get("mobilidade"):
                print(f"   🧘 Mob: {', '.join(dia['mobilidade'])}")
                
            print("-" * 60)

            for ex in dia["exercicios"]:
                nome = ex['nome']
                # Destacar se for unilateral
                destaque = ""
                if any(x in nome.lower() for x in ["halter", "unilateral", "serrote", "alternada", "concentrada", "búlgaro", "passada"]):
                    destaque = " ⭐UNILATERAL"
                
                # Campos de Micro-Gestão
                descanso = f" | ⏱️ {ex.get('descanso')}" if ex.get('descanso') else ""
                rpe = f" | 💪 {ex.get('rpe')}" if ex.get('rpe') else ""
                
                print(f"   • {nome}{destaque} {descanso}{rpe}")

if __name__ == "__main__":
    test_assimetria()