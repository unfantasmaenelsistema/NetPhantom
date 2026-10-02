import React, { useState } from 'react';
import { Terminal, Download, Copy, Check, Play, RefreshCw, FolderCheck, FileCode } from 'lucide-react';

interface PythonScriptViewProps {
  pythonScript: string;
  codename: string;
  themeName: string;
  difficulty: string;
  vector: string;
  userFlag: string;
  rootFlag: string;
}

export const PythonScriptView: React.FC<PythonScriptViewProps> = ({
  pythonScript,
  codename,
  themeName,
  difficulty,
  vector,
  userFlag,
  rootFlag,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simOutput, setSimOutput] = useState<string[]>([]);
  const [selectedFlagsOption, setSelectedFlagsOption] = useState<'default' | 'randomized'>('randomized');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pythonScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy python script:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ctf_generator_${codename.toLowerCase()}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runCliSimulation = () => {
    setIsSimulating(true);
    setSimOutput([]);

    const randHex = () => Math.random().toString(16).substring(2, 10);
    const randomizedUser = `CTF{${codename.toLowerCase()}_user_${randHex()}${randHex()}}`;
    const randomizedRoot = `CTF{${codename.toLowerCase()}_root_${randHex()}${randHex()}${randHex()}}`;

    const effectiveUser = selectedFlagsOption === 'randomized' ? randomizedUser : userFlag;
    const effectiveRoot = selectedFlagsOption === 'randomized' ? randomizedRoot : rootFlag;

    const steps = [
      `$ python3 ctf_generator_${codename.toLowerCase()}.py --output ./lab_${codename.toLowerCase()} ${
        selectedFlagsOption === 'randomized' ? '--randomize-flags' : ''
      }`,
      `[*] Configurando reto: ${codename} (${difficulty})`,
      `[*] Universo narrativo: "${themeName}"`,
      `[*] Vector de explotación: ${vector}`,
      selectedFlagsOption === 'randomized'
        ? `[+] Generando entropía criptográfica en banderas (sales SHA256)...`
        : `[+] Empleando banderas temáticas predeterminadas...`,
      `[+] Bandera de Usuario: ${effectiveUser}`,
      `[+] Bandera de Root: ${effectiveRoot}`,
      `[+] Generando archivo de metadatos: ./lab_${codename.toLowerCase()}/scenario.json`,
      `[+] Generando definición de contenedor: ./lab_${codename.toLowerCase()}/Dockerfile`,
      `[+] Generando configuración de red y servicios: ./lab_${codename.toLowerCase()}/docker-compose.yml`,
      `[+] Inyectando script de aprovisionamiento: ./lab_${codename.toLowerCase()}/provision.sh (chmod 0755)`,
      `\n[✓] ¡Laboratorio CTF generado con éxito!`,
      `    Comandos para iniciar el entorno en tu máquina:`,
      `    $ cd ./lab_${codename.toLowerCase()}`,
      `    $ docker compose up --build -d`,
      `    $ nmap -sC -sV -p- 10.10.110.42`,
    ];

    steps.forEach((line, index) => {
      setTimeout(() => {
        setSimOutput((prev) => [...prev, line]);
        if (index === steps.length - 1) {
          setIsSimulating(false);
        }
      }, (index + 1) * 200);
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview & Instructions */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-slate-100">
                Script Autónomo de Generación en Python 3
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Herramienta ejecutable desde la línea de comandos para construir, desplegar y aleatorizar laboratorios de seguridad de manera local.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Código copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar script</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar script .py</span>
            </button>
          </div>
        </div>

        {/* CLI Usage Quick Reference */}
        <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-slate-500"># Ejecución en la terminal de tu sistema:</div>
          <div className="text-cyan-400">python3 ctf_generator_{codename.toLowerCase()}.py --output ./mi_laboratorio</div>
          <div className="text-slate-400"># Con aleatorización de banderas para competiciones o evaluaciones:</div>
          <div className="text-emerald-400">python3 ctf_generator_{codename.toLowerCase()}.py --output ./examen_ctf --randomize-flags</div>
        </div>
      </div>

      {/* Interactive Simulation Playground */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-slate-200">Simulador de Ejecución CLI</h4>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSelectedFlagsOption('randomized')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFlagsOption === 'randomized'
                    ? 'bg-slate-800 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Banderas Aleatorias
              </button>
              <button
                type="button"
                onClick={() => setSelectedFlagsOption('default')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFlagsOption === 'default'
                    ? 'bg-slate-800 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Banderas Temáticas
              </button>
            </div>

            <button
              type="button"
              disabled={isSimulating}
              onClick={runCliSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Ejecutando script...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Simular Ejecución CLI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Terminal Output Screen */}
        <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 min-h-[180px] max-h-[280px] overflow-y-auto border border-slate-800/80">
          {simOutput.length === 0 ? (
            <div className="text-slate-600 italic">
              Haz clic en «Simular Ejecución CLI» para ver la salida del comando y las banderas generadas...
            </div>
          ) : (
            simOutput.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith('$')
                    ? 'text-cyan-400 font-bold'
                    : line.includes('[✓]')
                    ? 'text-emerald-400 font-bold'
                    : line.includes('Bandera de Usuario') || line.includes('Bandera de Root')
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }
              >
                {line}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Full Python Code Inspection */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <span className="text-xs font-mono text-slate-300 font-semibold">
            ctf_generator_{codename.toLowerCase()}.py (Código Fuente Completo)
          </span>
          <span className="text-[11px] font-mono text-slate-500">Python 3.9+ / Sin dependencias externas</span>
        </div>

        <div className="p-4 overflow-x-auto bg-slate-950 font-mono text-xs leading-relaxed text-slate-300 max-h-[500px]">
          <pre className="whitespace-pre">{pythonScript}</pre>
        </div>
      </div>
    </div>
  );
};
