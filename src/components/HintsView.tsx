import React, { useState } from 'react';
import { HelpCircle, Eye, EyeOff, Lock, Unlock, Copy, Check, Sparkles, Filter, ShieldCheck } from 'lucide-react';
import { GradualHint } from '../types';

interface HintsViewProps {
  hints: GradualHint[];
  difficulty: string;
  vector: string;
  codename: string;
}

export const HintsView: React.FC<HintsViewProps> = ({
  hints,
  difficulty,
  vector,
  codename,
}) => {
  // Store unlocked hint IDs in state
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'recon' | 'foothold' | 'privesc'>('all');
  const [levelFilter, setLevelFilter] = useState<0 | 1 | 2 | 3>(0);

  const toggleUnlock = (id: string) => {
    setUnlockedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const unlockAllLevel1 = () => {
    const l1Ids = hints.filter((h) => h.level === 1).map((h) => h.id);
    setUnlockedIds((prev) => new Set([...prev, ...l1Ids]));
  };

  const lockAll = () => {
    setUnlockedIds(new Set());
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy hint:', err);
    }
  };

  const filteredHints = hints.filter((h) => {
    if (categoryFilter !== 'all' && h.category !== categoryFilter) return false;
    if (levelFilter !== 0 && h.level !== levelFilter) return false;
    return true;
  });

  const getLevelBadge = (level: 1 | 2 | 3) => {
    switch (level) {
      case 1:
        return {
          label: 'Nivel 1: Orientación Conceptual',
          desc: 'Razonamiento sutil sin revelar herramientas ni archivos',
          color: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
        };
      case 2:
        return {
          label: 'Nivel 2: Pista Táctica',
          desc: 'Áreas de inspección, servicios y herramientas recomendadas',
          color: 'text-amber-400 border-amber-800/60 bg-amber-950/40',
        };
      case 3:
        return {
          label: 'Nivel 3: Vector Dirigido',
          desc: 'Mecanismo preciso de explotación manteniendo la incógnita de la bandera',
          color: 'text-rose-400 border-rose-800/60 bg-rose-950/40',
        };
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'recon':
        return 'Reconocimiento';
      case 'foothold':
        return 'Acceso Inicial';
      case 'privesc':
        return 'Escalada de Privilegios';
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hints Header & Philosophy */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-slate-100">
                Sistema de Pistas Graduales con Protección contra Spoilers
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pistas escalonadas diseñadas para orientar el aprendizaje de forma progresiva sin revelar la bandera ni comprometer el desafío.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={unlockAllLevel1}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Revelar Pistas de Nivel 1
            </button>
            <button
              type="button"
              onClick={lockAll}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Ocultar Todas
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs">
          {/* Phase Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 px-2 text-[11px]">Fase del reto:</span>
            {[
              { id: 'all', label: 'Todas las fases' },
              { id: 'recon', label: 'Reconocimiento' },
              { id: 'foothold', label: 'Acceso Inicial' },
              { id: 'privesc', label: 'Escalada de Privilegios' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategoryFilter(f.id as any)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  categoryFilter === f.id
                    ? 'bg-slate-800 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tier Level Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 px-2 text-[11px]">Nivel de detalle:</span>
            {[
              { id: 0, label: 'Todos los niveles' },
              { id: 1, label: 'Nivel 1' },
              { id: 2, label: 'Nivel 2' },
              { id: 3, label: 'Nivel 3' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setLevelFilter(lvl.id as any)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  levelFilter === lvl.id
                    ? 'bg-slate-800 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hints List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHints.map((hint) => {
          const isUnlocked = unlockedIds.has(hint.id);
          const badge = getLevelBadge(hint.level);

          return (
            <div
              key={hint.id}
              className={`border rounded-xl transition-all p-5 flex flex-col justify-between ${
                isUnlocked
                  ? 'border-slate-800 bg-slate-900/70 shadow-md'
                  : 'border-slate-800/80 bg-slate-950/60'
              }`}
            >
              <div>
                {/* Card Top: Level & Category */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono border font-semibold ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {getCategoryLabel(hint.category)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleUnlock(hint.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors border border-slate-700/80 hover:bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    {isUnlocked ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ocultar</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Revelar pista</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hint Title */}
                <h4 className="text-sm font-semibold text-slate-200 mb-2">
                  {hint.title}
                </h4>

                {/* Hint Content (Blurred if locked) */}
                <div className="relative rounded-lg p-3 bg-slate-950 border border-slate-800/60 text-xs min-h-[75px] flex items-center">
                  {isUnlocked ? (
                    <p className="text-slate-300 leading-relaxed font-sans">{hint.text}</p>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center text-center select-none py-2">
                      <Lock className="w-4 h-4 text-slate-600 mb-1" />
                      <span className="text-[11px] text-slate-500 font-mono">
                        Pista oculta. Haz clic en «Revelar pista» cuando necesites orientación.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom: Copy affordance when unlocked */}
              {isUnlocked && (
                <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{badge.desc}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(hint.id, hint.text)}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {copiedId === hint.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Pista copiada</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar pista</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredHints.length === 0 && (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500 text-xs">
          No hay pistas que coincidan con los filtros seleccionados.
        </div>
      )}
    </div>
  );
};
