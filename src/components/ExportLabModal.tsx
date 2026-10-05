import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  X,
  Download,
  FileArchive,
  FileCode,
  FileText,
  Layers,
  Terminal,
  Check,
  Sparkles,
  Info,
  FolderArchive,
  Globe,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { CTFScenario } from '../types';
import { exportScenarioAsHtml, printScenarioAsPdf } from '../utils/exportReport';
import { generateHtmlReport } from '../utils/generateHtmlReport';
import { exportScenarioAsJson, exportScenarioAsYaml } from '../utils/scenarioIo';
import { isTemplateOnlyPreset } from '../utils/labStatus';
import * as yaml from 'js-yaml';

interface ExportLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: CTFScenario;
}

export const ExportLabModal: React.FC<ExportLabModalProps> = ({
  isOpen,
  onClose,
  scenario,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const codeLower = (scenario.codename || 'ctf').toLowerCase();
  const isTemplateOnly = isTemplateOnlyPreset(scenario.codename);

  // Generate README.md
  const generateReadme = () => {
    return `# Laboratorio CTF: ${scenario.themeName}
${isTemplateOnly ? `
> ⚠️ **Plantilla sin servicio vulnerable**: este preset del catálogo offline de NetPhantom
> no instala ningún servicio explotable real. El contenedor solo levanta una shell base
> de Debian (\`CMD ["/bin/bash"]\`). Sirve para practicar el flujo de topología, pistas y
> banderas, no para una auditoría de explotación real sobre un servicio en marcha.
` : ''}
**Portal Oficial:** [Un Fantasma En El Sistema](https://www.unfantasmaenelsistema.com/)  
**Codename:** \`${scenario.codename}\`  
**Dificultad:** \`${scenario.difficulty}\`  
**Sistema Operativo Objetivo:** \`${scenario.targetOS}\`  
**IP Simulada en Red:** \`${scenario.ip}\`  
**Vector de Acceso Inicial:** \`${scenario.vector}\`  
**Escalada de Privilegios:** \`${scenario.secondaryVector}\`  

---

## 1. Sinopsis & Narrativa
${scenario.story}

---

## 2. Puertos Expuestos & Superficie de Red
| Puerto | Servicio | Versión | Propósito en el Escenario |
| :--- | :--- | :--- | :--- |
${scenario.openPorts
  .map(
    (p) =>
      `| \`${p.port}/tcp\` | ${p.service} | ${p.version} | ${p.purpose} |`
  )
  .join('\n')}

---

## 3. Instrucciones de Despliegue Local (Docker Compose)

### Requisitos Previos:
- Docker Engine 20.10+ y Docker Compose v2 instalado.

### Despliegue en 1 comando:
\`\`\`bash
# 1. Situarse en la carpeta descomprimida
cd lab_${codeLower}

# 2. Construir la imagen e iniciar los contenedores en segundo plano
docker compose up --build -d

# 3. Verificar el estado del contenedor
docker compose ps
\`\`\`

### Comprobar conectividad desde la máquina anfitriona:
\`\`\`bash
# Escaneo de reconocimiento:
nmap -sC -sV -p 8080,2222,4455 localhost

# Probar acceso HTTP:
curl -i http://localhost:8080/
\`\`\`

### Detener y desmontar el laboratorio:
\`\`\`bash
docker compose down -v
\`\`\`

---

## 4. Estructura de Archivos del Laboratorio
- \`docker-compose.yml\`: Orquestación de contenedores y red bridge aislada.
- \`Dockerfile\`: Especificación reproducible del sistema operativo y dependencias.
- \`provision.sh\`: Script bash de instalación de servicios vulnerables y banderas.
- \`ctf_generator.py\`: Generador en Python 3 para regenerar o aleatorizar banderas.
- \`HINTS.md\`: Sistema de pistas graduales en 3 niveles con protección anti-spoilers.
- \`WRITEUP.md\`: Solución técnica detallada y recomendaciones defensivas.
- \`scenario.json\`: Metadatos completos y topología en formato JSON.

---
*NetPhantom CTF · Entornos dinámicos de formación en ciberseguridad.*
`;
  };

  // Generate HINTS.md
  const generateHintsDoc = () => {
    return `# Pistas Graduales: ${scenario.themeName} (${scenario.codename})
> **Aviso:** Las pistas están organizadas en 3 niveles de profundidad para guiar al estudiante de forma progresiva sin revelar la bandera ni comprometer el reto.

---

${(scenario.hints || [])
  .map(
    (h, idx) => `### Pista ${idx + 1}: ${h.title}
- **Fase:** \`${h.category.toUpperCase()}\`
- **Nivel:** \`Nivel ${h.level}\` (${
      h.level === 1
        ? 'Orientación Conceptual Sutil'
        : h.level === 2
        ? 'Pista Táctica (Herramientas / Rutas)'
        : 'Vector Dirigido (Técnica Exacta)'
    })
> ${h.text}
`
  )
  .join('\n---\n\n')}
