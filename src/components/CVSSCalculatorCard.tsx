import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  Flame,
  Info,
  Sliders,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { CTFScenario, CVSSVector, CVSSSeverity } from '../types';
import {
  calculateCVSS31,
  inferCVSSVector,
  CVSS_METRICS_INFO,
  getSeverityStyle,
} from '../utils/cvssCalculator';

interface CVSSCalculatorCardProps {
  scenario: CTFScenario;
  onVectorChange?: (vector: CVSSVector) => void;
}

export const CVSSCalculatorCard: React.FC<CVSSCalculatorCardProps> = ({
  scenario,
  onVectorChange,
}) => {
  const [vector, setVector] = useState<CVSSVector>(() => inferCVSSVector(scenario));
  const [copied, setCopied] = useState(false);

  // Sync when scenario changes
  useEffect(() => {
    const inferred = inferCVSSVector(scenario);
    setVector(inferred);
  }, [scenario.codename, scenario.difficulty, scenario.vector]);

  const result = calculateCVSS31(vector);
  const style = getSeverityStyle(result.severity);

  const handleMetricChange = <K extends keyof CVSSVector>(key: K, val: CVSSVector[K]) => {
    const updated = { ...vector, [key]: val };
    setVector(updated);
    if (onVectorChange) {
      onVectorChange(updated);
    }
  };

  const handleResetToPreset = () => {
    const inferred = inferCVSSVector(scenario);
    setVector(inferred);
    if (onVectorChange) {
      onVectorChange(inferred);
    }
  };

  const handleCopyVector = async () => {
    try {
      await navigator.clipboard.writeText(result.vectorString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy CVSS vector:', err);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background glow tailored to severity */}
      <div
        className={`absolute top-0 right-0 -z-10 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 ${
          result.severity === 'Critical'
            ? 'bg-rose-500'
            : result.severity === 'High'
            ? 'bg-amber-500'
            : result.severity === 'Medium'
            ? 'bg-yellow-500'
            : 'bg-emerald-500'
        }`}
      />

      {/* Header and Live Score Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>CALCULADORA DE SEVERIDAD OFICIAL</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">FIRST.ORG CVSS v3.1</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            Matriz de Puntuación CVSS del Escenario
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Ajusta los vectores base de explotación para calcular la severidad exacta de las vulnerabilidades presentes en <strong className="text-cyan-300">{scenario.codename}</strong>.
          </p>
        </div>

        {/* Big Live Score Gauge */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Puntuación Base</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${style.text}`}>
                {result.score.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-500">/ 10</span>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-slate-800" />

          <div className="space-y-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-xs font-extrabold uppercase font-mono tracking-wider border ${style.badgeBg}`}
            >
              {result.severity}
            </span>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <span>Exp: <strong className="text-slate-200">{result.exploitability}</strong></span>
              <span>·</span>
              <span>Imp: <strong className="text-slate-200">{result.impact}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Vector String Strip & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 overflow-x-auto text-slate-300">
          <span className="text-slate-500 shrink-0">Vector:</span>
          <span className="text-cyan-400 font-bold whitespace-nowrap">{result.vectorString}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyVector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer text-xs"
            title="Copiar vector string al portapapeles"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copiar Vector</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetToPreset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-colors cursor-pointer text-xs"
            title="Restablecer valores originales del escenario"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </div>

      {/* 8 Metric Knobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Attack Vector */}
        <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Vector de Ataque (AV)</span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">{vector.av}</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {CVSS_METRICS_INFO.av.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMetricChange('av', opt.id as any)}
                className={`py-1.5 px-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  vector.av === opt.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
                title={`${opt.label}: ${opt.desc}`}
              >
                {opt.id}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {CVSS_METRICS_INFO.av.options.find((o) => o.id === vector.av)?.desc}
          </p>
        </div>

        {/* 2. Attack Complexity */}
        <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Complejidad (AC)</span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">{vector.ac}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {CVSS_METRICS_INFO.ac.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMetricChange('ac', opt.id as any)}
                className={`py-1.5 px-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  vector.ac === opt.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
                title={`${opt.label}: ${opt.desc}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {CVSS_METRICS_INFO.ac.options.find((o) => o.id === vector.ac)?.desc}
          </p>
        </div>

        {/* 3. Privileges Required */}
        <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Privilegios (PR)</span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">{vector.pr}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {CVSS_METRICS_INFO.pr.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMetricChange('pr', opt.id as any)}
                className={`py-1.5 px-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  vector.pr === opt.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
                title={`${opt.label}: ${opt.desc}`}
              >
                {opt.id}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {CVSS_METRICS_INFO.pr.options.find((o) => o.id === vector.pr)?.desc}
          </p>
        </div>

        {/* 4. User Interaction */}
        <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Interacción Usuario (UI)</span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">{vector.ui}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {CVSS_METRICS_INFO.ui.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMetricChange('ui', opt.id as any)}
                className={`py-1.5 px-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  vector.ui === opt.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
                title={`${opt.label}: ${opt.desc}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {CVSS_METRICS_INFO.ui.options.find((o) => o.id === vector.ui)?.desc}
          </p>
        </div>

        {/* 5. Scope */}
        <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Alcance / Escape (Scope)</span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">{vector.s}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {CVSS_METRICS_INFO.s.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMetricChange('s', opt.id as any)}
                className={`py-1.5 px-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  vector.s === opt.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
                title={`${opt.label}: ${opt.desc}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {CVSS_METRICS_INFO.s.options.find((o) => o.id === vector.s)?.desc}
          </p>
        </div>

        {/* 6. Confidentiality */}
        <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Confidencialidad (C)</span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">{vector.c}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {CVSS_METRICS_INFO.c.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMetricChange('c', opt.id as any)}
                className={`py-1.5 px-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  vector.c === opt.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
                title={`${opt.label}: ${opt.desc}`}
              >
                {opt.id}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {CVSS_METRICS_INFO.c.options.find((o) => o.id === vector.c)?.desc}
          </p>
        </div>

        {/* 7. Integrity */}
        <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Integridad (I)</span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">{vector.i}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {CVSS_METRICS_INFO.i.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMetricChange('i', opt.id as any)}
                className={`py-1.5 px-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  vector.i === opt.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
                title={`${opt.label}: ${opt.desc}`}
              >
                {opt.id}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {CVSS_METRICS_INFO.i.options.find((o) => o.id === vector.i)?.desc}
          </p>
        </div>

        {/* 8. Availability */}
        <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Disponibilidad (A)</span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">{vector.a}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {CVSS_METRICS_INFO.a.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMetricChange('a', opt.id as any)}
                className={`py-1.5 px-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  vector.a === opt.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
                title={`${opt.label}: ${opt.desc}`}
              >
                {opt.id}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {CVSS_METRICS_INFO.a.options.find((o) => o.id === vector.a)?.desc}
          </p>
        </div>
      </div>
    </div>
  );
};
