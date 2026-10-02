#!/usr/bin/env bash

# NetPhantom CTF - Lanzador Rápido para Linux y macOS
# Un Fantasma En El Sistema - https://www.unfantasmaenelsistema.com/

set -e

echo "====================================================================="
echo "          NETPHANTOM CTF - GENERADOR DE LABORATORIOS CTF"
echo "                  Un Fantasma En El Sistema"
echo "            https://www.unfantasmaenelsistema.com/"
echo "====================================================================="
echo ""

# Verificar Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js no está instalado en tu sistema."
    echo "Por favor instala Node.js (v18 o superior) desde https://nodejs.org/"
    exit 1
fi

# Configuración inicial del archivo .env si no existe
if [ ! -f .env ]; then
    echo "[!] Primera ejecución detectada."
    echo ""
    echo "Puedes usar NetPhantom con tu clave de Google Gemini para diseñar"
    echo "retos con IA, o presionar ENTER para usar el catálogo offline incluido."
    echo ""
    read -p ">> Introduce tu GEMINI_API_KEY (o presiona ENTER para omitir): " user_key
    echo ""

    if [ -z "$user_key" ]; then
        echo "GEMINI_API_KEY=" > .env
        echo "PORT=3000" >> .env
        echo "[*] Configurado en Modo Offline (Catálogo Curado Activo)."
    else
        echo "GEMINI_API_KEY=${user_key}" > .env
        echo "PORT=3000" >> .env
        echo "[*] Clave GEMINI_API_KEY guardada de forma segura en tu .env local."
    fi
    echo ""
fi

# Instalar dependencias si no existen
if [ ! -d node_modules ]; then
    echo "[*] Instalando dependencias de Node.js (solo la primera vez)..."
    npm install
    echo ""
fi

echo "[*] Iniciando servidor local en http://localhost:3000 ..."
echo "[*] Abre http://localhost:3000 en tu navegador."
echo "[*] Para detener el servidor presiona Ctrl + C."
echo ""

# Intentar abrir el navegador automáticamente según SO
if command -v xdg-open >/dev/null 2>&1; then
    (sleep 2 && xdg-open http://localhost:3000 >/dev/null 2>&1) &
elif command -v open >/dev/null 2>&1; then
    (sleep 2 && open http://localhost:3000 >/dev/null 2>&1) &
fi

npm run dev
