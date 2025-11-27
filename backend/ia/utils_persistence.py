# backend/ia/utils_persistence.py
import os
import json
import uuid
from datetime import datetime
import joblib

try:
    from backend.database import execute_query
except Exception:
    from database import execute_query  # noqa

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def persist_pipeline(pipeline, columns, name="coreflowfit_feedback"):
    """
    Persiste pipeline (joblib) e registra meta no banco (ia_model_info).
    Retorna (version, path).
    """
    version = datetime.utcnow().strftime("%Y%m%d%H%M%S") + "-" + uuid.uuid4().hex[:6]
    filename = f"{name}_{version}.joblib"
    path = os.path.join(MODELS_DIR, filename)

    joblib.dump(pipeline, path)

    try:
        execute_query(
            """
            INSERT INTO ia_model_info (nome, versao, caminho_modelo, columns_json, criado_em)
            VALUES (%s, %s, %s, %s, now())
            """,
            (name, version, path, json.dumps(columns, ensure_ascii=False))
        )
    except Exception as e:
        print("Aviso: falha ao registrar ia_model_info:", e)

    return version, path


def set_latest_copy(versioned_path, latest_name="feedback_predictor_pipeline.joblib"):
    """
    Cria/atualiza uma cópia 'latest' do modelo (cópia física).
    """
    latest_path = os.path.join(MODELS_DIR, latest_name)
    try:
        obj = joblib.load(versioned_path)
        joblib.dump(obj, latest_path)
    except Exception as e:
        print("Aviso: falha ao criar latest copy:", e)
    return latest_path
