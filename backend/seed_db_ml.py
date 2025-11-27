# backend/seed_db_ml.py
import uuid
import random
import json
import logging
import sys
from pathlib import Path
from datetime import datetime, timedelta

# --- Ajuste de Path Crítico ---
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Importação robusta
try:
    from backend.database import get_db_connection
except ImportError:
    try:
        sys.path.append(str(Path(__file__).resolve().parent))
        from database import get_db_connection
    except ImportError as e:
        print(f"Erro crítico de importação: {e}")
        sys.exit(1)

# Configuração de Logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("seed_db")

def seed_database():
    logger.info("🌱 Iniciando Seed V4 (Com Medidas de Assimetria)...")
    
    try:
        with get_db_connection() as (conn, cur):
            # 1. Instrutor
            instrutor_id = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO instrutores (id, username, email, hashed_password) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING",
                (instrutor_id, "admin_ia", "admin@ia.com", "hash_falso")
            )
            
            # 2. Alunos (750 alunos para garantir variedade)
            logger.info("👤 Gerando 750 alunos (com assimetrias)...")
            alunos_ids = []
            
            lesoes_pool = ["joelho", "ombro", "coluna", "nenhuma", "nenhuma", "nenhuma"]
            niveis = ["iniciante", "intermediario", "avancado"]
            
            for i in range(750):
                aluno_id = str(uuid.uuid4())
                alunos_ids.append(aluno_id)
                
                lesao = random.choice(lesoes_pool)
                nivel = random.choice(niveis)
                idade = random.randint(18, 65)
                sexo = random.choice(["masculino", "feminino"])
                
                cur.execute("""
                    INSERT INTO alunos (id, nome, data_nascimento, sexo, objetivo, nivel_experiencia, historico_lesoes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    aluno_id, 
                    f"Aluno {i+1}", 
                    datetime.now() - timedelta(days=365*idade),
                    sexo,
                    random.choice(["hipertrofia", "emagrecimento"]),
                    nivel,
                    lesao if lesao != "nenhuma" else ""
                ))
                
                # Saúde
                tem_diabetes = random.random() < 0.1
                tem_hipertensao = random.random() < 0.15
                
                cur.execute("""
                    INSERT INTO saude_aluno (aluno_id, diabetes, hipertensao, lesoes)
                    VALUES (%s, %s, %s, %s)
                """, (aluno_id, tem_diabetes, tem_hipertensao, lesao if lesao != "nenhuma" else ""))
                
                # --- MEDIDAS COM ASSIMETRIA SIMULADA ---
                peso = random.uniform(50, 100)
                altura = random.uniform(1.50, 1.90)
                
                # Base
                braco_base = random.uniform(28, 45)
                coxa_base = random.uniform(45, 65)
                
                # Simular assimetria em 20% dos casos
                tem_assimetria = random.random() < 0.2
                
                if tem_assimetria:
                    # Diferença grande (> 2cm) para forçar a IA a corrigir
                    braco_d = braco_base
                    braco_e = braco_base - random.uniform(2.0, 4.0) 
                    coxa_d = coxa_base
                    coxa_e = coxa_base - random.uniform(2.0, 4.0)
                else:
                    # Simétrico (diferença < 0.5cm)
                    braco_d = braco_base
                    braco_e = braco_base - random.uniform(0, 0.4)
                    coxa_d = coxa_base
                    coxa_e = coxa_base - random.uniform(0, 0.4)

                cur.execute("""
                    INSERT INTO medidas_corpo 
                    (aluno_id, peso_kg, altura_m, braco_direito, braco_esquerdo, coxa_direita, coxa_esquerda)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (aluno_id, peso, altura, braco_d, braco_e, coxa_d, coxa_e))

            # 3. Treinos e Feedbacks Rápidos
            for aluno_id in alunos_ids:
                treino_id = str(uuid.uuid4())
                treino_fake = {"dias": "A"} # Simplificado para velocidade
                cur.execute("""
                    INSERT INTO treinos_gerados (id, aluno_id, instrutor_id, conteudo_json, gerado_em)
                    VALUES (%s, %s, %s, %s, NOW())
                """, (treino_id, aluno_id, instrutor_id, json.dumps(treino_fake)))
                
                cur.execute("""
                    INSERT INTO feedbacks (treino_id, aluno_id, nota, comentario)
                    VALUES (%s, %s, %s, 'Seed V4')
                """, (treino_id, aluno_id, random.choice([3,4,5])))
            
            conn.commit()
            logger.info("✅ Sucesso! Banco populado com Medidas e Assimetrias.")

    except Exception as e:
        logger.error(f"❌ Erro ao popular banco: {e}")

if __name__ == "__main__":
    seed_database()