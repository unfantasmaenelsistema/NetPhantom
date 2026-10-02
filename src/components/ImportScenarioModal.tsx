import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { CTFScenario } from '../types';
import { validateAndParseScenario } from '../utils/scenarioIo';

interface ImportScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (scenario: CTFScenario) => void;
}

export const ImportScenarioModal: React.FC<ImportScenarioModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [previewScenario, setPreviewScenario] = useState<CTFScenario | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessContent = (content: string, name: string) => {
    setErrorMsg(null);
    setWarnings([]);
    const result = validateAndParseScenario(content, name);
    if (result.error) {
      setErrorMsg(result.error);
      setPreviewScenario(null);
    } else if (result.scenario) {
      setPreviewScenario(result.scenario);
      setFileName(name || 'escenario_personalizado');
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      handleProcessContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      handleProcessContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (previewScenario) {
      onImport(previewScenario);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Importar Laboratorio CTF Personalizado
              </h3>
              <p className="text-xs text-slate-400">
                Carga un archivo <code className="text-cyan-400 font-mono">.json</code> o <code className="text-cyan-400 font-mono">.yaml</code> arrastrándolo o pegando su código.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                : 'border-slate-700/80 hover:border-slate-500 bg-slate-950/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.yaml,.yml,application/json,text/yaml"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-cyan-400">
              <FileCode className="w-6 h-6" />
            </div>

            <p className="text-sm font-semibold text-slate-200">
              {fileName ? (
                <span className="text-cyan-300">Archivo seleccionado: {fileName}</span>
              ) : (
                'Arrastra y suelta tu archivo .json o .yaml aquí'
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              o haz clic para explorar en tus carpetas locales
            </p>
          </div>

          {/* Or Paste Raw Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">O pega el contenido en texto (JSON / YAML):</span>
              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setPreviewScenario(null);
                    setErrorMsg(null);
                    setFileName('');
                  }}
                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
            <textarea
              value={rawText}
              onChange={(e) => {
                const val = e.target.value;
                setRawText(val);
                if (val.trim()) {
                  handleProcessContent(val, 'raw_input.yaml');
                } else {
                  setPreviewScenario(null);
                  setErrorMsg(null);
                }
              }}
              rows={4}
              placeholder="Pega aquí el JSON o YAML exportado previamente..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Security warnings: parts of the imported file were replaced with
              safe defaults instead of trusted as-is (see scenarioIo.ts). */}
          {warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>Avisos de seguridad en la importación</span>
              </div>
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-300 leading-relaxed">
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Validation Success & Preview Card */}
          {previewScenario && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Estructura de Reto Válida y Lista para Cargar</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                  {previewScenario.difficulty}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Nombre del Reto</span>
                  <strong className="text-slate-100">{previewScenario.themeName}</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Codename</span>
                  <strong className="text-cyan-400 font-mono">{previewScenario.codename}</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">IP Asignada & OS</span>
                  <span className="text-slate-300 font-mono">{previewScenario.ip} · {previewScenario.targetOS}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Vector Foothold</span>
                  <span className="text-slate-300 truncate block">{previewScenario.vector}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!previewScenario}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-lg shadow-cyan-950/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span>Cargar en la Aplicación</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
