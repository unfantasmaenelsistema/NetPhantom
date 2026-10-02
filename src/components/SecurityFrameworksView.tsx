import React, { useState } from 'react';
import {
  Shield,
  ExternalLink,
  Copy,
  Check,
  Award,
  Layers,
  FileCheck,
  AlertTriangle,
  Info,
  Compass,
  ShieldAlert,
  Calculator,
} from 'lucide-react';
import { CTFScenario } from '../types';
import { getScenarioFrameworks } from '../utils/frameworksHelper';
import { CVSSCalculatorCard } from './CVSSCalculatorCard';
import { calculateCVSS31, inferCVSSVector } from '../utils/cvssCalculator';

interface SecurityFrameworksViewProps {
  scenario: CTFScenario;
}

export const SecurityFrameworksView: React.FC<SecurityFrameworksViewProps> = ({ scenario }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'cvss' | 'mitre' | 'owasp' | 'cwe'>('all');
  const [copiedReport, setCopiedReport] = useState(false);

  const frameworks = getScenarioFrameworks(scenario);
  const cvssResult = calculateCVSS31(inferCVSSVector(scenario));

  const tacticColors: Record<string, { bg: string; text: string; border: string }> = {
    'Initial Access': { bg: 'bg-cyan-950/60', text: 'text-cyan-400', border: 'border-cyan-800/60' },
    'Execution': { bg: 'bg-blue-950/60', text: 'text-blue-400', border: 'border-blue-800/60' },
    'Privilege Escalation': { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800/60' },
    'Lateral Movement': { bg: 'bg-purple-950/60', text: 'text-purple-400', border: 'border-purple-800/60' },
    'Persistence': { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-800/60' },
  };

  const handleCopyFrameworkSummary = async () => {
    const text = `# Mapeo a Estándares de Seguridad: ${scenario.themeName} (${scenario.codename})
**Dificultad:** ${scenario.difficulty}
**Sistema Operativo:** ${scenario.targetOS}

## 1. Severidad y Vector CVSS v3.1 (FIRST.org)
- **Puntuación Base:** ${cvssResult.score} / 10 (${cvssResult.severity})
- **Vector String:** ${cvssResult.vectorString}
- **Explotabilidad:** ${cvssResult.exploitability} · **Impacto:** ${cvssResult.impact}

## 2. MITRE ATT&CK Enterprise
${frameworks.mitre
  .map(
    (m) =>
      `- [${m.id}] ${m.name} (Táctica: ${m.tactic} - ${m.tacticId})\n  Enlace: ${m.url}\n  Descripción: ${m.description}`
  )
  .join('\n\n')}

## 3. OWASP Top 10 (2021)
${frameworks.owasp
  .map((o) => `- [${o.code}] ${o.name}\n  Enlace: ${o.url}\n  Descripción: ${o.description}`)
  .join('\n\n')}

## 4. CWE (Common Weakness Enumeration)
${(frameworks.cwe || [])
  .map((c) => `- [${c.id}] ${c.name} (${c.url})`)
  .join('\n')}

---
*NetPhantom CTF · Alineación pedagógica y profesional.*`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch (err) {
      console.error('Failed to copy framework report:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Hero Header */}
      <div className="relative border border-slate-800 bg-slate-900/70 rounded-2xl overflow-hidden p-6 lg:p-8">
        <div className="absolute top-0 right-0 -z-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>MARCOS ESTÁNDAR DE LA INDUSTRIA</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">COMPLIANCE & THREAT MODELING</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Alineación MITRE ATT&CK® & OWASP Top 10
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Mapeo táctico y taxonómico de los vectores de explotación del laboratorio{' '}
              <strong className="text-cyan-300">{scenario.codename}</strong> contra las matrices de ciberseguridad
              ofensiva y defensiva estándar utilizadas por equipos Red Team y analistas SOC.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyFrameworkSummary}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700/80 transition-all cursor-pointer shadow-sm"
              title="Copiar informe de compliance en formato Markdown"
            >
              {copiedReport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Resumen copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copiar Mapeo Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80 flex-wrap">
          <span className="text-xs font-medium text-slate-400 mr-2 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Filtrar por Marco:</span>
          </span>

          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
            }`}
          >
            Vista Completa ({frameworks.mitre.length + frameworks.owasp.length + (frameworks.cwe?.length || 0) + 1})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('cvss')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'cvss'
                ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-950/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CVSS v3.1 ({cvssResult.score} {cvssResult.severity})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('mitre')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'mitre'
                ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
            }`}
          >
            MITRE ATT&CK ({frameworks.mitre.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('owasp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'owasp'
                ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
            }`}
          >
            OWASP Top 10 ({frameworks.owasp.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('cwe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'cwe'
                ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
            }`}
          >
            CWE ({frameworks.cwe?.length || 0})
          </button>
        </div>
      </div>

      {/* 0. CVSS v3.1 Official Severity Matrix & Calculator */}
      {(activeFilter === 'all' || activeFilter === 'cvss') && (
        <CVSSCalculatorCard scenario={scenario} />
      )}

      {/* 1. MITRE ATT&CK Enterprise Grid */}
      {(activeFilter === 'all' || activeFilter === 'mitre') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                Matriz Táctica MITRE ATT&CK® for Enterprise
              </h3>
            </div>
            <a
              href="https://attack.mitre.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>attack.mitre.org</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {frameworks.mitre.map((tech) => {
              const tacticStyle = tacticColors[tech.tactic] || {
                bg: 'bg-slate-950/60',
                text: 'text-slate-300',
                border: 'border-slate-800',
              };

              return (
                <div
                  key={tech.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                          {tech.id}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded border ${tacticStyle.bg} ${tacticStyle.text} ${tacticStyle.border}`}
                        >
                          {tech.tactic} · {tech.tacticId}
                        </span>
                      </div>

                      <a
                        href={tech.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-cyan-300 transition-colors p-1"
                        title="Ver técnica en MITRE ATT&CK oficial"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-100">{tech.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{tech.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Ámbito: {scenario.codename}</span>
                    <a
                      href={tech.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Ficha Técnica MITRE</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. OWASP Top 10 (2021) Grid */}
      {(activeFilter === 'all' || activeFilter === 'owasp') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                Riesgos Críticos OWASP Top 10 (2021)
              </h3>
            </div>
            <a
              href="https://owasp.org/Top10/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>owasp.org/Top10</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {frameworks.owasp.map((cat) => (
              <div
                key={cat.code}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
                      {cat.code}
                    </span>
                    <a
                      href={cat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-amber-300 transition-colors p-1"
                      title="Ver guía OWASP oficial"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100">{cat.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{cat.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Severidad: Crítica / Alta</span>
                  <a
                    href={cat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <span>Directrices OWASP</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CWE (Common Weakness Enumeration) */}
      {(activeFilter === 'all' || activeFilter === 'cwe') && frameworks.cwe && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                CWE (Common Weakness Enumeration)
              </h3>
            </div>
            <a
              href="https://cwe.mitre.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>cwe.mitre.org</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {frameworks.cwe.map((c) => (
              <a
                key={c.id}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                      {c.id}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h5 className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors leading-snug">
                    {c.name}
                  </h5>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-3">Base de Conocimiento MITRE</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Educational & Defensive Notice */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Nota para Docentes y Red Teams:</strong> Este mapeo permite utilizar los laboratorios de NetPhantom CTF para preparar certificaciones oficiales de la industria como <strong className="text-cyan-300">OSCP, CEH, CompTIA Security+, CRTP</strong> y auditorías bajo el marco de ciberseguridad NIST SP 800-53.
        </p>
      </div>
    </div>
  );
};
