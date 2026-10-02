import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Copy,
  Eye,
  EyeOff,
  Flag,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Send,
} from 'lucide-react';

interface FlagCheckerCardProps {
  flagType: 'user' | 'root';
  title: string;
  expectedFlag: string;
  flagPath?: string;
  points?: number;
  onSuccess?: () => void;
}

export const FlagCheckerCard: React.FC<FlagCheckerCardProps> = ({
  flagType,
  title,
  expectedFlag,
  flagPath,
  points = flagType === 'user' ? 50 : 100,
  onSuccess,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'empty'>('idle');
  const [isSolved, setIsSolved] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Reset checker when scenario or target flag changes
  useEffect(() => {
    setInputVal('');
    setStatus('idle');
    setIsSolved(false);
    setShowSolution(false);
    setAttempts(0);
  }, [expectedFlag]);

  const isUser = flagType === 'user';
  const badgeColor = isUser ? 'text-cyan-400 border-cyan-800/60 bg-cyan-950/40' : 'text-rose-400 border-rose-800/60 bg-rose-950/40';

  const handleValidate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedInput = inputVal.trim();
    if (!trimmedInput) {
      setStatus('empty');
      return;
    }

    setAttempts((prev) => prev + 1);

    if (trimmedInput === expectedFlag.trim()) {
      setStatus('success');
      setIsSolved(true);
      setIsGlowing(true);
      setTimeout(() => setIsGlowing(false), 800);
      onSuccess?.();
    } else {
      setStatus('error');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleCopy = () => {
    if (!expectedFlag) return;
    navigator.clipboard.writeText(expectedFlag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setInputVal('');
    setStatus('idle');
    setIsSolved(false);
  };

  return (
    <div
      className={`relative p-4 rounded-xl border transition-all duration-300 ${
        isGlowing
          ? 'animate-success-glow border-emerald-500 bg-emerald-950/20'
          : isShaking
          ? 'animate-shake border-rose-500 bg-rose-950/20'
          : isSolved
          ? 'border-emerald-600/70 bg-emerald-950/15'
          : status === 'error'
          ? 'border-rose-800/70 bg-rose-950/10'
          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700/80'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border flex items-center justify-center ${
              isSolved
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400'
                : badgeColor
            }`}
          >
            {isSolved ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 animate-in zoom-in duration-200" />
            ) : (
              <Flag className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">{title}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  isSolved
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                +{points} pts
              </span>
            </div>
            {flagPath && (
              <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[200px] sm:max-w-none">
                {flagPath}
              </span>
            )}
          </div>
        </div>

        {/* Quick Solution Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSolution((prev) => !prev)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={showSolution ? 'Ocultar solución' : 'Ver solución (Spoiler)'}
          >
            {showSolution ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Copiar bandera al portapapeles"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Solution Preview Area (Revealed or Masked) */}
      <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-500 select-none text-[10px]">Esperada:</span>
        <span
          className={`truncate select-all ${
            showSolution
              ? isUser
                ? 'text-cyan-300'
                : 'text-rose-300'
              : 'text-slate-500 blur-[3.5px] hover:blur-none transition-all cursor-pointer'
          }`}
          title={showSolution ? expectedFlag : 'Pasa el cursor o pulsa el icono del ojo para revelar'}
          onClick={() => setShowSolution((prev) => !prev)}
        >
          {expectedFlag}
        </span>
      </div>

      {/* Flag Validation Input Form */}
      <form onSubmit={handleValidate} className="space-y-2">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              if (status !== 'idle') setStatus('idle');
            }}
            placeholder="Introduce la flag capturada (CTF{...})"
            className={`w-full pr-20 pl-3 py-1.5 text-xs font-mono rounded-lg bg-slate-900/90 border placeholder:text-slate-600 focus:outline-none transition-all ${
              status === 'success' || isSolved
                ? 'border-emerald-600/80 text-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'
                : status === 'error'
                ? 'border-rose-600/80 text-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                : 'border-slate-700/80 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30'
            }`}
          />
          <div className="absolute right-1 flex items-center gap-1">
            {inputVal && (
              <button
                type="button"
                onClick={() => setInputVal('')}
                className="p-1 text-slate-500 hover:text-slate-300"
                title="Limpiar texto"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isSolved
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
              }`}
            >
              <Send className="w-2.5 h-2.5" />
              <span>Validar</span>
            </button>
          </div>
        </div>

        {/* Validation Animation & Feedback Messages */}
        {status === 'success' && (
          <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-bounce" />
              <span className="font-semibold text-[11px]">
                ¡Bandera correcta! {isUser ? 'Acceso inicial obtenido.' : 'Privilegios de Root confirmados.'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/60 px-1.5 py-0.5 rounded">
              +{points} pts
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-600/60 text-rose-300 flex items-center justify-between animate-in fade-in duration-150 text-xs">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-[11px]">
                Bandera incorrecta. Intento #{attempts}.
              </span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] text-rose-400 hover:text-rose-200 flex items-center gap-1 underline cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {status === 'empty' && (
          <div className="text-[10px] text-amber-400 flex items-center gap-1 px-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Por favor, escribe o pega una bandera para comprobar.</span>
          </div>
        )}

        {isSolved && status !== 'success' && (
          <div className="flex items-center justify-between text-[11px] text-emerald-400 px-1">
            <span className="flex items-center gap-1 font-mono">
              <Check className="w-3 h-3 text-emerald-400" />
              Capturada con éxito
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Comprobar otra vez
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
