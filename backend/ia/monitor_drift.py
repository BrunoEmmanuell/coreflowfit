# backend/ia/monitor_drift.py
"""
Monitor simples de drift por feature.

Fluxo:
 - tenta carregar stats de referência da tabela ia_datasets (busca dataset mais recente)
 - se não houver ia_datasets, tenta construir referência usando amostra histórica da ia_feature_store
 - calcula stats (mean, std) do batch RECENTE (últimos N dias) no ia_feature_store
 - compara mean relativo (|mean_new - mean_ref| / (|mean_ref|+eps))
 - se diferença > threshold -> registra métrica/alerta em ia_metrics

Rodar manual:
python -m backend.ia.monitor_drift
"""
import os
import json
from datetime import datetime, timedelta

import pandas as pd
import numpy as np

try:
    from backend.database import execute_query
except Exception:
    from database import execute_query  # noqa

# Configurações
LOOKBACK_DAYS = int(os.getenv("DRIFT_LOOKBACK_DAYS", "3"))  # período recente a comparar
THRESHOLD = float(os.getenv("DRIFT_THRESHOLD", "0.25"))    # diferença relativa para alertar (25%)
MAX_ROWS_FETCH = int(os.getenv("DRIFT_MAX_ROWS", "5000"))  # limite de linhas lidas do feature store
MODEL_NAME = os.getenv("DRIFT_MODEL_NAME", "coreflowfit_feedback")


def fetch_latest_model_version():
    """Pega a versão mais recente em ia_model_info para o nome do modelo"""
    row = execute_query(
        "SELECT versao, caminho_modelo, columns_json FROM ia_model_info WHERE nome=%s ORDER BY criado_em DESC LIMIT 1",
        (MODEL_NAME,),
        fetchone=True
    )
    if not row:
        return None
    return {"version": row["versao"], "path": row["caminho_modelo"], "columns": json.loads(row["columns_json"] or "[]")}


def fetch_dataset_stats_from_ia_datasets(version):
    """
    Tenta buscar estatísticas salvas em ia_datasets.meta_json para a versão.
    Espera-se que meta_json contenha algo similar a {'stats': {'feature1': {'mean':..,'std':..}, ...}}
    """
    row = execute_query(
        "SELECT meta_json FROM ia_datasets WHERE versao=%s ORDER BY criado_em DESC LIMIT 1",
        (version,),
        fetchone=True
    )
    if not row:
        return None
    try:
        meta = json.loads(row["meta_json"] or "{}")
        return meta.get("stats")
    except Exception:
        return None


def fetch_recent_features_from_feature_store(since_dt):
    """
    Lê features brutas da ia_feature_store para o período desde `since_dt`.
    Assumimos que ia_feature_store tem: aluno_id, features_json (json), criado_em.
    Retorna DataFrame com colunas numéricas.
    """
    sql = """
    SELECT features_json
    FROM ia_feature_store
    WHERE criado_em >= %s
    ORDER BY criado_em DESC
    LIMIT %s
    """
    rows = execute_query(sql, (since_dt, MAX_ROWS_FETCH), fetchall=True)
    if not rows:
        return pd.DataFrame()
    # extrair json em DataFrame
    list_feat = []
    for r in rows:
        try:
            obj = json.loads(r["features_json"]) if isinstance(r["features_json"], str) else r["features_json"]
            list_feat.append(obj)
        except Exception:
            continue
    if not list_feat:
        return pd.DataFrame()
    df = pd.json_normalize(list_feat)
    return df


def compute_numeric_stats(df):
    """Para cada coluna numérica: mean e std"""
    stats = {}
    num = df.select_dtypes(include=["number"])
    for c in num.columns:
        col = num[c].dropna()
        if col.shape[0] == 0:
            continue
        stats[c] = {"mean": float(col.mean()), "std": float(col.std() if col.shape[0] > 1 else 0.0)}
    return stats


def log_drift_metrics(model_version, drifted_cols):
    """
    Registra um resumo em ia_metrics. Também salva detalhes em meta_json.
    """
    meta = {"drifted_columns": drifted_cols, "checked_at": datetime.utcnow().isoformat()}
    try:
        execute_query(
            "INSERT INTO ia_metrics (model_version, metric_name, metric_value, meta_json, recorded_at) VALUES (%s,%s,%s,%s, now())",
            (model_version, "drift_check", float(len(drifted_cols)), json.dumps(meta, ensure_ascii=False))
        )
    except Exception as e:
        print("Aviso: falha ao gravar drift metric:", e)


def compare_stats_and_alert(ref_stats, new_stats, threshold=THRESHOLD):
    drifted = []
    eps = 1e-9
    for feat, ref in (ref_stats or {}).items():
        if feat not in new_stats:
            continue
        new = new_stats[feat]
        # evitar divisão por zero: denom = abs(ref_mean) or 1
        ref_mean = ref.get("mean", 0.0)
        new_mean = new.get("mean", 0.0)
        denom = abs(ref_mean) if abs(ref_mean) > eps else (abs(new_mean) if abs(new_mean) > eps else 1.0)
        rel_diff = abs(new_mean - ref_mean) / denom
        if rel_diff > threshold:
            drifted.append({"feature": feat, "ref_mean": ref_mean, "new_mean": new_mean, "rel_diff": rel_diff})
    return drifted


def run_check():
    print("Iniciando monitor_drift...")
    info = fetch_latest_model_version()
    if not info:
        print("Nenhum modelo encontrado em ia_model_info. Abortando.")
        return

    model_version = info["version"]
    print("Modelo alvo:", model_version)

    # 1) tentar buscar stats de referência em ia_datasets
    ref_stats = fetch_dataset_stats_from_ia_datasets(model_version)
    if ref_stats:
        print("Referência encontrada em ia_datasets")
    else:
        print("Sem stats em ia_datasets -> tentando construir referência histórica (últimos 30 dias)")
        # tenta construir referência média a partir do feature store (30 dias)
        since_ref = datetime.utcnow() - timedelta(days=30)
        df_ref = fetch_recent_features_from_feature_store(since_ref)
        if df_ref.empty:
            print("Sem dados históricos suficientes para referência. Abortando.")
            return
        ref_stats = compute_numeric_stats(df_ref)

    # 2) coletar batch recente
    since_recent = datetime.utcnow() - timedelta(days=LOOKBACK_DAYS)
    df_recent = fetch_recent_features_from_feature_store(since_recent)
    if df_recent.empty:
        print("Sem dados recentes no ia_feature_store. Nada a fazer.")
        return
    new_stats = compute_numeric_stats(df_recent)

    # 3) comparar
    drifted = compare_stats_and_alert(ref_stats, new_stats, threshold=THRESHOLD)
    if drifted:
        print(f"Drift detectado em {len(drifted)} colunas. Registrando métrica.")
    else:
        print("Nenhum drift detectado.")

    # 4) log em ia_metrics
    log_drift_metrics(model_version, drifted)

    # opcional: salvar detalhes completos em uma tabela de alertas (não implementado)
    return drifted


if __name__ == "__main__":
    drifted = run_check()
    print("Fim do monitor. Drifted:", drifted)
