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

## 📋 Requisitos

* **Node.js** v20.19+ o v22.12+ (necesario para Vite 8; versiones más antiguas no son compatibles). Descárgalo en [nodejs.org](https://nodejs.org/).
* **npm** (incluido con Node.js). El proyecto usa `npm`/`package-lock.json` como gestor único; no uses `bun`/`yarn`/`pnpm` para instalar.
* **Docker Engine + Docker Compose v2** — opcional, solo si quieres desplegar en tu máquina los laboratorios vulnerables que NetPhantom genera o exporta. La propia interfaz (generar escenarios, pistas, informes, certificado) funciona sin Docker.
* **Clave de Google Gemini** — opcional. Sin ella, NetPhantom funciona al 100% en **Modo Offline** con el catálogo de escenarios incluido (ver más abajo).

---

## 🛠️ Puesta en Marcha Manual

Si prefieres ejecutar los comandos manualmente:

```bash
# 1. Clonar el repositorio
git clone https://github.com/unfantasmaenelsistema/NetPhantom.git
cd NetPhantom

# 2. Instalar dependencias de Node.js (usa npm ci si existe package-lock.json)
npm ci

# 3. Crear el archivo de configuración a partir del ejemplo
cp .env.example .env

# 4. (Opcional) Editar .env con tu clave gratuita de Google AI Studio:
# GEMINI_API_KEY="AIzaSy..."

# 5. Iniciar en modo desarrollo
npm run dev
```

La aplicación estará disponible en `http://127.0.0.1:3000` (o el `PORT` que hayas configurado en `.env`).

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

Esta sección describe **solo lo que el código garantiza hoy**, no aspiraciones. Si encuentras algo que no se cumple, abre un issue.

* **Sin claves en el frontend**: la clave de Gemini solo vive en tu `.env` local y en el proceso del servidor; nunca se envía al navegador ni se guarda en `localStorage`/`cookies`. Todas las llamadas a la IA pasan por rutas del backend (`/api/*`).
* **Servidor local, no expuesto por defecto**: el servidor escucha en `127.0.0.1` (localhost) salvo que fijes explícitamente `HOST=0.0.0.0` en tu `.env` — algo que la app nunca necesita para su uso normal.
* **Límites básicos de abuso**: el tamaño del body JSON está limitado (`MAX_BODY_SIZE`, 1 MB por defecto) y las rutas que llaman a Gemini (`/api/generate-scenario`, `/api/chat`, `/api/generate-machine-art`) aplican un límite de peticiones por IP (20/min). Esto es una protección básica para uso local, no un WAF ni defensa frente a tráfico adversarial a gran escala.
* **Exportaciones e importaciones saneadas**: los informes HTML, el certificado y los escenarios `.json`/`.yaml` importados escapan los valores dinámicos (nombre del alumno, banderas, pistas...) antes de inyectarlos en HTML, para evitar XSS al abrir un informe exportado o al importar un reto compartido por otra persona.
* **Validación del `docker-compose.yml` generado o importado**: tanto la salida de Gemini como cualquier `.json`/`.yaml` que importes pasan por un validador (`src/utils/dockerSecurity.ts`) que rechaza `privileged: true`, `network_mode`/`pid`/`ipc: host`, montar rutas del host (incluido `/var/run/docker.sock`) y capabilities (`cap_add`) fuera de una lista mínima permitida. Si algo no pasa la validación, se sustituye por una plantilla segura (o se descarta la respuesta de la IA y se usa el catálogo offline) en vez de servir una configuración peligrosa.
* **Puertos de laboratorio en localhost**: los `docker-compose.yml` que genera NetPhantom publican los puertos como `127.0.0.1:HOST:CONTENEDOR`, no `0.0.0.0`, así que las máquinas vulnerables no quedan expuestas a tu red local salvo que lo cambies tú mismo a propósito.

### ⚠️ Lo que esta app NO garantiza

* **Las máquinas CTF son deliberadamente vulnerables.** Están pensadas para ejecutarse en local, con Docker, en una máquina que tú controlas — nunca en un servidor compartido, en producción, ni accesible desde Internet.
* No hay aislamiento reforzado tipo sandbox/gVisor/Kata frente a un *container breakout* sofisticado: la contención es la que ofrece Docker por defecto más los límites de capacidades que NetPhantom añade (`cap_drop: [ALL]` + el mínimo `cap_add` necesario cuando el reto lo exige), no una barrera infranqueable.
* El rate limiting y el límite de body son una protección básica pensada para un único usuario local, no para exponer el servicio a terceros.
* El certificado de superación es **autoemitido y generado en tu navegador**: no es una acreditación oficial ni de terceros (ver el propio diploma, que ya lo indica).

---

## ⚠️ Limitaciones Reales

* **Solo 1 de los 16 escenarios del catálogo offline tiene un laboratorio Docker totalmente funcional** (`FSOCIETY_E_CORP_01`, inspirado en Mr. Robot). Los otros 15 son plantillas narrativas completas (historia, pistas, topología, banderas) pero su contenedor no instala ningún servicio explotable real — la interfaz los marca como **"Plantilla · sin servicio vulnerable"**. Puedes usarlos para practicar el flujo de la app (pistas, banderas, informe, certificado) o como punto de partida para montar tú el servicio.
* Los escenarios generados con **IA (Gemini)** sí incluyen, por diseño del prompt, un `Dockerfile`/`provisionScript` que instala y arranca un servicio real — pero es contenido generado por un modelo de lenguaje: revísalo antes de confiar en él para una clase o evaluación.
* El **certificado de superación es autoemitido**: se genera en tu navegador a partir de datos que tú mismo controlas (nombre, banderas validadas localmente). No es una acreditación oficial ni verificable por terceros.
* El **rate limiting y el límite de tamaño de body** del servidor son una protección básica para uso local en un único equipo, no defensas pensadas para exponer el servicio a Internet o a múltiples usuarios no confiables.
* NetPhantom **no se ha probado con Docker real durante esta revisión** (el entorno de desarrollo usado no tenía Docker disponible). Las validaciones de `docker-compose.yml` (ver `src/utils/dockerSecurity.ts`) se probaron a nivel de código, pero el despliegue real de los laboratorios generados no se verificó de extremo a extremo — pruébalo tú antes de usarlo en clase.

## ✅ Uso Responsable

NetPhantom genera **máquinas deliberadamente vulnerables** con fines educativos. Por favor:

* Despliega los laboratorios **solo en local y en redes aisladas** (tu propio equipo, una VM o un entorno de laboratorio controlado) — nunca en un servidor compartido, en producción, ni expuesto a Internet.
* No practiques técnicas de explotación contra sistemas que no sean tuyos o para los que no tengas autorización explícita.
* Si eres instructor/a, revisa el contenido generado por IA antes de distribuirlo a tus alumnos: ni el guion narrativo ni el código de aprovisionamiento están auditados por un humano por defecto.

---

## 🌐 Créditos y Comunidad

Desarrollado para la comunidad de entusiastas de la seguridad informática y el hacking ético:
* **Web Oficial**: [https://www.unfantasmaenelsistema.com](https://www.unfantasmaenelsistema.com)
* **Tienda (GhostApps)**: [https://ghostore.unfantasmaenelsistema.com](https://ghostore.unfantasmaenelsistema.com)
* **Academia**: [https://ghostacademy.unfantasmaenelsistema.com](https://ghostacademy.unfantasmaenelsistema.com)
* **Canal y Recursos**: Seguridad Informática, CTFs, Análisis Forense, DevSecOps y Hacking Ético.
* **Licencia**: [MIT](LICENSE)
* **Seguridad**: ¿encontraste un problema de seguridad en la app? Consulta [SECURITY.md](SECURITY.md).
