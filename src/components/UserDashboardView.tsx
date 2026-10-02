import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  Award,
  Search,
  Filter,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Flame,
  Shield,
  Layers,
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  User,
} from 'lucide-react';
import { CTFScenario } from '../types';
import {
  LabProgress,
  formatDuration,
  calculateUserStats,
  LEVEL_TIERS,
} from '../utils/userProgress';

interface UserDashboardViewProps {
  scenariosCatalog: CTFScenario[];
  activeScenario: CTFScenario;
  progressMap: Record<string, LabProgress>;
  currentLabSessionSeconds: number;
  onSelectScenario: (scenario: CTFScenario) => void;
  onOpenDiploma: (scenario: CTFScenario) => void;
  onToggleLabFlag: (codename: string, flag: 'user' | 'root') => void;
  onResetProgress: () => void;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  scenariosCatalog,
  activeScenario,
  progressMap,
  currentLabSessionSeconds,
  onSelectScenario,
  onOpenDiploma,
  onToggleLabFlag,
  onResetProgress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'pending'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('netphantom_student_name') || 'Auditor de Ciberseguridad';
  });
  const [isEditingName, setIsEditingName] = useState(false);

  const stats = useMemo(() => {
    return calculateUserStats(progressMap, scenariosCatalog.length);
  }, [progressMap, scenariosCatalog.length]);

  const handleSaveName = (newName: string) => {
    setUserName(newName);
    localStorage.setItem('netphantom_student_name', newName);
  };

  // Find max time for visual bar comparison
  const maxLabTime = useMemo(() => {
    let max = 60;
    Object.values(progressMap).forEach((p) => {
      if (p.timeSpentSeconds > max) max = p.timeSpentSeconds;
    });
    return max;
  }, [progressMap]);

  // Filtered scenarios
  const filteredScenarios = useMemo(() => {
    return scenariosCatalog.filter((sc) => {
      const prog = progressMap[sc.codename] || {
        codename: sc.codename,
        userSolved: false,
        rootSolved: false,
        timeSpentSeconds: 0,
        points: 0,
      };

      const isCompleted = prog.userSolved && prog.rootSolved;
      const isInProgress = (prog.userSolved || prog.rootSolved || prog.timeSpentSeconds > 0) && !isCompleted;
      const isPending = !prog.userSolved && !prog.rootSolved && prog.timeSpentSeconds === 0;

      // Status check
      if (statusFilter === 'completed' && !isCompleted) return false;
      if (statusFilter === 'in_progress' && !isInProgress) return false;
      if (statusFilter === 'pending' && !isPending) return false;

      // Difficulty check
      if (difficultyFilter !== 'all' && sc.difficulty !== difficultyFilter) return false;

      // Search check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = sc.themeName.toLowerCase().includes(query);
        const matchesCode = sc.codename.toLowerCase().includes(query);
        const matchesVector = sc.vector.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesVector) return false;
      }

      return true;
    });
  }, [scenariosCatalog, progressMap, statusFilter, difficultyFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* User Profile & Global Progression Bar Header */}
      <div className="relative border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl overflow-hidden p-6 sm:p-8 shadow-xl">
        {/* Ambient neon backdrop */}
        <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -z-10 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* User identity & level title */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-900/80 via-slate-900 to-amber-900/60 border-2 border-cyan-500/60 flex items-center justify-center shadow-lg shadow-cyan-950">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 animate-pulse" />
              </div>
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950 border border-amber-300 shadow-md">
                NV {stats.level}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => handleSaveName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                      autoFocus
                      className="px-2 py-0.5 bg-slate-950 border border-cyan-500 rounded text-base font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="text-xs text-cyan-400 hover:underline cursor-pointer"
                    >
                      Listo
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {userName}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="text-slate-500 hover:text-cyan-400 text-xs transition-colors cursor-pointer"
                      title="Editar nombre"
                    >
                      ✎
                    </button>
                  </div>
                )}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-bold uppercase tracking-wider">
                  {stats.levelTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Historial de superación técnica, métricas de persistencia y acreditación de laboratorio.
              </p>
            </div>
          </div>

          {/* Quick Level Statistics Pill */}
          <div className="flex items-center gap-4 text-xs">
            <div className="px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Total XP</span>
              <strong className="text-cyan-400 text-base font-mono">{stats.totalXp} XP</strong>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Efectividad</span>
              <strong className="text-emerald-400 text-base font-mono">
                {stats.totalLabsCount > 0
                  ? Math.round((stats.completedLabsCount / stats.totalLabsCount) * 100)
                  : 0}
                %
              </strong>
            </div>
          </div>
        </div>

        {/* Global Level Progress Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-slate-300">Progreso a Nivel {stats.level + 1}</span>
              <span className="text-slate-500 font-normal">
                ({LEVEL_TIERS[Math.min(stats.level, LEVEL_TIERS.length - 1)].title})
              </span>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              <span className="text-cyan-400 font-bold">{stats.currentLevelXp}</span> / {stats.nextLevelXp} XP ({stats.progressPercent}%)
            </div>
          </div>

          <div className="w-full h-3.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 rounded-full transition-all duration-700 shadow-lg shadow-cyan-500/30"
              style={{ width: `${Math.max(4, stats.progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completed Labs */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Retos Superados</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-xl font-bold text-slate-100">
                {stats.completedLabsCount}
              </strong>
              <span className="text-xs text-slate-500">de {stats.totalLabsCount}</span>
            </div>
          </div>
        </div>

        {/* Total Time Spent */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Tiempo Total Dedicado</span>
            <strong className="text-xl font-bold text-cyan-300 font-mono mt-0.5 block">
              {formatDuration(stats.totalTimeSpentSeconds)}
            </strong>
          </div>
        </div>

        {/* Active Lab Live Timer */}
        <div className="p-4 rounded-xl border border-cyan-900/60 bg-cyan-950/20 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-900/60 border border-cyan-700/60 text-cyan-400 shrink-0 relative">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-cyan-400 font-semibold uppercase">Reto Activo</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-xs font-bold text-slate-200 truncate block mt-0.5">
              {activeScenario.themeName}
            </span>
            <span className="text-[11px] font-mono text-cyan-400 block">
              Sesión: {formatDuration(currentLabSessionSeconds)}
            </span>
          </div>
        </div>

        {/* Gamified Achievements Unlocked */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-800/60 text-amber-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Insignias Logradas</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-xl font-bold text-amber-300">
                {(stats.completedLabsCount >= 1 ? 1 : 0) +
                  (stats.completedLabsCount >= 3 ? 1 : 0) +
                  (stats.totalTimeSpentSeconds >= 1800 ? 1 : 0) +
                  (stats.totalXp >= 350 ? 1 : 0)}
              </strong>
              <span className="text-xs text-slate-500">de 4 insignias</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lab History & Filtering Section */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Historial Detallado de Laboratorios y Tiempo Invertido</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervisión de cada máquina: banderas capturadas, duración acumulada y acceso al diploma oficial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetProgress}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-rose-900/60 transition-colors cursor-pointer"
              title="Reiniciar contador de progreso"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Progreso</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, codename o vector de ataque..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({scenariosCatalog.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Completados ({stats.completedLabsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              En Curso
            </button>
          </div>

          {/* Difficulty Dropdown */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Cualquier Dificultad</option>
            <option value="Easy">Fácil (Easy)</option>
            <option value="Medium">Media (Medium)</option>
            <option value="Hard">Difícil (Hard)</option>
            <option value="Insane">Extrema (Insane)</option>
          </select>
        </div>

        {/* Labs List / Table */}
        <div className="space-y-3">
          {filteredScenarios.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                No se encontraron laboratorios con los filtros aplicados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDifficultyFilter('all');
                }}
                className="mt-3 text-xs text-cyan-400 hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            filteredScenarios.map((sc) => {
              const prog = progressMap[sc.codename] || {
                codename: sc.codename,
                userSolved: false,
                rootSolved: false,
                timeSpentSeconds: 0,
                points: 0,
              };

              const isCompleted = prog.userSolved && prog.rootSolved;
              const isActive = activeScenario.codename === sc.codename;
              const timeRatio = Math.min(100, Math.round((prog.timeSpentSeconds / maxLabTime) * 100));

              return (
                <div
                  key={sc.codename}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'border-cyan-500/80 bg-cyan-950/20 shadow-md shadow-cyan-950/30'
                      : isCompleted
                      ? 'border-emerald-900/60 bg-emerald-950/10 hover:border-emerald-700/60'
                      : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Lab Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {sc.codename}
                        </span>
                        <span className="text-slate-600">·</span>
                        <strong className="text-sm text-slate-100 font-semibold truncate">
                          {sc.themeName}
                        </strong>

                        {/* Difficulty badge */}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                            sc.difficulty === 'Insane'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                              : sc.difficulty === 'Hard'
                              ? 'bg-orange-950/80 text-orange-300 border-orange-800/80'
                              : sc.difficulty === 'Medium'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                          }`}
                        >
                          {sc.difficulty}
                        </span>

                        {isActive && (
                          <span className="text-[10px] font-mono bg-cyan-900/80 text-cyan-200 border border-cyan-700/80 px-2 py-0.5 rounded-full font-semibold">
                            EN EJECUCIÓN
                          </span>
                        )}

                        {isCompleted && (
                          <span className="text-[10px] font-mono bg-emerald-900/80 text-emerald-200 border border-emerald-700/80 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            SUPERADO
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-1">
                        <strong className="text-slate-300 font-medium">Vector:</strong> {sc.vector} · <strong className="text-slate-300 font-medium">SO:</strong> {sc.targetOS} · <span className="font-mono text-slate-500">{sc.ip}</span>
                      </p>

                      {/* Time Dedicated Bar */}
                      <div className="pt-1.5 flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px] shrink-0">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>Dedicado:</span>
                          <strong className="text-slate-200 font-bold">
                            {formatDuration(prog.timeSpentSeconds)}
                          </strong>
                        </div>

                        <div className="w-32 sm:w-48 h-2 bg-slate-900 rounded-full border border-slate-800 overflow-hidden shrink-0">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${Math.max(6, timeRatio)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Flags Status & Action Buttons */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                      {/* Interactive Flags Checkboxes */}
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => onToggleLabFlag(sc.codename, 'user')}
                          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
                            prog.userSolved
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Alternar estado de user.txt"
                        >
                          <span className={prog.userSolved ? 'text-cyan-400' : 'text-slate-600'}>
                            {prog.userSolved ? '✓' : '○'}
                          </span>
                          <span>user.txt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleLabFlag(sc.codename, 'root')}
                          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
                            prog.rootSolved
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Alternar estado de root.txt"
                        >
                          <span className={prog.rootSolved ? 'text-rose-400' : 'text-slate-600'}>
                            {prog.rootSolved ? '✓' : '○'}
                          </span>
                          <span>root.txt</span>
                        </button>
                      </div>

                      {/* Diploma Button if Completed */}
                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() => onOpenDiploma(sc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-950/40 transition-all cursor-pointer whitespace-nowrap"
                          title="Ver y descargar certificado oficial de superación"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Diploma</span>
                        </button>
                      ) : null}

                      {/* Select / Load Button */}
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => onSelectScenario(sc)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                          title="Cargar este laboratorio en la aplicación"
                        >
                          <span>Practicar</span>
                          <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-cyan-400 font-mono px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/80 font-bold">
                          ACTIVO
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
