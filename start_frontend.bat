@echo off
echo ============================================
echo   Iniciando CoreFlowFit Frontend (Vite)
echo ============================================
echo.

REM Ir para a pasta correta do frontend
cd /d "%~dp0frontend"

if not exist package.json (
    echo ERRO: A pasta frontend nao foi encontrada!
    pause
    exit /b
)

echo Instalando dependencias...
npm install

echo Iniciando servidor Vite...
npm run dev

pause
