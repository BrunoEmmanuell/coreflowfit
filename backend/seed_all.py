# backend/seed_all.py

import uuid
import random
from datetime import datetime, timedelta
import importlib.util
import os

# ==========================================================
# 🔥 IMPORTAÇÃO GARANTIDA DO ARQUIVO backend/database.py
#    (independente de pacotes duplicados)
# ==========================================================

this_dir = os.path.dirname(__file__)          # pasta /backend/
db_path = os.path.join(this_dir, "database.py")

spec = importlib.util.spec_from_file_location("project_database", db_path)
project_database = importlib.util.module_from_spec(spec)
spec.loader.exec_module(project_database)

execute_query = project_database.execute_query


# ==========================================================
# 🚀 FUNÇÃO PRINCIPAL
# ==========================================================

def seed_all():
    print("🌍 Semeando evolução para TODOS os alunos...")

    try:
        # 1. Busca TODOS os alunos do banco
        alunos = execute_query("SELECT id, nome FROM alunos")

        if not alunos:
            print("⚠ Nenhum aluno encontrado no banco.")
            return

        print(f"👥 Encontrados {len(alunos)} alunos. Gerando histórico...")

        for aluno in alunos:
            aluno_id = str(aluno["id"])
            nome = aluno["nome"]

            # 2. Verifica se já tem histórico (para não duplicar)
            tem_dados = execute_query(
                "SELECT id FROM medidas_corpo WHERE aluno_id = %s LIMIT 1",
                (aluno_id,),
                fetchone=True
            )

            if tem_dados:
                print(f"   ✔ {nome}: já possui histórico. Pulando.")
                continue

            print(f"   🔧 Gerando dados para: {nome}")

            # Parâmetros base individuais
            peso_base = random.uniform(60, 90)
            cintura_base = random.uniform(70, 100)
            braco_base = random.uniform(28, 40)

            # Gera 6 meses de histórico retroativo
            for i in range(6, -1, -1):
                data = datetime.now() - timedelta(days=i * 30)
                progresso = 6 - i

                peso = peso_base - (progresso * 0.3) + random.uniform(-0.5, 0.5)
                cintura = cintura_base - (progresso * 0.5)
                braco = braco_base + (progresso * 0.2)

                execute_query("""
                    INSERT INTO medidas_corpo (
                        id, aluno_id, data_medida,
                        peso_kg, altura_m,
                        ombros, peito, cintura, quadril,
                        braco_direito, braco_esquerdo,
                        coxa_direita, coxa_esquerda,
                        panturrilha_direita, panturrilha_esquerda,
                        criado_em
                    ) VALUES (
                        %s, %s, %s,
                        %s, %s,
                        %s, %s, %s, %s,
                        %s, %s,
                        %s, %s,
                        %s, %s,
                        %s
                    )
                """, (
                    str(uuid.uuid4()), aluno_id, data,
                    peso, 1.75,
                    120, 100, cintura, 105,
                    braco, braco,
                    60, 60,
                    38, 38,
                    datetime.now()
                ))

        print("🎉 SEED finalizado com sucesso!")

    except Exception as e:
        print("❌ Erro durante o seed:", e)
        raise


# ==========================================================
# RUN
# ==========================================================

if __name__ == "__main__":
    seed_all()
