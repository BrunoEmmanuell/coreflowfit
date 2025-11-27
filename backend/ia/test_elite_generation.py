# backend/ia/test_elite_generation.py
import sys
from pathlib import Path
import json

# Ajuste de Path para rodar da raiz
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.database import get_db_connection
from backend.ia.gerador_treino_ia import gerar_treino_ia

def test_elite_generation():
    print("🚀 Iniciando Teste de Geração Elite...")

    # 1. Buscar um ID de aluna REAL do banco
    aluno_id = None
    try:
        with get_db_connection() as (conn, cur):
            # Tenta achar uma mulher para testar a divisão ABC feminina
            cur.execute("SELECT id, nome, sexo FROM alunos WHERE sexo = 'feminino' LIMIT 1")
            res = cur.fetchone()
            if res:
                aluno_id = res['id']
                print(f"👤 Aluna Encontrada para o teste: {res['nome']} ({res['sexo']})")
            else:
                print("⚠️ Nenhuma aluna encontrada. Buscando qualquer aluno...")
                cur.execute("SELECT id, nome, sexo FROM alunos LIMIT 1")
                res = cur.fetchone()
                if res:
                    aluno_id = res['id']
                    print(f"👤 Aluno Encontrado: {res['nome']} ({res['sexo']})")
                else:
                    print("❌ Erro: Banco vazio. Rode o seed_db_ml.py primeiro.")
                    return
    except Exception as e:
        print(f"❌ Erro ao conectar DB: {e}")
        return

    # 2. Gerar Treino
    print("\n🏋️ Solicitando à IA: Treino ABC com FOCO EM PERNAS...")
    
    resultado = gerar_treino_ia(
        aluno_id=aluno_id,
        objetivo="hipertrofia",
        nivel_atividade="intermediario",
        sexo="feminino", 
        idade=25,
        peso=60.0,
        altura=1.65,
        divisao_preferida="ABC",
        preferencia_abc="pernas",
        lesoes=[], # Pode testar colocar ["joelho"] aqui para ver o cardio mudar
        comorbidades=[]
    )

    # 3. Analisar Resultado
    if not resultado.get("ok"):
        print("❌ Erro na geração!")
        return

    plano = resultado["plano"]
    meta = resultado["meta"]
    explicacoes = meta["explicacoes"]
    decisions = meta["decisions"]
    
    print("\n🧠 --- CÉREBRO DA IA ---")
    print(f"Estratégia Elite Usada: {decisions.get('elite_strategy', {}).get('foco_fase', 'N/A')}")
    print(f"Variação ABC: {decisions.get('abc_variation')}")
    print("Explicações:\n" + "\n".join([f"  - {e}" for e in explicacoes]))
    
    print("\n💪 --- O TREINO GERADO (COMPLETO) ---")
    for dia in plano:
        nome = dia.get("nome_dia", dia["dia"])
        print(f"\n📅 {dia['dia']} - {nome}")
        
        # --- MOSTRAR MOBILIDADE (EXTRA) ---
        if dia.get("mobilidade"):
            print("   🧘 PREPARAÇÃO (Mobilidade/Ativação):")
            for mob in dia["mobilidade"]:
                print(f"      • {mob}")
            print("-" * 40)
        else:
            print("-" * 40)

        # --- MOSTRAR EXERCÍCIOS ---
        for ex in dia["exercicios"]:
            tec = f" 🔥[{ex['tecnica']}]" if ex.get("tecnica") else ""
            obs = f" 📝({ex['obs']})" if ex.get("obs") else ""
            print(f"   • {ex['nome']} | {ex['series']}x{ex['reps']}{tec}{obs}")
            
        # --- MOSTRAR CARDIO (EXTRA) ---
        if dia.get("cardio"):
            print("-" * 40)
            print(f"   🏃 CARDIO FINAL: {dia['cardio']}")

if __name__ == "__main__":
    test_elite_generation()