import React from 'react';
import {
  Plus,
  Download,
  Upload,
  Globe,
  ExternalLink,
  Layers,
  BarChart3,
  HelpCircle,
  Server,
  Network,
  Terminal,
  FileCode,
  BookOpen,
  Sparkles,
  Bot,
  Sun,
  Moon,
  Shield,
  Code,
  Trophy,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'dashboard'
  | 'terminal'
  | 'frameworks'
  | 'stats'
  | 'hints'
  | 'docker'
  | 'topology'
  | 'code'
  | 'python'
  | 'walkthrough'
  | 'poster'
  | 'mentor';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenNewScenario: () => void;
  onOpenImportScenario: () => void;
  onExportAll: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenNewScenario,
  onOpenImportScenario,
  onExportAll,
  theme,
  onToggleTheme,
}) => {
  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'overview', label: 'Resumen', icon: Layers },
    { id: 'dashboard', label: 'Mi Progreso', icon: Trophy },
    { id: 'terminal', label: 'Web Shell', icon: Terminal },
    { id: 'frameworks', label: 'MITRE & OWASP', icon: Shield },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { id: 'hints', label: 'Pistas', icon: HelpCircle },
    { id: 'docker', label: 'Docker Compose', icon: Server },
    { id: 'topology', label: 'Topología', icon: Network },
    { id: 'code', label: 'Scripts & Configuración', icon: Code },
    { id: 'python', label: 'Script en Python', icon: FileCode },
    { id: 'walkthrough', label: 'Guía de Solución', icon: BookOpen },
    { id: 'poster', label: 'Póster IA', icon: Sparkles },
    { id: 'mentor', label: 'Mentor IA', icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md shadow-lg shadow-black/20">
      {/* Row 1: Brand Identity & Primary Actions */}
      <div className="border-b border-slate-800/60 bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand Left */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 group transition-transform hover:scale-[1.02]"
              title="Ir a Un Fantasma En El Sistema (https://www.unfantasmaenelsistema.com/)"
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 group-hover:border-cyan-500/60 p-0.5 transition-colors overflow-hidden shadow-sm">
                <img
                  src="/logo-icon-unfantasmaenelsistema.png"
                  alt="Un Fantasma En El Sistema Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://www.unfantasmaenelsistema.com/wp-content/uploads/2019/12/log3.png';
                  }}
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors leading-tight">
                  Un Fantasma En El Sistema
                </span>
                <span className="text-[10px] text-slate-400 font-mono leading-none">
                  Seguridad Informática
                </span>
              </div>
            </a>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onTabChange('overview');
              }}
              className="hidden sm:flex items-center gap-1.5 text-base font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap"
            >
              <span>NetPhantom</span>
              <span className="text-cyan-400 font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                CTF
              </span>
            </a>
          </div>

          {/* Actions Right */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-cyan-500/50 transition-all group shadow-sm"
              title="Abrir web oficial: https://www.unfantasmaenelsistema.com/"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline font-mono">unfantasmaenelsistema.com</span>
              <span className="md:hidden">Web</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </a>

            {/* Theme Selector (Claro / Oscuro) con Persistencia Local */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer shadow-sm group bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 hover:border-amber-400/60"
              title={
                theme === 'dark'
                  ? 'Activar Modo Diurno (Alto Contraste)'
                  : 'Activar Modo Oscuro (Cyberpunk)'
              }
              aria-label={
                theme === 'dark'
                  ? 'Cambiar a modo diurno de alto contraste'
                  : 'Cambiar a modo oscuro cyberpunk'
              }
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="hidden sm:inline text-slate-300 group-hover:text-amber-300 transition-colors">
                    Diurno
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-600 group-hover:-rotate-45 transition-transform duration-300" />
                  <span className="hidden sm:inline text-slate-700 group-hover:text-cyan-700 transition-colors">
                    Oscuro
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenImportScenario}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700/80 hover:border-emerald-500/50 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              title="Importar reto desde archivo .json o .yaml"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Importar</span>
            </button>

            <button
              type="button"
              onClick={onExportAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700/80 hover:border-slate-600 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              title="Exportar paquete completo del laboratorio (.ZIP con Docker, scripts y guías)"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Exportar Laboratorio</span>
              <span className="sm:hidden">Exportar</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewScenario}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-sm shadow-cyan-950/60 hover:shadow-cyan-500/20 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Diseñar Reto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Bar - Full Nav Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none text-xs font-medium -mx-1 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-800/60 shadow-sm shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
