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
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor descarga e instala Node.js LTS ^(v20.19+ o v22.12+^) desde https://nodejs.org/
    pause
    exit /b 1
)

if exist .env goto :env_ready

echo [!] Primera ejecucion detectada en este equipo.
echo.
echo Puedes usar NetPhantom con tu propia clave de Google Gemini para generar
echo escenarios nuevos ilimitados con IA, o pulsar ENTER para usar el
echo catalogo completo de escenarios incluidos (Modo Offline).
echo.

set "USER_API_KEY="
set /p "USER_API_KEY=>> Introduce tu GEMINI_API_KEY (o pulsa ENTER para omitir): "
echo.

if not "%USER_API_KEY%"=="" goto :save_key

REM Sin clave: modo offline con el catalogo de presets incluido.
(
    echo GEMINI_API_KEY=
    echo PORT=3000
    echo HOST=127.0.0.1
)>.env
echo [*] Configurado en Modo Offline ^(Catalogo Curado Activo^).
goto :env_done

:save_key
REM Se escribe el .env con PowerShell leyendo la variable de entorno
REM USER_API_KEY (heredada por el proceso hijo), en vez de "echo %%VAR%%".
REM Asi la clave se guarda literal aunque contenga caracteres especiales
REM de cmd.exe como & ^ %% o comillas.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$k = $env:USER_API_KEY; Set-Content -LiteralPath '.env' -Encoding utf8 -Value ('GEMINI_API_KEY=' + $k); Add-Content -LiteralPath '.env' -Encoding utf8 -Value 'PORT=3000'; Add-Content -LiteralPath '.env' -Encoding utf8 -Value 'HOST=127.0.0.1'"
if errorlevel 1 (
    echo [ERROR] No se pudo guardar tu clave automaticamente con PowerShell.
    echo Crea el archivo .env a mano a partir de .env.example y pega tu clave ahi.
    pause
    exit /b 1
)
echo [*] Clave GEMINI_API_KEY guardada de forma segura en tu .env local.

:env_done
echo.

:env_ready

if exist node_modules goto :deps_ready

echo [*] Instalando dependencias necesarias (esto solo ocurre la primera vez)...
if exist package-lock.json (
    call npm ci
) else (
    call npm install
)
if errorlevel 1 (
    echo [ERROR] Fallo la instalacion de paquetes npm.
    pause
    exit /b 1
)
echo.

:deps_ready

REM Lee el puerto configurado en .env (3000 si no se encuentra la linea).
set "NETPHANTOM_PORT=3000"
for /f "usebackq tokens=2 delims==" %%P in (`findstr /b /i "PORT=" ".env" 2^>nul`) do set "NETPHANTOM_PORT=%%P"

echo [*] Iniciando servidor local en http://localhost:%NETPHANTOM_PORT% ...
echo [*] El navegador se abrira automaticamente en cuanto el servidor responda.
echo [*] Para detener la aplicacion, presiona Ctrl + C en esta ventana.
echo.

REM Proceso en segundo plano, oculto, que solo abre el navegador cuando el
REM servidor realmente contesta a peticiones HTTP (hasta 60s de margen).
REM Nunca se abre el navegador "a ciegas" antes de que el servidor responda.
start "NetPhantom - esperando servidor" /min powershell -NoProfile -WindowStyle Hidden -Command ^
    "$port = $env:NETPHANTOM_PORT; $ok = $false; for ($i = 0; $i -lt 60; $i++) { try { Invoke-WebRequest -Uri ('http://127.0.0.1:' + $port + '/') -UseBasicParsing -TimeoutSec 1 | Out-Null; $ok = $true; break } catch { Start-Sleep -Seconds 1 } }; if ($ok) { Start-Process ('http://localhost:' + $port) }"

call npm run dev

pause
