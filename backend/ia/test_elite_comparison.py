# backend/ia/test_elite_comparison.py
import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path: sys.path.insert(0, str(BASE_DIR))

from backend.ia.gerador_treino_ia import gerar_treino_ia

def print_plano(plano, titulo):
    print(f"\n{'='*15} {titulo} {'='*15}")
    for dia in plano:
        print(f"\n📅 {dia['dia']} - {dia.get('nome_dia', '')}")
        if dia.get("mobilidade"):
            print(f"   🧘 Mob: {', '.join(dia['mobilidade'])}")
        print("-" * 40)
        for ex in dia["exercicios"]:
            print(f"   • {ex['nome']}")
        print("-" * 40)

def run_test():
    print("🚀 Comparativo ABCDE Elite (Homem vs Mulher)...")

    # 1. Mulher (Wellness)
    res_fem = gerar_treino_ia(
        sexo="feminino", objetivo="hipertrofia", nivel_atividade="avancado",
        idade=25, peso=60, altura=1.65, divisao_preferida="ABCDE"
    )
    
    # 2. Homem (Bro Split)
    res_masc = gerar_treino_ia(
        sexo="masculino", objetivo="hipertrofia", nivel_atividade="avancado",
        idade=30, peso=85, altura=1.80, divisao_preferida="ABCDE"
    )

    print_plano(res_fem["plano"], "ABCDE FEMININO (Wellness)")
    print_plano(res_masc["plano"], "ABCDE MASCULINO (Bro Split)")

if __name__ == "__main__":
    run_test()