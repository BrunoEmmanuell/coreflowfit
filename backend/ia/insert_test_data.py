"""
Insert test data for IA pipelines.

Usage:
    python -m backend.ia.insert_test_data --count 200
"""

import argparse
import json
import logging
import random
from datetime import datetime, timedelta

# Import database helpers (usa relative import dentro do package)
from ..database import execute_query, get_db_conn

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("coreflowfit.ia.insert_test_data")


def ensure_extension_pgcrypto():
    """Cria extension pgcrypto se não existir (para gen_random_uuid)."""
    try:
        execute_query("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
        logger.debug("pgcrypto extension OK.")
    except Exception as e:
        logger.warning("Não foi possível garantir pgcrypto: %s", e)


def ensure_columns(table: str, needed: dict):
    """
    Garante que as colunas em 'needed' existam na tabela; cria se faltar.
    needed: dict column_name -> SQL type (ex: 'model_version': 'TEXT')
    """
    for col, coltype in needed.items():
        q = """
        SELECT 1 FROM information_schema.columns
         WHERE table_name = %s AND column_name = %s
        """
        res = execute_query(q, (table, col), fetchone=True)
        if res:
            logger.debug("Coluna %s.%s já existe.", table, col)
            continue
        alter = f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {coltype};"
        logger.info("Criando coluna faltante: %s.%s %s", table, col, coltype)
        execute_query(alter)


def ensure_tables_ready():
    """
    Garante colunas mínimas nas tabelas usadas pelo pipeline de IA.
    Ajuste/expanda conforme seu schema.
    """
    ensure_extension_pgcrypto()

    # ia_feature_store precisa de: aluno_id, features_json (JSONB), model_version, criado_em
    ensure_columns("ia_feature_store", {
        "aluno_id": "UUID",
        "features_json": "JSONB",
        "model_version": "TEXT",
        "criado_em": "TIMESTAMPTZ DEFAULT now()"
    })

    # feedbacks: aluno_id, treino_id (nullable), nota (int) / rating, comentario, criado_em
    ensure_columns("feedbacks", {
        "aluno_id": "UUID",
        "treino_id": "UUID",
        "nota": "INTEGER",
        "comentario": "TEXT",
        "criado_em": "TIMESTAMPTZ DEFAULT now()"
    })


def ensure_some_aluno():
    """
    Garante que exista ao menos um registro em 'alunos'. Retorna id do aluno criado / existente.
    Tenta formas diferentes de inserir dependendo de colunas disponíveis.
    """
    # 1) tenta pegar um aluno existente
    row = execute_query("SELECT id FROM alunos LIMIT 1", fetchone=True)
    if row:
        logger.info("Usando aluno existente: %s", row[0])
        return row[0]

    logger.info("Nenhum aluno encontrado — tentando criar um aluno de teste...")

    # Tentativas de inserção: várias formas para ser compatível com esquemas diferentes.
    attempts = [
        ("INSERT INTO alunos (id, nome, email) VALUES (gen_random_uuid(), %s, %s) RETURNING id",
         ("Aluno Teste", "teste@coreflowfit.local")),
        ("INSERT INTO alunos (nome, email) VALUES (%s, %s) RETURNING id",
         ("Aluno Teste", "teste@coreflowfit.local")),
        ("INSERT INTO alunos DEFAULT VALUES RETURNING id", ())
    ]

    for q, params in attempts:
        try:
            res = execute_query(q, params, fetchone=True)
            if res:
                logger.info("Aluno criado com sucesso: %s", res[0])
                return res[0]
        except Exception as e:
            logger.debug("Tentativa de criar aluno falhou (%s): %s", q, e)

    # Se ainda não conseguiu, tenta inserir com columns mínimos (fallback: criar via SQL dinâmico procurando colunas)
    logger.error("Falha ao criar aluno automaticamente. Verifique estrutura da tabela 'alunos'.")
    raise RuntimeError("Não foi possível criar/achar um registro em 'alunos'.")


def random_features_template():
    """Gera um dicionário de features realistas e variáveis."""
    idade = random.randint(16, 65)
    altura_m = round(random.uniform(1.50, 1.95), 2)
    peso_kg = round(random.uniform(50.0, 110.0), 1)
    cintura_cm = round(random.uniform(65, 120), 1)
    quadril_cm = round(random.uniform(80, 130), 1)
    braco_cm = round(random.uniform(25, 45), 1)
    perna_cm = round(random.uniform(45, 65), 1)
    chest_cm = round(random.uniform(80, 120), 1)
    nivel_atividade = random.choice(["sedentario", "leve", "moderado", "intenso"])
    dias_treino = random.randint(0, 6)
    objetivo = random.choice(["hipertrofia", "perda_peso", "manutencao", "forca"])
    retorno = {
        "idade": idade,
        "altura_m": altura_m,
        "peso_kg": peso_kg,
        "cintura_cm": cintura_cm,
        "quadril_cm": quadril_cm,
        "braco_cm": braco_cm,
        "perna_cm": perna_cm,
        "peito_cm": chest_cm,
        "nivel_atividade": nivel_atividade,
        "dias_treino_semana": dias_treino,
        "objetivo": objetivo,
    }
    return retorno


def insert_examples(count: int = 200):
    """
    Insere `count` exemplos em ia_feature_store e feedbacks.
    """
    aluno_id = ensure_some_aluno()
    logger.info("Inserindo %d exemplos de teste para aluno %s...", count, aluno_id)

    for i in range(count):
        features = random_features_template()
        model_version = f"test-v{random.randint(1,3)}"
        criado_em = datetime.utcnow() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))

        # Insere na ia_feature_store
        try:
            execute_query(
                "INSERT INTO ia_feature_store (aluno_id, features_json, model_version, criado_em) VALUES (%s, %s, %s, %s)",
                (aluno_id, json.dumps(features, ensure_ascii=False), model_version, criado_em)
            )
        except Exception as e:
            logger.exception("Erro ao inserir ia_feature_store: %s", e)
            raise

        # gera um feedback sintético coerente (0/1) ou nota 1-5;
        # estratégia simples: se peso/altura -> IMC; se IMC entre 20-25 -> positivo
        try:
            imc = None
            if features.get("altura_m") and features.get("peso_kg"):
                imc = features["peso_kg"] / (features["altura_m"] ** 2)

            if imc is not None:
                # nota 1..5 baseado em IMC (exemplo simplificado)
                if 18.5 <= imc <= 24.9:
                    nota = random.choice([4, 5])
                elif 25 <= imc <= 29.9:
                    nota = random.choice([3, 4])
                elif imc >= 30:
                    nota = random.choice([1, 2])
                else:
                    nota = random.choice([2, 3, 4])
            else:
                nota = random.randint(1, 5)

            comentario = random.choice([
                "Evoluiu bem", "Treino pesado, sentiu fadiga", "Precisa ajustar dieta",
                "Boa aderência", "Pouca consistência", ""
            ])

            execute_query(
                "INSERT INTO feedbacks (aluno_id, nota, comentario, criado_em) VALUES (%s, %s, %s, %s)",
                (aluno_id, int(nota), comentario, criado_em)
            )
        except Exception as e:
            logger.exception("Erro ao inserir feedback: %s", e)
            raise

        if (i + 1) % 50 == 0:
            logger.info("Inseridos %d/%d exemplos...", i + 1, count)

    logger.info("Inserção concluída: %d exemplos inseridos.", count)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=200, help="Quantidade de exemplos de teste a inserir")
    args = parser.parse_args()

    try:
        logger.info("Inserindo dados de teste no banco...")
        ensure_tables_ready()
        insert_examples(args.count)
        logger.info("Concluído com sucesso. Rode agora: python -m backend.ia.build_training_data_new")
    except Exception as e:
        logger.exception("Falha ao inserir dados de teste: %s", e)
        raise


if __name__ == "__main__":
    main()
