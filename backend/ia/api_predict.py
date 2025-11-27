# backend/ia/predict_api.py
"""
FastAPI router para predição da IA.
- valida input com Pydantic
- carrega pipeline 'latest' em startup
- grava features em ia_feature_store e metrics em ia_metrics
"""

import os
import json
from typing import List, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

import joblib
import pandas as pd

try:
    from backend.database import execute_query
except Exception:
    from database import execute_query  # fallback

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
LATEST_MODEL_NAME = "feedback_predictor_pipeline.joblib"  # mesma usada no retrain.set_latest_symlink
LATEST_MODEL_PATH = os.path.join(MODELS_DIR, LATEST_MODEL_NAME)

router = APIRouter(prefix="/ia", tags=["ia"])

# ---------- Pydantic model: ajuste os campos conforme seu schema real ----------
class PredictRequest(BaseModel):
    aluno_id: str = Field(..., description="UUID do aluno")
    features: Dict[str, Any] = Field(..., description="Dicionário das features (chave: valor)")

class PredictResponse(BaseModel):
    aluno_id: str
    prediction: int
    proba: float
    model_version: str
    explanation: Dict[str, float] = None


# model holder
_PIPE = None
_MODEL_VERSION = None
_COLUMNS = None

def _load_latest_model():
    global _PIPE, _MODEL_VERSION, _COLUMNS
    if not os.path.exists(LATEST_MODEL_PATH):
        raise FileNotFoundError(f"Modelo latest não encontrado em {LATEST_MODEL_PATH}")
    _PIPE = joblib.load(LATEST_MODEL_PATH)
    # tentar ler versão a partir do caminho salvo em ia_model_info (se disponível)
    row = execute_query("SELECT versao, caminho_modelo, columns_json FROM ia_model_info WHERE caminho_modelo=%s LIMIT 1",
                        (LATEST_MODEL_PATH,), fetchone=True)
    if row:
        _MODEL_VERSION = row["versao"]
        try:
            _COLUMNS = json.loads(row["columns_json"] or "[]")
        except Exception:
            _COLUMNS = None
    else:
        _MODEL_VERSION = "unknown"
        _COLUMNS = None

@router.on_event("startup")
def startup_event():
    try:
        _load_latest_model()
        print("IA: modelo latest carregado:", _MODEL_VERSION)
    except Exception as e:
        print("Aviso: nao foi possivel carregar modelo latest:", e)


def _validate_and_build_df(features: Dict[str, Any], expected_cols: List[str] = None) -> pd.DataFrame:
    """
    Espera um dict features -> constrói DataFrame com colunas na ordem esperada.
    Se expected_cols fornecido, manter ordem e preencher colunas faltantes com NaN.
    """
    df = pd.DataFrame([features])
    if expected_cols:
        for c in expected_cols:
            if c not in df.columns:
                df[c] = pd.NA
        # manter apenas expected_cols na ordem correta
        df = df[expected_cols]
    return df


def _save_feature_store(aluno_id: str, features: Dict[str, Any], model_version: str):
    try:
        execute_query(
            "INSERT INTO ia_feature_store (aluno_id, features_json, model_version, criado_em) VALUES (%s, %s, %s, now())",
            (aluno_id, json.dumps(features, ensure_ascii=False), model_version)
        )
    except Exception as e:
        print("Aviso: falha ao gravar ia_feature_store:", e)


def _save_prediction_metric(model_version: str, metric_name: str, value: float, meta: Dict = None):
    try:
        execute_query(
            "INSERT INTO ia_metrics (model_version, metric_name, metric_value, meta_json, recorded_at) VALUES (%s, %s, %s, %s, now())",
            (model_version, metric_name, float(value), json.dumps(meta or {}, ensure_ascii=False))
        )
    except Exception as e:
        print("Aviso: falha ao gravar ia_metrics:", e)


# ---------- Endpoint ----------
@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    global _PIPE, _MODEL_VERSION, _COLUMNS
    if _PIPE is None:
        raise HTTPException(status_code=503, detail="Modelo não carregado no servidor.")

    # construir DataFrame
    df = _validate_and_build_df(req.features, expected_cols=_COLUMNS)
    try:
        proba = float(_PIPE.predict_proba(df)[:, 1][0]) if hasattr(_PIPE, "predict_proba") else 0.0
        pred = int(_PIPE.predict(df)[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao realizar previsão: {e}")

    # salvar features + contexto para auditoria
    _save_feature_store(req.aluno_id, req.features, _MODEL_VERSION)

    # salvar métrica simples (ex: count de inferências)
    _save_prediction_metric(_MODEL_VERSION, "inference_count", 1.0, meta={"aluno_id": req.aluno_id})

    # simples explanation placeholder (para SHAP, implementar rota extra)
    explanation = None

    return PredictResponse(
        aluno_id=req.aluno_id,
        prediction=pred,
        proba=proba,
        model_version=_MODEL_VERSION,
        explanation=explanation
    )
