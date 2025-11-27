@echo off
chcp 65001 >nul
echo ========================================================
echo      🤖 COREFLOWFIT: PIPELINE DE TREINO AUTOMATICO
echo ========================================================
echo.

:: 0. RESET TOTAL DO BANCO (IMPORTANTE: Aplica o novo Schema)
echo [0/5] Resetando Banco de Dados (Aplicando novo Schema)...
py -m backend.reset_db
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao resetar o banco. Verifique se o Postgres esta rodando.
    pause
    exit /b %ERRORLEVEL%
)
echo.

:: 1. LIMPEZA DE ARTEFATOS ANTIGOS
echo [1/5] Limpando modelos antigos temporarios...
if exist "backend\ml\feedback_lgbm_optuna_*.joblib" (
    del "backend\ml\feedback_lgbm_optuna_*.joblib"
    echo    - Arquivos antigos removidos.
) else (
    echo    - Pasta limpa.
)
echo.

:: 2. RECRIAR TABELAS (SCHEMA)
echo [2/5] Criando tabelas novas...
py -m backend.database
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao criar tabelas.
    pause
    exit /b %ERRORLEVEL%
)
echo.

:: 3. POPULAR BANCO DE DADOS (SEED)
echo [3/5] Gerando 750 alunos e treinos (Isso deve ser rapido agora)...
py -m backend.seed_db_ml
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro no Seed.
    pause
    exit /b %ERRORLEVEL%
)
echo.

:: 4. PREPARAR DADOS E TREINAR
echo [4/5] Extraindo dados e Treinando IA...
py -m backend.ml.data_preparation
py -m backend.ia.train_lgbm_optuna --data backend/ml/prepared_training_data.csv --target feedback_score --out backend/ml --trials 30
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro no Treinamento.
    pause
    exit /b %ERRORLEVEL%
)
echo.

:: 5. DEPLOY
echo [5/5] Fazendo Deploy do modelo...
if exist "backend\ml\feedback_lgbm_optuna_*.joblib" (
    move /Y "backend\ml\feedback_lgbm_optuna_*.joblib" "backend\ml\feedback_predictor_model.joblib" >nul
    echo ✅ SUCESSO! Novo modelo ativo em: backend\ml\feedback_predictor_model.joblib
) else (
    echo ❌ Erro: Modelo novo nao encontrado.
)

echo.
echo ========================================================
echo      🎉 PROCESSO CONCLUIDO! AGORA SIM, TUDO LIMPO.
echo ========================================================
pause