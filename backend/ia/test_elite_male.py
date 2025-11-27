# backend/ia/test_elite_male.py
import sys
from pathlib import Path
import json

# Ajuste de Path para rodar da raiz
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.database import get_db_connection
from backend.ia.gerador_treino_ia import gerar_treino_ia

def test_elite_male():
    print("🚀 Iniciando Teste de Geração Elite (MASCULINO)...")

    # 1. Buscar um ID de aluno HOMEM do banco
    aluno_id = None
    try:
        with get_db_connection() as (conn, cur):
            cur.execute("SELECT id, nome, sexo FROM alunos WHERE sexo = 'masculino' LIMIT 1")
            res = cur.fetchone()
            if res:
                aluno_id = res['id']
                print(f"👤 Aluno Encontrado: {res['nome']} ({res['sexo']})")
            else:
                # Fallback
                aluno_id = "teste_m_01"
                print("⚠️ Nenhum aluno homem encontrado. Usando fallback...")
    except Exception as e:
        print(f"❌ Erro ao conectar DB: {e}")
        return

    # 2. Gerar Treino (Cenário: Homem, Hipertrofia, ABC)
    print("\n🏋️ Solicitando à IA: Treino ABC Padrão (Masculino)...")
    
    resultado = gerar_treino_ia(
        aluno_id=aluno_id,
        objetivo="hipertrofia",
        nivel_atividade="avancado",
        sexo="masculino", 
        idade=30,
        peso=85.0,
        altura=1.80,
        divisao_preferida="ABC",
        preferencia_abc="padrao",
        lesoes=[],
        comorbidades=[]
    )

    # 3. Analisar Resultado
    if not resultado.get("ok"):
        print("❌ Erro na geração!")
        return

    plano = resultado["plano"]
    meta = resultado["meta"]
    explicacoes = meta["explicacoes"]
    
    print(f"\n🧠 Explicações da IA:\n" + "\n".join([f"  - {e}" for e in explicacoes]))
    
    print("\n💪 --- O TREINO GERADO (MASCULINO) ---")
    for dia in plano:
        nome = dia.get("nome_dia", dia["dia"])
        print(f"\n📅 {dia['dia']} - {nome}")
        
        # Mobilidade
        if dia.get("mobilidade"):
            print("   🧘 AQUECIMENTO (Mobilidade):")
            for mob in dia["mobilidade"]:
                print(f"      • {mob}")
            print("-" * 60)

        # Exercícios com MICRO-GESTÃO
        for ex in dia["exercicios"]:
            tec = f" 🔥[{ex['tecnica']}]" if ex.get("tecnica") else ""
            obs = f" 📝({ex['obs']})" if ex.get("obs") else ""
            
            # NOVOS CAMPOS (RPE, Descanso, Aquecimento)
            descanso = f" | ⏱️ {ex.get('descanso')}" if ex.get('descanso') else ""
            rpe = f" | 💪 RPE {ex.get('rpe')}" if ex.get('rpe') else ""
            warmup = f"\n      ⚠️ AQUECIMENTO: {ex['aquecimento']}" if ex.get('aquecimento') else ""
            
            print(f"   • {ex['nome']} | {ex['series']}x{ex['reps']}{descanso}{rpe}{tec}{obs}{warmup}")
            
        # Cardio
        if dia.get("cardio"):
            print("-" * 60)
            print(f"   🏃 CARDIO: {dia['cardio']}")

if __name__ == "__main__":
    test_elite_male()