@echo off
chcp 65001 > nul
title NetPhantom CTF - Un Fantasma En El Sistema

echo =====================================================================
echo           NETPHANTOM CTF - GENERADOR DE LABORATORIOS CTF
echo                   Un Fantasma En El Sistema
echo             https://www.unfantasmaenelsistema.com/
echo =====================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado o no se encuentra en el PATH.
    echo Por favor descarga e instala Node.js (v18+) desde https://nodejs.org/
    pause
    exit /b 1
)

if not exist .env (
    echo [!] Primera ejecución detectada en este equipo.
    echo.
    echo Puedes usar NetPhantom con tu propia clave de Google Gemini para generar
    echo escenarios nuevos ilimitados con IA, o pulsar ENTER para usar el
    echo catálogo completo de escenarios incluidos (Modo Offline).
    echo.
    set /p USER_API_KEY=">> Introduce tu GEMINI_API_KEY (o pulsa ENTER para omitir): "
    echo.
    if "%USER_API_KEY%"=="" (
        echo GEMINI_API_KEY= > .env
        echo PORT=3000 >> .env
        echo [*] Configurado en Modo Offline (Catálogo Curado Activo).
    ) else (
        echo GEMINI_API_KEY=%USER_API_KEY% > .env
        echo PORT=3000 >> .env
        echo [*] Clave GEMINI_API_KEY guardada de forma segura en tu .env local.
    )
    echo.
)

if not exist node_modules (
    echo [*] Instalando dependencias necesarias (esto solo ocurre la primera vez)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Falló la instalación de paquetes npm.
        pause
        exit /b 1
    )
    echo.
)

echo [*] Iniciando servidor local en http://localhost:3000 ...
echo [*] Tu navegador se abrirá automáticamente en unos segundos.
echo [*] Para detener la aplicación, presiona Ctrl + C en esta ventana.
echo.

start http://localhost:3000
call npm run dev
pause
