#!/usr/bin/env python3
"""
train_lgbm_optuna.py
Treina LightGBM com Optuna usando GroupKFold e LabelEncoder.
"""
from __future__ import annotations
import argparse
import json
import logging
import sys
from pathlib import Path
from datetime import datetime

import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import LabelEncoder

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("train_optuna")

# --------------------------
# Optuna objective
# --------------------------
def create_objective(X, y, groups, n_splits=5):
    try:
        import lightgbm as lgb
        from sklearn.model_selection import GroupKFold
        from sklearn.metrics import f1_score
    except Exception as e:
        raise RuntimeError(f"Libs faltando: {e}")

    gkf = GroupKFold(n_splits=n_splits)

    def objective(trial):
        # Definição do espaço de busca
        params = {
            "objective": "multiclass",
            "metric": "multi_logloss",
            "verbosity": -1,
            "boosting_type": trial.suggest_categorical("boosting", ["gbdt", "dart"]),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            "num_leaves": trial.suggest_int("num_leaves", 16, 128),
            "min_data_in_leaf": trial.suggest_int("min_data_in_leaf", 5, 50),
            "feature_fraction": trial.suggest_float("feature_fraction", 0.4, 1.0),
            "bagging_fraction": trial.suggest_float("bagging_fraction", 0.4, 1.0),
            "bagging_freq": trial.suggest_int("bagging_freq", 0, 10),
            "lambda_l1": trial.suggest_float("lambda_l1", 0.0, 5.0),
            "lambda_l2": trial.suggest_float("lambda_l2", 0.0, 5.0),
            "num_class": len(np.unique(y)) 
        }

        scores = []
        # Loop de validação cruzada
        for train_idx, val_idx in gkf.split(X, y, groups=groups):
            X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
            
            # CORREÇÃO AQUI: y é numpy array, usa acesso direto []
            y_tr, y_val = y[train_idx], y[val_idx]

            dtrain = lgb.Dataset(X_tr, label=y_tr)
            dval = lgb.Dataset(X_val, label=y_val)

            gbm = lgb.train(
                params, 
                dtrain, 
                valid_sets=[dval], 
                num_boost_round=500,
                callbacks=[lgb.early_stopping(stopping_rounds=20, verbose=False)]
            )

            # Previsão
            preds = gbm.predict(X_val, num_iteration=gbm.best_iteration).argmax(axis=1)
            score = f1_score(y_val, preds, average="weighted")
            scores.append(score)

        return np.mean(scores) * -1.0 # Optuna minimiza

    return objective

# --------------------------
# Main
# --------------------------
def main(args):
    DATA_PATH = Path(args.data)
    if not DATA_PATH.exists():
        logger.error(f"Dataset não encontrado: {DATA_PATH}")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    logger.info(f"Dataset carregado: {df.shape}")

    if args.target not in df.columns:
        logger.error(f"Target '{args.target}' não encontrado.")
        sys.exit(1)

    # Separar Features e Target
    if "aluno_id" in df.columns:
        groups = df["aluno_id"]
        X = df.drop(columns=[args.target, "aluno_id"])
    else:
        logger.warning("Coluna 'aluno_id' não encontrada! Usando índice.")
        groups = df.index
        X = df.drop(columns=[args.target])
    
    y_raw = df[args.target]

    # Encoding do target
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    logger.info(f"Labels codificadas. Classes originais: {le.classes_}")

    # Limpeza final de tipos
    for c in X.columns:
        if X[c].dtype == 'object':
            X[c] = pd.to_numeric(X[c], errors='coerce').fillna(0)

    # Optuna
    import optuna
    import lightgbm as lgb
    
    logger.info(f"Iniciando Optuna ({args.trials} trials)...")
    objective = create_objective(X, y, groups, n_splits=args.n_splits)
    
    study = optuna.create_study(direction="minimize", sampler=optuna.samplers.TPESampler(seed=args.seed))
    study.optimize(objective, n_trials=args.trials, show_progress_bar=True)

    logger.info(f"Melhor F1 (aprox): {study.best_value * -1:.4f}")
    best_params = study.best_params

    # Treino Final
    logger.info("Treinando modelo final...")
    params = best_params.copy()
    params.update({
        "objective": "multiclass",
        "metric": "multi_logloss",
        "verbosity": -1,
        "num_class": len(le.classes_)
    })

    dtrain = lgb.Dataset(X, label=y)
    final_model = lgb.train(params, dtrain, num_boost_round=1000)

    # Salvar artefato COMPLETO (Modelo + Colunas + Classes)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    version = datetime.utcnow().strftime("v%Y%m%dT%H%M%SZ")
    artifact_path = out_dir / f"feedback_lgbm_optuna_{version}.joblib"
    
    joblib.dump({
        "model": final_model, 
        "columns": list(X.columns),
        "classes": le.classes_.tolist(),
        "model_type": "lightgbm"
    }, artifact_path)
    
    logger.info(f"Modelo salvo em: {artifact_path}")
    print(str(artifact_path))

# --------------------------
# CLI
# --------------------------
if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True)
    p.add_argument("--target", required=True)
    p.add_argument("--out", default="backend/ml")
    p.add_argument("--trials", type=int, default=30)
    p.add_argument("--n_splits", type=int, default=5)
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()
    main(args)