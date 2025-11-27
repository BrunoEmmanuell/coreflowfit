@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo =================================
echo  COREFLOWFIT - INICIO DO BACKEND
echo =================================

:: Configurar encoding para UTF-8
chcp 65001 > nul

:: Verifica se o ambiente virtual existe
if exist venv (
    echo [SETUP] Ambiente virtual ja existe.
) else (
    echo [SETUP] Criando ambiente virtual...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ FALHA na criacao do ambiente virtual.
        pause
        exit /b 1
    )
)

echo [SETUP] Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo [SETUP] Atualizando pip...
python -m pip install --upgrade pip --no-warn-script-location

echo [SETUP] Criando requirements.txt limpo...
(
echo fastapi==0.104.1
echo uvicorn==0.24.0
echo python-multipart==0.0.6
echo pydantic==2.5.0
echo pydantic-settings==2.1.0
echo slowapi==0.1.9
echo python-dotenv==1.0.0
echo sqlalchemy==2.0.23
echo psycopg2-binary==2.9.9
echo alembic==1.13.0
echo python-jose==3.3.0
echo passlib==1.7.4
echo bcrypt==4.1.2
echo cryptography==41.0.8
echo scikit-learn==1.3.2
echo pandas==2.1.3
echo numpy==1.25.2
echo joblib==1.3.2
echo redis==5.0.1
echo psutil==5.9.6
echo pytest==7.4.3
echo pytest-asyncio==0.21.1
echo requests==2.31.0
echo python-dateutil==2.8.2
echo click==8.1.7
echo Jinja2==3.1.2
) > requirements_temp.txt

echo [SETUP] Instalando dependencias basicas primeiro...
pip install setuptools wheel --no-warn-script-location

echo [SETUP] Instalando dependencias principais...
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-dotenv --no-warn-script-location

echo [SETUP] Instalando demais dependencias...
pip install -r requirements_temp.txt --no-warn-script-location

if errorlevel 1 (
    echo ❌ FALHA na instalacao de dependencias.
    echo [ALTERNATIVA] Instalando pacotes manualmente...
    
    pip install fastapi uvicorn sqlalchemy psycopg2-binary --no-warn-script-location
    pip install pydantic python-dotenv python-jose passlib bcrypt --no-warn-script-location
    pip install scikit-learn pandas numpy joblib --no-warn-script-location
    pip install redis psutil pytest requests --no-warn-script-location
)

echo [SETUP] Verificando instalacao...
python -c "import fastapi, sqlalchemy, pydantic; print('✅ Dependencias basicas OK')" 2>nul
if errorlevel 1 (
    echo ❌ Erro na verificacao das dependencias.
    pause
    exit /b 1
)

echo ✅ TODAS as dependencias instaladas com sucesso!

echo [SETUP] Iniciando servidor backend...
echo 🌐 Servidor disponivel em: http://localhost:8000
echo 📚 Docs disponiveis em: http://localhost:8000/docs
echo.

uvicorn backend.main:app --host 127.0.0.1 --port 8000

pause