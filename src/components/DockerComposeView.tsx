import React, { useState } from 'react';
import { Layers, Download, Copy, Check, Terminal, Play, Server, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { isTemplateOnlyPreset } from '../utils/labStatus';

interface DockerComposeViewProps {
  dockerCompose: string;
  dockerfile: string;
  provisionScript: string;
  codename: string;
  ip: string;
}

export const DockerComposeView: React.FC<DockerComposeViewProps> = ({
  dockerCompose,
  dockerfile,
  provisionScript,
  codename,
  ip,
}) => {
  const [copiedCompose, setCopiedCompose] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopyCompose = async () => {
    try {
      await navigator.clipboard.writeText(dockerCompose);
      setCopiedCompose(true);
      setTimeout(() => setCopiedCompose(false), 2000);
    } catch (err) {
      console.error('Failed to copy docker-compose:', err);
    }
  };

  const handleCopyCommand = async (cmd: string, id: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
  };

  const handleDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isTemplateOnly = isTemplateOnlyPreset(codename);

  return (
    <div className="space-y-6">
      {isTemplateOnly && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl border border-amber-800/60 bg-amber-950/30 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">Plantilla sin servicio vulnerable.</strong>
            Este preset del catálogo offline no instala ningún servicio explotable: el contenedor solo
            levanta una shell base de Debian (<code className="text-amber-200">CMD ["/bin/bash"]</code>). Úsalo para
            practicar el flujo de topología, pistas y banderas, no para una auditoría de explotación real.
          </div>
        </div>
      )}

      {/* Header & Local Deployment Guide */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-slate-100">
                Despliegue Local con Docker Compose
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Definición completa de servicios, límites de recursos y red bridge aislada para desplegar el laboratorio con un solo comando.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCompose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 transition-colors"
            >
              {copiedCompose ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar docker-compose.yml</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDownloadFile(dockerCompose, 'docker-compose.yml')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar docker-compose.yml</span>
            </button>
          </div>
        </div>

        {/* 3-Step Quick Start Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-cyan-300">Paso 1: Guardar archivos</span>
              <span className="text-[10px] font-mono text-slate-500">./ctf_lab</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Descarga <code className="text-cyan-400 font-mono">docker-compose.yml</code>, <code className="text-cyan-400 font-mono">Dockerfile</code> y <code className="text-cyan-400 font-mono">provision.sh</code> en una misma carpeta local.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDownloadFile(dockerfile, 'Dockerfile')}
                className="text-[10px] text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 px-2 py-1 rounded cursor-pointer"
              >
                Descargar Dockerfile
              </button>
              <button
                type="button"
                onClick={() => handleDownloadFile(provisionScript, 'provision.sh')}
                className="text-[10px] text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 px-2 py-1 rounded cursor-pointer"
              >
                Descargar provision.sh
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-300">Paso 2: Desplegar el contenedor</span>
              <span className="text-[10px] font-mono text-slate-500">docker compose</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Inicia el entorno de pruebas aislado en segundo plano con construcción automática:
            </p>
            <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-emerald-400">
              <span className="truncate">docker compose up --build -d</span>
              <button
                type="button"
                onClick={() => handleCopyCommand('docker compose up --build -d', 'up')}
                className="text-slate-400 hover:text-slate-200 ml-1 cursor-pointer"
                title="Copiar comando de inicio"
              >
                {copiedCmd === 'up' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300">Paso 3: Comprobar conectividad</span>
              <span className="text-[10px] font-mono text-slate-500">nmap / curl</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Verifica los puertos expuestos en tu máquina anfitriona (localhost:8080, 2222):
            </p>
            <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-cyan-300">
              <span className="truncate">curl -i http://localhost:8080/</span>
              <button
                type="button"
                onClick={() => handleCopyCommand('curl -i http://localhost:8080/', 'curl')}
                className="text-slate-400 hover:text-slate-200 ml-1 cursor-pointer"
                title="Copiar comando de prueba"
              >
                {copiedCmd === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Code Box for docker-compose.yml */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-300 font-semibold">docker-compose.yml</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
            <span>Red aislada: ctf_isolated_net (10.10.110.0/24)</span>
            <span>Contenedor: {codename}</span>
          </div>
        </div>

        <div className="p-4 overflow-x-auto bg-slate-950 font-mono text-xs leading-relaxed text-slate-300 max-h-[500px]">
          <pre className="whitespace-pre">{dockerCompose}</pre>
        </div>

        {/* Teardown Command */}
        <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Para detener y desmontar el laboratorio al concluir la práctica:</span>
          <div className="flex items-center gap-2">
            <code className="text-rose-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              docker compose down -v
            </code>
            <button
              type="button"
              onClick={() => handleCopyCommand('docker compose down -v', 'down')}
              className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              title="Copiar comando de apagado"
            >
              {copiedCmd === 'down' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
