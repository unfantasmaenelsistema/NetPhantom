# 👻 NetPhantom CTF - Generador Dinámico de Escenarios y Laboratorios de Ciberseguridad

[![Un Fantasma En El Sistema](https://img.shields.io/badge/Comunidad-Un%20Fantasma%20En%20El%20Sistema-06b6d4.svg)](https://www.unfantasmaenelsistema.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Docker Support](https://img.shields.io/badge/Docker-Compose%20Ready-2496ED.svg)](https://www.docker.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Dynamic-8E75C2.svg)](https://aistudio.google.com/)

Plataforma interactiva para la creación, visualización, auditoría y despliegue local de **laboratorios de hacking ético y competiciones CTF (Capture The Flag)**, ambientados en universos de ciencia ficción, series de televisión, cyberpunk y terror informático.

Diseñado por y para la comunidad de **[Un Fantasma En El Sistema](https://www.unfantasmaenelsistema.com/)**.

---

## ✨ Características Principales

* 📤 **Importador & Exportador de Retos (*Drag & Drop*)**: Diseñado para profesores, instructores y alumnos. Permite guardar la definición íntegra del reto en formato `.json` o `.yaml` e importar cualquier reto con solo arrastrar y soltar el archivo en la pantalla o pegando su contenido.
* 🐳 **Despliegue Local con Docker Compose**: Generación instantánea de archivos `docker-compose.yml`, `Dockerfile` y scripts `provision.sh` listos para levantar máquinas vulnerables en una red bridge aislada con límites de CPU y RAM.
* 💻 **Terminal Interactiva Simulada (*Web Shell Playground*)**: Emulador de terminal Kali Linux para practicar comandos de reconocimiento y explotación (`nmap`, `curl`, `smbclient`, `gobuster`, `ping`, `ssh`) con respuestas hiperrealistas parametrizadas según los puertos, servicios y banderas del escenario.
* 🛡️ **Mapeo a Estándares de la Industria (MITRE ATT&CK® & OWASP Top 10)**: Taxonomía oficial con técnicas clasificadas (ej. `T1190`, `T1548.001`, `A03:2021-Injection`, debilidades `CWE-94`), enlaces directos a matrices de conocimiento y exportación técnica en Markdown.
* 🧮 **Calculadora de Severidad Oficial CVSS v3.1**: Desglose interactivo con la especificación matemática de FIRST.org (Vector de Ataque, Complejidad, Privilegios, Alcance, Confidencialidad, Integridad, Disponibilidad), cálculo en tiempo real de puntuaciones Base/Explotabilidad/Impacto y generación de vector string.
* 📄 **Dossier Ejecutivo en PDF & HTML Autónomo**: Exportación instantánea de informes de auditoría técnica con diseño editorial profesional (formato A4 maquetado, topología, matriz de puertos, vectores de ataque, banderas criptográficas y guía paso a paso).
* 🚩 **Comprobador de Banderas en Vivo (*Live Flag Checker*)**: Sistema interactivo con animaciones de éxito, detección de errores (*shake effect*), cálculo de puntos y modo antispoiler para validar `user.txt` y `root.txt`.
* 🏆 **Panel de Progreso & Nivel del Usuario (*UserDashboardView*)**: Seguimiento integral del aprendizaje gamificado con cálculo de nivel y rangos (desde *Recluta Novato* hasta *Fantasma del Sistema*), barra de progreso global con puntos de experiencia (XP), contador de tiempo en vivo por sesión y registro histórico de duración dedicada a cada laboratorio con filtros interactivos.
* 🎓 **Generador de Certificados de Superación (Diploma CTF Oficial)**: Al validar exitosamente ambas banderas (`user.txt` y `root.txt`), se desbloquea una celebración con confeti interactivo y un modal para emitir tu diploma oficial en PDF (formato A4 apaisado maquetado) o HTML autónomo, personalizado con tu nombre o alias, fecha de auditoría y sello criptográfico de verificación SHA-256 único.
* 🤖 **Motor de IA con Autodescubrimiento Dinámico**: Conexión inteligente con la API de Google Gemini. Detecta automáticamente los modelos activos más modernos y utiliza una cascada de resiliencia (*fallbacks*) para que la aplicación **nunca falle aunque Google retire o actualice versiones de modelos**.
* 🛡️ **Seguridad Total en GitHub**: Tu clave privada se mantiene **exclusivamente en tu archivo local `.env`**; el archivo `.gitignore` bloquea cualquier subida accidental de tus secretos a repositorios públicos.
* 📦 **Modo Offline y Catálogo Curado**: Funciona al 100% sin necesidad de configurar claves API gracias a su biblioteca integrada de retos predefinidos (*Mr. Robot, Severance, Blade Runner, Breaking Bad, Cyberpunk, The Matrix, etc.*).
* 🐍 **Script de Verificación en Python**: Generación automática de exploits/scripts de auditoría independientes usando `requests` y `pwntools`.
* 🗺️ **Topología de Red Visual**: Diagrama de arquitectura interactivo (Kali Attacker ➔ Firewall DMZ ➔ Target ➔ Bóveda interna).
* 💡 **Sistema de Pistas Progresivas**: Pistas en 3 niveles escalonados (Empujón Conceptual ➔ Pista Táctica ➔ Vector Dirigido).
* 🎓 **Mentor CTF con IA**: Chat interactivo con roles especializados (Arquitecto de Retos, Ingeniero DevSecOps, Auditor Ofensivo y Creador de Pistas).

---

## 🚀 Puesta en Marcha Rápida (1 Clic)

No necesitas conocimientos avanzados de terminal ni configurar variables a mano.

### En Windows:
1. Descarga o clona este repositorio.
2. Haz **doble clic en `iniciar.bat`**.
3. El script configurará automáticamente tu entorno e iniciará la aplicación en `http://localhost:3000`.

### En Linux o macOS:
1. Abre tu terminal en la carpeta del proyecto.
2. Ejecuta el script de inicio:
   ```bash
   ./iniciar.sh
   ```
3. El script detectará si es tu primera vez, preparará la configuración y abrirá tu navegador.

---

## 🛠️ Puesta en Marcha Manual

Si prefieres ejecutar los comandos manualmente:

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/netphantom-ctf.git
cd netphantom-ctf

# 2. Instalar dependencias de Node.js
npm install

# 3. Crear el archivo de configuración a partir del ejemplo
cp .env.example .env

# 4. (Opcional) Editar .env con tu clave gratuita de Google AI Studio:
# GEMINI_API_KEY="AIzaSy..."

# 5. Iniciar en modo desarrollo
npm run dev
```

La aplicación estará disponible inmediatamente en `http://localhost:3000`.

---

## 🔑 ¿Cómo obtener una clave gratuita de Google Gemini?

1. Entra en **[Google AI Studio](https://aistudio.google.com/)**.
2. Inicia sesión con cualquier cuenta de Google.
3. Haz clic en **«Get API key»** y luego en **«Create API key»**.
4. Copia tu clave y pégala en tu archivo local `.env`:
   ```env
   GEMINI_API_KEY="pega_aqui_tu_clave"
   PORT=3000
   ```
> ℹ️ **Nota**: El uso para desarrollo y aprendizaje con Google AI Studio es completamente **gratuito**.

---

## 🐳 ¿Cómo desplegar una máquina vulnerable en tu máquina?

Una vez diseñado o seleccionado un escenario en NetPhantom:

1. Ve a la pestaña **Docker Compose** o haz clic en **«Exportar Laboratorio (.ZIP)»**.
2. Descomprime los archivos en una carpeta de tu ordenador.
3. Abre una terminal en esa carpeta y ejecuta:
   ```bash
   docker compose up --build -d
   ```
4. Comprueba la conectividad con tu máquina atacante o navegador:
   ```bash
   curl -i http://localhost:8080/
   ```
5. ¡Comienza la auditoría y captura las banderas!

---

## 📁 Estructura del Proyecto

```text
├── iniciar.bat             # Lanzador automático de 1 clic para Windows
├── iniciar.sh              # Lanzador automático de 1 clic para Linux/macOS
├── .env.example            # Plantilla pública segura sin claves expuestas
├── .gitignore              # Protección activa contra filtración de claves
├── server.ts               # Servidor backend Express con Autodescubrimiento de Modelos
├── src/
│   ├── components/         # Componentes modulares React (Header, FlagChecker, Topología, etc.)
│   ├── App.tsx             # Aplicación principal y gestión de estado
│   └── main.tsx            # Punto de entrada frontend
└── package.json            # Dependencias y scripts de construcción
```

---

## 🔒 Arquitectura de Seguridad

* **Sin claves en el frontend**: Siguiendo las directrices estrictas de seguridad de Google y OWASP, la clave API nunca se expone en la interfaz web ni en el almacenamiento del navegador del cliente (`localStorage`/`cookies`).
* **Proxy de Servidor Seguro**: Todas las solicitudes a la IA se gestionan mediante rutas del backend (`/api/*`), manteniendo tus secretos a salvo de extensiones de navegador y ataques de inspección.
* **Aislamiento de Contenedores**: Todos los entornos CTF se definen en redes puente (`bridge`) aisladas sin privilegios de red sobre tu máquina anfitriona.

---

## 🌐 Créditos y Comunidad

Desarrollado para la comunidad de entusiastas de la seguridad informática y el hacking ético:
* **Web Oficial**: [https://www.unfantasmaenelsistema.com/](https://www.unfantasmaenelsistema.com/)
* **Canal y Recursos**: Seguridad Informática, CTFs, Análisis Forense, DevSecOps y Hacking Ético.
