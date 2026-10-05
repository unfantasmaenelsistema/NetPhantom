#!/usr/bin/env bash

# NetPhantom CTF - Lanzador Rápido para Linux y macOS
# Un Fantasma En El Sistema - https://www.unfantasmaenelsistema.com/

set -euo pipefail

echo "====================================================================="
echo "          NETPHANTOM CTF - GENERADOR DE LABORATORIOS CTF"
echo "                  Un Fantasma En El Sistema"
echo "            https://www.unfantasmaenelsistema.com/"
echo "====================================================================="
echo ""

# Verificar Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js no está instalado en tu sistema."
    echo "Por favor instala Node.js LTS (v20.19+ o v22.12+) desde https://nodejs.org/"
    exit 1
fi

node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "${node_major}" -lt 20 ]; then
    echo "[AVISO] Se detectó Node.js v${node_major}.x. NetPhantom requiere Node.js v20.19+ o v22.12+."
    echo "        La instalación de dependencias podría fallar; considera actualizar Node."
    echo ""
fi

# Configuración inicial del archivo .env si no existe
if [ ! -f .env ]; then
    echo "[!] Primera ejecución detectada."
    echo ""
    echo "Puedes usar NetPhantom con tu clave de Google Gemini para diseñar"
    echo "retos con IA, o presionar ENTER para usar el catálogo offline incluido."
    echo ""
    read -r -p ">> Introduce tu GEMINI_API_KEY (o presiona ENTER para omitir): " user_key
    echo ""

    # printf (no "echo $user_key") conserva la clave literal, incluso si
    # contiene espacios o caracteres especiales de shell.
    {
        printf 'GEMINI_API_KEY=%s\n' "${user_key}"
        printf 'PORT=3000\n'
        printf 'HOST=127.0.0.1\n'
    } > .env

    if [ -z "${user_key}" ]; then
        echo "[*] Configurado en Modo Offline (Catálogo Curado Activo)."
    else
        echo "[*] Clave GEMINI_API_KEY guardada de forma segura en tu .env local."
    fi
    echo ""
fi

# Instalar dependencias si no existen
if [ ! -d node_modules ]; then
    echo "[*] Instalando dependencias de Node.js (solo la primera vez)..."
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
    echo ""
fi

# Puerto configurado en .env (3000 por defecto si no hay línea PORT=)
port_value="$(grep -E '^PORT=' .env 2>/dev/null | tail -n1 | cut -d'=' -f2-)"
port_value="${port_value:-3000}"

echo "[*] Iniciando servidor local en http://localhost:${port_value} ..."
echo "[*] El navegador se abrirá automáticamente en cuanto el servidor responda."
echo "[*] Para detener el servidor presiona Ctrl + C."
echo ""

# Abre el navegador solo cuando el servidor realmente contesta peticiones
# HTTP (hasta 60s de margen), nunca "a ciegas" con un sleep fijo.
open_when_ready() {
    local url="http://127.0.0.1:${port_value}/"
    local i
    for i in $(seq 1 60); do
        if curl -fsS -o /dev/null "${url}" 2>/dev/null; then
            if command -v xdg-open >/dev/null 2>&1; then
                xdg-open "http://localhost:${port_value}" >/dev/null 2>&1 || true
            elif command -v open >/dev/null 2>&1; then
                open "http://localhost:${port_value}" >/dev/null 2>&1 || true
            fi
            return 0
        fi
        sleep 1
    done
}

if command -v curl >/dev/null 2>&1; then
    open_when_ready &
    bg_pid=$!
    trap '[ -n "${bg_pid:-}" ] && kill "${bg_pid}" 2>/dev/null || true' EXIT
else
    echo "[AVISO] 'curl' no está disponible: abre http://localhost:${port_value} manualmente."
fi

npm run dev
