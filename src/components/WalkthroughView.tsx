import React, { useState } from 'react';
import { BookOpen, Copy, Check, ShieldAlert, ShieldCheck, Key, Terminal, Printer, Globe } from 'lucide-react';
import { CTFScenario } from '../types';
import { exportScenarioAsHtml, printScenarioAsPdf } from '../utils/exportReport';

interface WalkthroughViewProps {
  walkthrough: string;
  codename: string;
  userFlag: string;
  rootFlag: string;
  userFlagPath: string;
  rootFlagPath: string;
  scenario?: CTFScenario;
}

export const WalkthroughView: React.FC<WalkthroughViewProps> = ({
  walkthrough,
  codename,
  userFlag,
  rootFlag,
  userFlagPath,
  rootFlagPath,
  scenario,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null);
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState<number | null>(null);

  const handleCopyWalkthrough = async () => {
    try {
      await navigator.clipboard.writeText(walkthrough);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy writeup:', err);
    }
  };

  const handleCopyFlag = async (flagText: string, flagType: string) => {
    try {
      await navigator.clipboard.writeText(flagText);
      setCopiedFlag(flagType);
      setTimeout(() => setCopiedFlag(null), 2000);
    } catch (err) {
      console.error('Failed to copy flag:', err);
    }
  };

  const handleCopySnippet = async (snippetText: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(snippetText);
      setCopiedSnippetIdx(idx);
      setTimeout(() => setCopiedSnippetIdx(null), 2000);
    } catch (err) {
      console.error('Failed to copy snippet:', err);
    }
  };

  // Robust Markdown tokenizer: guarantees every ```code``` block is parsed into a real terminal window
  const parseTokens = (text: string) => {
    const tokens: Array<{ type: 'code' | 'text'; content: string; lang?: string }> = [];
    const regex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      tokens.push({ type: 'code', lang: match[1] || 'bash', content: match[2].trim() });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      tokens.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return tokens;
  };

  return (
    <div className="space-y-6">
      {/* Flags Reference Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Flag Card */}
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">Bandera de Usuario (Acceso Inicial)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">{userFlagPath}</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300">
            <span className="truncate mr-2 select-all">{userFlag}</span>
            <button
              type="button"
              onClick={() => handleCopyFlag(userFlag, 'user')}
              className="text-slate-400 hover:text-slate-200 p-1 shrink-0 cursor-pointer"
              title="Copiar bandera de usuario"
            >
              {copiedFlag === 'user' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Root Flag Card */}
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold text-slate-200">Bandera de Superusuario (Escalada de Privilegios)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">{rootFlagPath}</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-rose-300">
            <span className="truncate mr-2 select-all">{rootFlag}</span>
            <button
              type="button"
              onClick={() => handleCopyFlag(rootFlag, 'root')}
              className="text-slate-400 hover:text-slate-200 p-1 shrink-0 cursor-pointer"
              title="Copiar bandera de root"
            >
              {copiedFlag === 'root' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Walkthrough Container */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Guía de Resolución y Mitigaciones Defensivas (Writeup)
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {scenario && (
              <>
                <button
                  type="button"
                  onClick={() => printScenarioAsPdf(scenario)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 rounded-lg border border-rose-800/80 hover:border-rose-600 transition-colors cursor-pointer"
                  title="Exportar dossier técnico completo en PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-rose-400" />
                  <span>Dossier PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportScenarioAsHtml(scenario)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 rounded-lg border border-cyan-800/80 hover:border-cyan-600 transition-colors cursor-pointer"
                  title="Descargar dossier interactivo en HTML autónomo"
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dossier HTML</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleCopyWalkthrough}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Guía copiada</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar guía</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body formatted */}
        <div className="p-6 text-sm text-slate-300 space-y-3 max-h-[680px] overflow-y-auto font-sans leading-relaxed">
          {walkthrough ? (
            <div className="space-y-3">
              {parseTokens(walkthrough).map((token, tokenIdx) => {
                if (token.type === 'code') {
                  const isCopied = copiedSnippetIdx === tokenIdx;
                  return (
                    <div
                      key={tokenIdx}
                      className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden my-3 shadow-lg group/code"
                    >
                      {/* Terminal Window Header Bar */}
                      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                            {token.lang || 'BASH'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopySnippet(token.content, tokenIdx)}
                          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-cyan-300 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 transition-colors cursor-pointer"
                          title="Copiar bloque de comandos"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Code Content */}
                      <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
                        {token.content}
                      </pre>
                    </div>
                  );
                }

                // Text block: split by paragraphs or headers
                return (
                  <div key={tokenIdx} className="space-y-2">
                    {token.content.split('\n\n').map((paragraph, pIdx) => {
                      const trimmed = paragraph.trim();
                      if (!trimmed) return null;

                      if (trimmed.startsWith('# Guía') || trimmed.startsWith('# ')) {
                        return (
                          <h2
                            key={pIdx}
                            className="text-lg font-bold text-cyan-400 pt-2 pb-1 border-b border-slate-800/80"
                          >
                            {trimmed.replace(/^#+ /, '')}
                          </h2>
                        );
                      }

                      if (trimmed.startsWith('## ')) {
                        return (
                          <h3
                            key={pIdx}
                            className="text-base font-semibold text-slate-100 pt-4 pb-1 border-t border-slate-800/60 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                            <span>{trimmed.replace('## ', '')}</span>
                          </h3>
                        );
                      }

                      if (trimmed.startsWith('### ')) {
                        return (
                          <h4
                            key={pIdx}
                            className="text-sm font-semibold text-cyan-300 pt-2 text-slate-200"
                          >
                            {trimmed.replace('### ', '')}
                          </h4>
                        );
                      }

                      // Check for list items
                      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        const items = trimmed.split('\n');
                        return (
                          <ul key={pIdx} className="space-y-1.5 pl-4 list-disc text-slate-300 text-xs">
                            {items.map((item, itemIdx) => (
                              <li key={itemIdx} className="leading-relaxed">
                                {item.replace(/^[-*]\s+/, '')}
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      return (
                        <p key={pIdx} className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-slate-500 italic">No hay contenido de resolución disponible para este escenario.</div>
          )}
        </div>
      </div>
    </div>
  );
};
