import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  Flag,
  Shield,
  Layers,
  Sparkles,
  Server,
  Zap,
  CheckCircle2,
  RefreshCw,
  FolderArchive,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { CTFScenario } from '../types';

interface LabStatsViewProps {
  currentScenario: CTFScenario;
  scenariosCatalog: CTFScenario[];
  totalFlagsGenerated: number;
  onSelectScenario?: (scenario: CTFScenario) => void;
  onIncrementFlags?: () => void;
}

export const LabStatsView: React.FC<LabStatsViewProps> = ({
  currentScenario,
  scenariosCatalog,
  totalFlagsGenerated,
  onSelectScenario,
  onIncrementFlags,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'scifi' | 'fantasy' | 'horror' | 'cyberpunk' | 'tv_series'>('all');
  const [activeDifficulty, setActiveDifficulty] = useState<'all' | 'Easy' | 'Medium' | 'Hard' | 'Insane'>('all');

  // Compute difficulty distribution
  const difficultyCounts = scenariosCatalog.reduce(
    (acc, item) => {
      const diff = item.difficulty || 'Medium';
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const difficultyData = [
    { name: 'Fácil (Easy)', key: 'Easy', count: difficultyCounts['Easy'] || 0, color: '#10b981' },
    { name: 'Medio (Medium)', key: 'Medium', count: difficultyCounts['Medium'] || 0, color: '#f59e0b' },
    { name: 'Difícil (Hard)', key: 'Hard', count: difficultyCounts['Hard'] || 0, color: '#f97316' },
    { name: 'Extremo (Insane)', key: 'Insane', count: difficultyCounts['Insane'] || 0, color: '#f43f5e' },
  ];

  // Attack Vector Families
  const vectorFamilyCounts: Record<string, number> = {
    'SSTI / Plantillas': 0,
    'SQL Injection': 0,
    'Deserialización Insegura': 0,
    'LFI / Inclusión de Archivos': 0,
    'SMB / Recursos Compartidos': 0,
    'Inyección de Comandos OS': 0,
    'Tokens JWT Manipulados': 0,
    'Otros / Específicos': 0,
  };

  scenariosCatalog.forEach((item) => {
    const v = (item.vector || '').toLowerCase();
    if (v.includes('ssti') || v.includes('plantilla') || v.includes('jinja')) {
      vectorFamilyCounts['SSTI / Plantillas']++;
    } else if (v.includes('sql') || v.includes('sqli')) {
      vectorFamilyCounts['SQL Injection']++;
    } else if (v.includes('deserial') || v.includes('pickle')) {
      vectorFamilyCounts['Deserialización Insegura']++;
    } else if (v.includes('lfi') || v.includes('inclusion') || v.includes('inclusión')) {
      vectorFamilyCounts['LFI / Inclusión de Archivos']++;
    } else if (v.includes('smb') || v.includes('samba')) {
      vectorFamilyCounts['SMB / Recursos Compartidos']++;
    } else if (v.includes('command') || v.includes('comando')) {
      vectorFamilyCounts['Inyección de Comandos OS']++;
    } else if (v.includes('jwt')) {
      vectorFamilyCounts['Tokens JWT Manipulados']++;
    } else {
      vectorFamilyCounts['Otros / Específicos']++;
    }
  });

  const vectorData = Object.entries(vectorFamilyCounts).map(([name, count]) => ({
    name,
    cantidad: count,
  })).sort((a, b) => b.cantidad - a.cantidad);

  // Privilege Escalation Techniques
  const privescCounts: Record<string, number> = {
    'SUID & Path Hijacking': 0,
    'Linux Capabilities': 0,
    'LD_PRELOAD Injection': 0,
    'Sudo NOPASSWD': 0,
    'Docker Socket': 0,
    'Cronjob & Wildcards': 0,
    'Buffer Overflow': 0,
  };

  scenariosCatalog.forEach((item) => {
    const p = (item.secondaryVector || '').toLowerCase();
    if (p.includes('path') || p.includes('secuestro de ruta') || p.includes('suid')) {
      privescCounts['SUID & Path Hijacking']++;
    } else if (p.includes('capability') || p.includes('cap_setuid') || p.includes('capacidades')) {
      privescCounts['Linux Capabilities']++;
    } else if (p.includes('preload') || p.includes('biblioteca')) {
      privescCounts['LD_PRELOAD Injection']++;
    } else if (p.includes('nopasswd') || p.includes('sudo')) {
      privescCounts['Sudo NOPASSWD']++;
    } else if (p.includes('docker') || p.includes('socket')) {
      privescCounts['Docker Socket']++;
    } else if (p.includes('cron') || p.includes('wildcard') || p.includes('tar')) {
      privescCounts['Cronjob & Wildcards']++;
    } else if (p.includes('buffer') || p.includes('overflow') || p.includes('desbordamiento')) {
      privescCounts['Buffer Overflow']++;
    }
  });

  const privescData = Object.entries(privescCounts).map(([name, count]) => ({
    name,
    frecuencia: count,
  })).sort((a, b) => b.frecuencia - a.frecuencia);

  // Genre distribution
  const genreLabels: Record<string, string> = {
    tv_series: 'Series de TV',
    scifi: 'Ciencia Ficción',
    fantasy: 'Fantasía',
    horror: 'Terror',
    cyberpunk: 'Cyberpunk',
    custom: 'Personalizado',
  };

  const genreCounts: Record<string, number> = {};
  scenariosCatalog.forEach((item) => {
    const g = item.genre || 'custom';
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });

  const genreData = Object.entries(genreCounts).map(([gKey, count]) => ({
    genre: genreLabels[gKey] || gKey,
    retos: count,
  }));

  // Total hints count
  const totalHintsInCatalog = scenariosCatalog.reduce(
    (acc, item) => acc + (item.hints?.length || 6),
    0
  );

  const filteredCatalog = scenariosCatalog.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.genre === activeCategory;
    const matchesDifficulty = activeDifficulty === 'all' || item.difficulty === activeDifficulty;
    return matchesCategory && matchesDifficulty;
  });

  // Custom Dark Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="font-semibold text-slate-200">{label || payload[0].name}</p>
          <p className="text-cyan-400 font-mono">
            {payload[0].dataKey || 'Valor'}: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Overview Header */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-slate-100">
                Estadísticas del Laboratorio y Métricas de Escenarios
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualización analítica de retos, diversidad de vectores de explotación ofensiva y registro criptográfico de banderas.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-mono">
              Catálogo: <strong className="text-slate-200">{scenariosCatalog.length}</strong> escenarios
            </span>
          </div>
        </div>

        {/* 4 Metric Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {/* Total Flags Counter Card */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Banderas Totales
              </span>
              <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                <Flag className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-cyan-300">
                {totalFlagsGenerated}
              </span>
              <span className="text-[11px] text-slate-500">banderas generadas</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
              <span>Usuario: {Math.floor(totalFlagsGenerated / 2)}</span>
              <span>Root: {Math.ceil(totalFlagsGenerated / 2)}</span>
            </div>
          </div>

          {/* Scenarios in Lab Card */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Escenarios Activos
              </span>
              <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-amber-300">
                {scenariosCatalog.length}
              </span>
              <span className="text-[11px] text-slate-500">máquinas virtuales</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
              <span>5 géneros narrativos</span>
              <span className="text-emerald-400">100% Dockerizables</span>
            </div>
          </div>

          {/* Gradual Hints Counter Card */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pistas Graduales
              </span>
              <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-300">
                {totalHintsInCatalog}
              </span>
              <span className="text-[11px] text-slate-500">pistas escalonadas</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
              <span>Niveles 1, 2 y 3</span>
              <span className="text-slate-400 font-mono">Anti-spoilers</span>
            </div>
          </div>

          {/* Network Surface Card */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Máquina Seleccionada
              </span>
              <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/40">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div className="truncate font-semibold text-sm text-slate-200">
              {currentScenario.codename}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
              <span>{currentScenario.difficulty}</span>
              <span>{currentScenario.ip}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid: 2 Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Distribution of Difficulty Levels (Pie/Donut Chart) */}
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">
                Distribución por Niveles de Dificultad
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Equilibrio pedagógico desde nivel introductorio hasta retos extremos
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Donut Chart</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {difficultyData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-slate-300 font-medium mr-2">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Difficulty Quick Clickable Badges */}
          <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
              <span className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-cyan-400" />
                <span>Haz clic para filtrar por nivel:</span>
              </span>
              {activeDifficulty !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveDifficulty('all')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  Ver todos
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
              {difficultyData.map((d) => {
                const isSelected = activeDifficulty === d.key;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => {
                      setActiveDifficulty(isSelected ? 'all' : (d.key as any));
                      const catSection = document.getElementById('catalog-section');
                      if (catSection) {
                        catSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }}
                    className={`p-2 rounded-lg border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-400 shadow-md ring-2 ring-cyan-500/40'
                        : 'bg-slate-950 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                    title={`Filtrar retos por dificultad ${d.name}`}
                  >
                    <span className="text-[10px] block text-slate-400 font-sans truncate">
                      {d.key}
                    </span>
                    <span className="font-bold text-sm" style={{ color: d.color }}>
                      {d.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2: Common Attack Vectors (Horizontal Bar Chart) */}
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">
                Tipos de Vectores de Ataque más Comunes
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Vectores de acceso inicial (foothold) clasificados por familia de vulnerabilidad
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Bar Chart</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vectorData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={10}
                  width={140}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Vector predominante: <strong className="text-cyan-300">Inyecciones (SSTI & SQLi)</strong></span>
            <span className="text-slate-500 font-mono">OWASP Top 10</span>
          </div>
        </div>
      </div>

      {/* Chart 3: Privilege Escalation Techniques & Genre Diversity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PrivEsc Bar Chart */}
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">
                Técnicas de Escalada de Privilegios (PrivEsc)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mecanismos locales para elevación a usuario root
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400">Horizontal Bar</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={privescData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={10}
                  width={140}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="frecuencia" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Narrative Genres Distribution */}
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">
                Distribución por Géneros Narrativos
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Variedad temática de universos ficticios y series
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">Vertical Bars</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={genreData}
                margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="genre" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="retos" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Catalog & Quick Loader Section */}
      <div id="catalog-section" className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
        {/* Header of catalog with challenge counters and reset button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-200">
                Catálogo de Escenarios Disponibles
              </h4>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                {filteredCatalog.length} de {scenariosCatalog.length} retos
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Haz clic en cualquier tarjeta para cargar el laboratorio directamente en el espacio de trabajo
            </p>
          </div>

          {/* Reset Filters button if any filter active */}
          {(activeDifficulty !== 'all' || activeCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setActiveDifficulty('all');
                setActiveCategory('all');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-300 bg-amber-950/50 hover:bg-amber-950/80 rounded-lg border border-amber-700/60 transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Advanced Filters Toolbar */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3 shadow-inner">
          {/* Row 1: Clickable Difficulty Tags (Easy, Medium, Hard, Insane) */}
          <div className="flex flex-col md:flex-row md:items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dificultad:</span>
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {/* All Difficulties Tag */}
              <button
                type="button"
                onClick={() => setActiveDifficulty('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeDifficulty === 'all'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-sm shadow-cyan-950/60 font-semibold ring-1 ring-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                <span>Todas</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950/90 text-slate-400">
                  {scenariosCatalog.length}
                </span>
              </button>

              {/* Easy Tag */}
              <button
                type="button"
                onClick={() => setActiveDifficulty(activeDifficulty === 'Easy' ? 'all' : 'Easy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeDifficulty === 'Easy'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 shadow-sm shadow-emerald-950/50 font-semibold ring-1 ring-emerald-500/50'
                    : 'text-emerald-400/90 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-900/60'
                }`}
                title="Filtrar por nivel Fácil (Easy)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Fácil (Easy)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  {difficultyCounts['Easy'] || 0}
                </span>
              </button>

              {/* Medium Tag */}
              <button
                type="button"
                onClick={() => setActiveDifficulty(activeDifficulty === 'Medium' ? 'all' : 'Medium')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeDifficulty === 'Medium'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500 shadow-sm shadow-amber-950/50 font-semibold ring-1 ring-amber-500/50'
                    : 'text-amber-400/90 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-950/60 border border-amber-900/60'
                }`}
                title="Filtrar por nivel Medio (Medium)"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Medio (Medium)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/60">
                  {difficultyCounts['Medium'] || 0}
                </span>
              </button>

              {/* Hard Tag */}
              <button
                type="button"
                onClick={() => setActiveDifficulty(activeDifficulty === 'Hard' ? 'all' : 'Hard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeDifficulty === 'Hard'
                    ? 'bg-orange-950 text-orange-300 border border-orange-500 shadow-sm shadow-orange-950/50 font-semibold ring-1 ring-orange-500/50'
                    : 'text-orange-400/90 hover:text-orange-300 bg-orange-950/30 hover:bg-orange-950/60 border border-orange-900/60'
                }`}
                title="Filtrar por nivel Difícil (Hard)"
              >
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span>Difícil (Hard)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-950 text-orange-400 border border-orange-800/60">
                  {difficultyCounts['Hard'] || 0}
                </span>
              </button>

              {/* Insane Tag */}
              <button
                type="button"
                onClick={() => setActiveDifficulty(activeDifficulty === 'Insane' ? 'all' : 'Insane')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeDifficulty === 'Insane'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500 shadow-sm shadow-rose-950/50 font-semibold ring-1 ring-rose-500/50'
                    : 'text-rose-400/90 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/60'
                }`}
                title="Filtrar por nivel Extremo (Insane)"
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span>Extremo (Insane)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800/60">
                  {difficultyCounts['Insane'] || 0}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: Genre Pills */}
          <div className="flex flex-col md:flex-row md:items-center gap-2.5 pt-2.5 border-t border-slate-800/70">
            <span className="text-xs font-semibold text-slate-400 shrink-0">
              Género temático:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5">
              {[
                { id: 'all', label: 'Todos los Géneros' },
                { id: 'tv_series', label: 'Series TV' },
                { id: 'scifi', label: 'Ciencia Ficción' },
                { id: 'fantasy', label: 'Fantasía' },
                { id: 'horror', label: 'Terror' },
                { id: 'cyberpunk', label: 'Cyberpunk' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-slate-800 text-cyan-300 font-semibold border border-cyan-800/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State when no challenge matches filters */}
        {filteredCatalog.length === 0 ? (
          <div className="py-12 px-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-3">
            <div className="inline-flex p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
              <FolderArchive className="w-6 h-6 text-slate-500" />
            </div>
            <h5 className="text-sm font-semibold text-slate-200">
              No hay retos que coincidan con los filtros seleccionados
            </h5>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No se han encontrado escenarios con dificultad &quot;{activeDifficulty}&quot; en la categoría &quot;{genreLabels[activeCategory] || activeCategory}&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveDifficulty('all');
                setActiveCategory('all');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ver todos los escenarios ({scenariosCatalog.length})</span>
            </button>
          </div>
        ) : (
          /* Challenge Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCatalog.map((item) => {
            const isSelected = item.codename === currentScenario.codename;
            return (
              <div
                key={item.codename}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/30 shadow-md'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {item.codename}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                        item.difficulty === 'Easy'
                          ? 'text-emerald-400 border-emerald-800 bg-emerald-950/50'
                          : item.difficulty === 'Medium'
                          ? 'text-amber-400 border-amber-800 bg-amber-950/50'
                          : item.difficulty === 'Hard'
                          ? 'text-orange-400 border-orange-800 bg-orange-950/50'
                          : 'text-rose-400 border-rose-800 bg-rose-950/50'
                      }`}
                    >
                      {item.difficulty}
                    </span>
                  </div>

                  <h5 className="font-semibold text-xs text-slate-100 line-clamp-1">
                    {item.themeName}
                  </h5>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.story}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">{item.ip}</span>
                  {isSelected ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> En Edición
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectScenario?.(item)}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                    >
                      <span>Cargar reto</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};