`;
  };

  // Handle Full ZIP Export
  const handleExportZip = async () => {
    setIsZipping(true);
    setDownloadSuccess(false);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`lab_${codeLower}`) || zip;

      // 1. docker-compose.yml
      folder.file('docker-compose.yml', scenario.dockerCompose);

      // 2. Dockerfile
      folder.file('Dockerfile', scenario.dockerfile);

      // 3. provision.sh
      folder.file('provision.sh', scenario.provisionScript);

      // 4. ctf_generator.py
      folder.file(`ctf_generator_${codeLower}.py`, scenario.pythonScript);

      // 5. README.md
      folder.file('README.md', generateReadme());

      // 6. HINTS.md
      folder.file('HINTS.md', generateHintsDoc());

      // 7. WRITEUP.md
      folder.file('WRITEUP.md', scenario.walkthrough);

      // 8. scenario_blueprint.json & scenario_blueprint.yaml
      folder.file('scenario_blueprint.json', JSON.stringify(scenario, null, 2));
      folder.file(
        'scenario_blueprint.yaml',
        yaml.dump(scenario, { indent: 2, lineWidth: 120, noRefs: true })
      );

      // 9. Dossier_CTF.html (Informe técnico profesional autónomo)
      folder.file(`Dossier_CTF_${codeLower}.html`, generateHtmlReport(scenario));

      // Generate blob
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lab_${codeLower}_completo.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error creating ZIP bundle:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Single file download helper
  const handleDownloadSingleFile = (
    content: string,
    filename: string,
    mimeType = 'text/plain;charset=utf-8'
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fileList = [
    {
      name: 'docker-compose.yml',
      desc: 'Orquestación de servicios, puertos y red bridge aislada',
      icon: Layers,
      type: 'YAML',
      onDownload: () =>
        handleDownloadSingleFile(scenario.dockerCompose, 'docker-compose.yml', 'text/yaml'),
    },
    {
      name: 'Dockerfile',
      desc: 'Especificación de contenedor con dependencias y entorno base',
      icon: FileCode,
      type: 'Docker',
      onDownload: () =>
        handleDownloadSingleFile(scenario.dockerfile, 'Dockerfile', 'text/plain'),
    },
    {
      name: 'provision.sh',
      desc: 'Script Bash de aprovisionamiento de vulnerabilidades y banderas',
      icon: Terminal,
      type: 'Bash',
      onDownload: () =>
        handleDownloadSingleFile(scenario.provisionScript, 'provision.sh', 'text/x-sh'),
    },
    {
      name: `ctf_generator_${codeLower}.py`,
      desc: 'Script Python ejecutable con aleatorización de banderas (CLI)',
      icon: FileCode,
      type: 'Python',
      onDownload: () =>
        handleDownloadSingleFile(
          scenario.pythonScript,
          `ctf_generator_${codeLower}.py`,
          'text/x-python'
        ),
    },
    {
      name: 'README.md',
      desc: 'Manual completo del reto: narrativa, puertos, despliegue y verificación',
      icon: FileText,
      type: 'Markdown',
      onDownload: () =>
        handleDownloadSingleFile(generateReadme(), 'README.md', 'text/markdown'),
    },
    {
      name: 'HINTS.md',
      desc: 'Guía de pistas graduales en 3 niveles protegida contra spoilers',
      icon: FileText,
      type: 'Markdown',
      onDownload: () =>
        handleDownloadSingleFile(generateHintsDoc(), 'HINTS.md', 'text/markdown'),
    },
    {
      name: 'WRITEUP.md',
      desc: 'Guía oficial de resolución y mitigaciones defensivas de seguridad',
      icon: FileText,
      type: 'Markdown',
      onDownload: () =>
        handleDownloadSingleFile(scenario.walkthrough, 'WRITEUP.md', 'text/markdown'),
    },
    {
      name: 'scenario.json',
      desc: 'Metadatos íntegros, topología y configuración estructurada',
      icon: FileArchive,
      type: 'JSON',
      onDownload: () =>
        handleDownloadSingleFile(
          JSON.stringify({ exportedAt: new Date().toISOString(), scenario }, null, 2),
          `scenario_${codeLower}.json`,
          'application/json'
        ),
    },
    {
      name: `Dossier_CTF_${codeLower}.html`,
      desc: 'Dossier técnico interactivo profesional en HTML (standalone) con diseño ejecutivo',
      icon: Globe,
      type: 'HTML',
      onDownload: () => exportScenarioAsHtml(scenario),
    },
    {
      name: `Dossier_CTF_${codeLower}.pdf`,
      desc: 'Dossier maquetado listo para exportar o imprimir en PDF con formato A4',
      icon: Printer,
      type: 'PDF',
      onDownload: () => printScenarioAsPdf(scenario),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Exportar Laboratorio CTF Completo
              </h3>
              <p className="text-xs text-slate-400">
                Paquete integral para despliegue local o distribución a alumnos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {isTemplateOnly && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl border border-amber-800/60 bg-amber-950/30 text-amber-300">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Plantilla sin servicio vulnerable.</strong>
                Este preset del catálogo offline no instala ningún servicio explotable: el contenedor exportado
                solo levanta una shell base de Debian. Es útil para practicar topología, pistas y banderas, pero
                no hay nada que auditar u explotar dentro del contenedor.
              </div>
            </div>
          )}

          {/* Main Action Banner: Download All as ZIP */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-cyan-300">
                  Paquete Desplegable .ZIP (Recomendado)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-900/60 text-cyan-200 border border-cyan-700/50 rounded-full font-semibold">
                  8 Archivos incluidos
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Descarga una carpeta comprimida lista para descomprimir y ejecutar directamente con{' '}
                <code className="text-cyan-400 font-mono">docker compose up -d</code>.
              </p>
            </div>

            <button
              type="button"
              disabled={isZipping}
              onClick={handleExportZip}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-cyan-950/50 shrink-0 cursor-pointer"
            >
              {isZipping ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Empaquetando ZIP...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950" />
                  <span>¡ZIP Descargado!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Todo en .ZIP</span>
                </>
              )}
            </button>
          </div>

          {/* Executive Dossier Export Banner (PDF & HTML) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-sm text-slate-200">
                  Dossier Técnico Ejecutivo (PDF & HTML)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded-full font-semibold">
                  Maquetado A4
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Documento profesional con formato de auditoría: incluye resumen ejecutivo, topología, matriz de puertos, vectores de ataque, banderas y guía técnica.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => printScenarioAsPdf(scenario)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 hover:border-rose-600 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-rose-950/40"
                title="Generar vista de impresión y Guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5 text-rose-400" />
                <span>Exportar PDF</span>
              </button>

              <button
                type="button"
                onClick={() => exportScenarioAsHtml(scenario)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 hover:border-cyan-600 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-cyan-950/40"
                title="Descargar dossier interactivo en archivo HTML autónomo"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Exportar HTML</span>
              </button>
            </div>
          </div>

          {/* Blueprint Exports (.json & .yaml for Teachers / Drag & Drop) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-sm text-slate-200">
                  Blueprints del Escenario (.JSON & .YAML)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/60 rounded-full font-semibold">
                  Profesores & Drag & Drop
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exporta la definición íntegra del reto para compartirla con alumnos o cargarla arrastrando el archivo en cualquier pantalla.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => exportScenarioAsJson(scenario)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Descargar blueprint en formato JSON"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Exportar .JSON</span>
              </button>

              <button
                type="button"
                onClick={() => exportScenarioAsYaml(scenario)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Descargar blueprint en formato YAML"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar .YAML</span>
              </button>
            </div>
          </div>

          {/* Included Files Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold text-slate-300">
                Archivos Incluidos en el Paquete
              </label>
              <span className="text-[11px] text-slate-500">
                Haz clic en cualquier archivo para descargarlo individualmente
              </span>
            </div>

            <div className="space-y-2 border border-slate-800 rounded-xl p-2 bg-slate-950/60">
              {fileList.map((file) => {
                const Icon = file.icon;
                return (
                  <div
                    key={file.name}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700/60 text-cyan-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                            {file.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            {file.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {file.desc}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={file.onDownload}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700/60 transition-colors shrink-0 cursor-pointer"
                      title={`Descargar ${file.name}`}
                    >
                      <Download className="w-3 h-3 text-cyan-400" />
                      <span>Bajar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              El paquete <strong className="text-slate-300">.ZIP</strong> contiene la carpeta{' '}
              <code className="text-cyan-300 font-mono">lab_{codeLower}/</code> con todo listo para
              descomprimir y ejecutar en cualquier máquina con Docker. Las banderas están
              embebidas en la configuración y pueden ser aleatorizadas con el script Python incluido.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-300 transition-colors group"
          >
            <img
              src="/logo-icon-unfantasmaenelsistema.png"
              alt="Logo"
              className="w-5 h-5 rounded object-contain bg-slate-900 border border-slate-700/60"
            />
            <span className="text-[11px] font-medium">
              Desarrollado para <strong className="text-slate-300 group-hover:text-cyan-400">unfantasmaenelsistema.com</strong>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
