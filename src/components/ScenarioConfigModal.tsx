import React, { useState } from 'react';
import { X, Sparkles, Film, Rocket, Flame, Skull, Cpu, Info, RefreshCw } from 'lucide-react';
import { DifficultyLevel } from '../types';

interface ScenarioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: any) => Promise<void>;
  isGenerating: boolean;
}

export const ScenarioConfigModal: React.FC<ScenarioConfigModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [themePreset, setThemePreset] = useState<string>('mr-robot');
  const [customThemeName, setCustomThemeName] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [vector, setVector] = useState<string>('SSTI (Server-Side Template Injection) en Jinja2');
  const [secondaryVector, setSecondaryVector] = useState<string>('SUID en Binario Custom con Path Hijacking');
  const [targetOS, setTargetOS] = useState<string>('Debian 12 Bookworm');
  const [flagPrefix, setFlagPrefix] = useState<string>('CTF');
  const [customNotes, setCustomNotes] = useState<string>('');

  if (!isOpen) return null;

  const genres = [
    { id: 'all', label: 'Todos los Géneros', icon: Sparkles },
    { id: 'scifi', label: 'Ciencia Ficción', icon: Rocket },
    { id: 'fantasy', label: 'Fantasía', icon: Flame },
    { id: 'horror', label: 'Terror & Biohazard', icon: Skull },
    { id: 'cyberpunk', label: 'Cyberpunk', icon: Cpu },
    { id: 'tv_series', label: 'Series de TV', icon: Film },
  ];

  const presets = [
    // Sci-Fi
    {
      id: 'the-matrix',
      name: 'The Matrix',
      genre: 'scifi',
      lore: 'Pasarela clandestina de la Nabucodonosor transmitiendo señales piratas a la Matriz.',
      atmosphere: 'Consola verde fósforo, trazas de código cayendo, avisos de Operador de Zion.',
      flagSuggestion: 'CTF{wh1t3_r4bb1t_f0ll0w_th3_c0d3} / CTF{th3_0n3_n30_unplug_fr0m_m4tr1x}',
      defaultVector: 'Command Injection en Daemon de Sintonización de Emisiones',
      defaultPrivesc: 'Explotación de binario con Linux Capability cap_setuid en Python',
      defaultOS: 'Debian 12 Bookworm',
    },
    {
      id: 'weyland-yutani',
      name: 'Alien (Nostromo)',
      genre: 'scifi',
      lore: 'Computadora central MU-TH-UR 6000 ejecutando la Orden Especial 937 (tripulación prescindible).',
      atmosphere: 'Pantallas CRT monocromáticas ámbar de los años 70, protocolos de despresurización criogénica.',
      flagSuggestion: 'CTF{w3yl4nd_yut4n1_0rd3r_937} / CTF{x3n0m0rph_p3rf3ct_0rg4n15m}',
      defaultVector: 'SQLi Ciega basada en booleanos en Endpoint de Monitoreo Criogénico',
      defaultPrivesc: 'Cronjob desatendido ejecutando script con comodín tar wildcard',
      defaultOS: 'Debian 12 Bookworm',
    },
    // Fantasy
    {
      id: 'kaer-morhen',
      name: 'The Witcher',
      genre: 'fantasy',
      lore: 'Bóveda secreta de Kaer Morhen con los mutágenos y fórmulas de la Prueba de las Hierbas.',
      atmosphere: 'Manuscritos pergamino digitalizados, runas en PHP, base de datos SQLite de bestias.',
      flagSuggestion: 'CTF{wh1t3_w0lf_tr14l_0f_gr45535} / CTF{v353m1r_4nc13nt_w1tch3r_m45t3r}',
      defaultVector: 'LFI (Local File Inclusion) a RCE con Log Poisoning en PHP',
      defaultPrivesc: 'Sudo sin contraseña (NOPASSWD) en script de destilación alquímica',
      defaultOS: 'Ubuntu 24.04 LTS',
    },
    {
      id: 'mordor-relay',
      name: 'El Señor de los Anillos',
      genre: 'fantasy',
      lore: 'Malla de comunicación de los Palantíri entre Barad-dûr y las fortalezas orcas.',
      atmosphere: 'Lengua Negra de Mordor en cabeceras de red, runas volcánicas y API de los Nazgûl.',
      flagSuggestion: 'CTF{0n3_r1ng_t0_rul3_th3m_4ll} / CTF{54ur0n_3y3_5335_4ll_m0rd0r}',
      defaultVector: 'JWT con Algoritmo "none" y Manipulación de Reclamaciones (Claims)',
      defaultPrivesc: 'Vulnerabilidad de Desbordamiento de Búfer en binario SUID de forja orca',
      defaultOS: 'Ubuntu 24.04 LTS',
    },
    // Horror
    {
      id: 'resident-evil',
      name: 'Resident Evil (Umbrella)',
      genre: 'horror',
      lore: 'Subnivel 6 de la Colmena en Raccoon City. La Reina Roja ha aislado las instalaciones.',
      atmosphere: 'Alertas de Biohazard en rojo carmesí, registros de infectados y cámaras de descontaminación.',
      flagSuggestion: 'CTF{r3d_qu33n_y0u_4r3_4ll_g01ng_t0_d13} / CTF{t_v1ru5_g_v1ru5_n3m3515_r00t}',
      defaultVector: 'Servicios SMBv1 Obsoletos con Acceso Anónimo a Volcados',
      defaultPrivesc: 'Secuestro de biblioteca dinámica LD_PRELOAD en ejecutable de presurización',
      defaultOS: 'Debian 12 Bookworm',
    },
    {
      id: 'stranger-things',
      name: 'Stranger Things',
      genre: 'horror',
      lore: 'Pasarela del Laboratorio Nacional de Hawkins conectando telemetría del Mundo del Revés.',
      atmosphere: 'Laboratorio militar de los 80, registros del Dr. Brenner y luces parpadeantes.',
      flagSuggestion: 'CTF{h4wk1n5_l4b_up51d3_d0wn} / CTF{3l3v3n_w4ffl35_m1ndfl4y3r}',
      defaultVector: 'Servicio SMBv1 / Samba con Acceso Anónimo a Backups',
      defaultPrivesc: 'Capacidades de Linux mal configuradas (cap_setuid en python3)',
      defaultOS: 'Alpine Linux 3.20 (Minimal)',
    },
    // Cyberpunk
    {
      id: 'blade-runner',
      name: 'Blade Runner',
      genre: 'cyberpunk',
      lore: 'Bóveda de genética Nexus de Tyrell Corp. Evaluación de empatía Voight-Kampff.',
      atmosphere: 'Neón lluvioso, preguntas psicométricas de dilatación pupilar y lluvia ácida.',
      flagSuggestion: 'CTF{t34r5_1n_r41n_t1m3_t0_d13} / CTF{m0r3_hum4n_th4n_hum4n}',
      defaultVector: 'Deserialización Insegura con Pickle en API Replicante',
      defaultPrivesc: 'Socket de Docker expuesto al usuario (/var/run/docker.sock)',
      defaultOS: 'Ubuntu 24.04 LTS',
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk: Edgerunners',
      genre: 'cyberpunk',
      lore: 'Subnivel 4 de la torre Arasaka en Night City. ICE y telemetría de ciberimplantes.',
      atmosphere: 'Glow amarillo y cian, alertas de Sandevistan y protocolos de Trauma Team.',
      flagSuggestion: 'CTF{n1ght_c1ty_54nd3v15t4n_pwn} / CTF{m1k05h1_50ulk1ll3r_r00t}',
      defaultVector: 'Deserialización Insegura en API de Telemetría de Ciberimplantes',
      defaultPrivesc: 'Secuestro de biblioteca dinámica LD_PRELOAD en ejecutable de seguridad',
      defaultOS: 'Ubuntu 24.04 LTS',
    },
    // TV Series
    {
      id: 'mr-robot',
      name: 'Mr. Robot',
      genre: 'tv_series',
      lore: 'Terminal bancario E-Coin de Evil Corp y canal encubierto de Fsociety tras el 9 de mayo.',
      atmosphere: 'Monocromo oscuro corporativo, mensajes cifrados de Elliot Alderson y White Rose.',
      flagSuggestion: 'CTF{3v1l_c0rp_3c01n_t3mpl4t3_pwn3d} / CTF{d4rk_4rmy_wh1t3r053_m45t3r}',
      defaultVector: 'SSTI (Server-Side Template Injection) en Jinja2/Flask',
      defaultPrivesc: 'Escalada de privilegios mediante binario SUID con secuestro de ruta (Path Hijacking)',
      defaultOS: 'Debian 12 Bookworm',
    },
    {
      id: 'severance',
      name: 'Severance',
      genre: 'tv_series',
      lore: 'Consola de Refinamiento de Macrodatos (MDR) de Lumon Industries y números aterradores.',
      atmosphere: 'Oficina retro-minimalista verde menta, preceptos de Kier Eagan y tarjetas de protocolo.',
      flagSuggestion: 'CTF{pr4153_k13r_m4cr0d4t4_r3f1n3m3nt} / CTF{0v3rt1m3_c0nt1ng3ncy_pr0t0c0l}',
      defaultVector: 'SQLi Ciega basada en tiempo en Endpoint de Cuadrícula',
      defaultPrivesc: 'Sudo sin contraseña (NOPASSWD) en script de rotación de logs',
      defaultOS: 'Ubuntu 24.04 LTS',
    },
    {
      id: 'breaking-bad',
      name: 'Breaking Bad',
      genre: 'tv_series',
      lore: 'Portal logístico de Los Pollos Hermanos y envíos encubiertos de metilamina.',
      atmosphere: 'Amarillo Nuevo México, órdenes de Madrigal Electromotive y recetas de rebozado.',
      flagSuggestion: 'CTF{l05_p0ll05_h3rm4n05_1d0r} / CTF{1_4m_th3_0n3_wh0_kn0ck5}',
      defaultVector: 'IDOR & Carga Arbitraria de Archivos en Albaranes',
      defaultPrivesc: 'Cronjob de sincronización ejecutando script con permisos de escritura',
      defaultOS: 'Debian 12 Bookworm',
    },
    {
      id: 'big-bang-theory',
      name: 'The Big Bang Theory',
      genre: 'tv_series',
      lore: 'Supercomputador de Sheldon Cooper en Caltech con simulaciones de cuerdas y su Nobel.',
      atmosphere: 'Pizarras con física cuántica, Bazinga, cómics raros y contratos de compañeros de piso.',
      flagSuggestion: 'CTF{b4z1ng4_5h3ld0n_c00p3r_qu4ntum} / CTF{str1ng_th30ry_n0b3l_r00t}',
      defaultVector: 'Command Injection en Calculadora Cuántica de Caltech',
      defaultPrivesc: 'Secuestro de biblioteca compartida en binario SUID de nitrógeno líquido',
      defaultOS: 'Debian 12 Bookworm',
    },
    {
      id: 'lost-dharma',
      name: 'Lost (Iniciativa Dharma)',
      genre: 'tv_series',
      lore: 'Terminal Apple II de la Estación 3 (El Cisne). Hay que teclear 4 8 15 16 23 42 cada 108 min.',
      atmosphere: 'Contador electromagnético regresivo, logotipo Dharma, estática y cinta analógica.',
      flagSuggestion: 'CTF{4_8_15_16_23_42_dh4rm4_15l4nd} / CTF{5w4n_3l3ctr0m4gn3t1c_f41l54f3_r00t}',
      defaultVector: 'Buffer Overflow en Intérprete de Números 4 8 15 16 23 42 (Puerto 108 TCP)',
      defaultPrivesc: 'Permiso NOPASSWD en el script failsafe_protocol.sh del campo electromagnético',
      defaultOS: 'Ubuntu 24.04 LTS',
    },
    {
      id: 'x-files',
      name: 'The X-Files (Archivos X)',
      genre: 'tv_series',
      lore: 'Bóveda clasificada del FBI con informes de avistamientos de Mulder y Scully.',
      atmosphere: 'Linternas, póster I Want to Believe, expedientes confidenciales y El Fumador.',
      flagSuggestion: 'CTF{th3_truth_15_0ut_th3r3_mul5cully} / CTF{c1g4r3tt3_5m0k1ng_m4n_r00t}',
      defaultVector: 'SQL Injection en Buscador de Archivos Clasificados Forenses',
      defaultPrivesc: 'Capacidades de Linux mal configuradas (cap_setuid) en visor de microfichas',
      defaultOS: 'Debian 12 Bookworm',
    },
    {
      id: 'game-of-thrones',
      name: 'Game of Thrones (Varys)',
      genre: 'tv_series',
      lore: 'Red de pajaritos de Lord Varys interceptando cuervos cifrados en la Fortaleza Roja.',
      atmosphere: 'Pergaminos con sellos de cera, mapas medievales, fuego valyrio y susurros de corte.',
      flagSuggestion: 'CTF{w1nt3r_15_c0m1ng_h0u53_5t4rk} / CTF{dr4c4ry5_v4lyr14n_f1r3_r00t}',
      defaultVector: 'Inyección XXE (XML External Entity) en Receptor de Cuervos Digitales',
      defaultPrivesc: 'Sudo NOPASSWD en el script de forja de fuego valyrio del piromante',
      defaultOS: 'Ubuntu 24.04 LTS',
    },
    {
      id: 'silicon-valley',
      name: 'Silicon Valley (Pied Piper)',
      genre: 'tv_series',
      lore: 'Clúster casero Anton de Gilfoyle corriendo el algoritmo de compresión Middle-Out.',
      atmosphere: 'Racks de servidor caseros, gráficas del Weissman Score y ataques contra Hooli.',
      flagSuggestion: 'CTF{m1ddl3_0ut_c0mpr35510n_w3155m4n} / CTF{4nt0n_g1lf0yl3_d0ck3r_35c4p3}',
      defaultVector: 'Deserialización Insegura de Métricas Weissman en Microservicio Flask',
      defaultPrivesc: 'Socket de Docker (/var/run/docker.sock) expuesto sin permisos de grupo',
      defaultOS: 'Debian 12 Bookworm',
    },
    {
      id: 'custom',
      name: 'Tema Personalizado',
      genre: 'custom',
      lore: 'Define tu propio universo cinematográfico, literario o corporativo.',
      atmosphere: 'Personalizable según las directrices del docente u organizador.',
      flagSuggestion: 'CTF{custom_user_token} / CTF{custom_root_token}',
      defaultVector: 'SSTI (Server-Side Template Injection) en Jinja2',
      defaultPrivesc: 'Escalada de privilegios mediante binario SUID con secuestro de ruta (Path Hijacking)',
      defaultOS: 'Debian 12 Bookworm',
    },
  ];

  const filteredPresets = presets.filter((p) => {
    if (selectedGenre === 'all') return true;
    return p.genre === selectedGenre;
  });

  const selectedPresetObj = presets.find((p) => p.id === themePreset) || presets[0];

  const handleSelectPreset = (pId: string) => {
    setThemePreset(pId);
    const p = presets.find((x) => x.id === pId);
    if (p && pId !== 'custom') {
      setCustomThemeName('');
      setVector(p.defaultVector);
      setSecondaryVector(p.defaultPrivesc);
      setTargetOS(p.defaultOS);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGenerate({
      theme: themePreset,
      genre: selectedPresetObj.genre,
      customThemeName: themePreset === 'custom' ? customThemeName : '',
      difficulty,
      vector,
      secondaryVector,
      targetOS,
      flagPrefix,
      customNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Diseñador de Escenarios CTF: Narrativas y Ambientación
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Genre Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Género Narrativo del Reto
              </label>
              <span className="text-[11px] text-slate-500 font-mono">11 Presets Temáticos + Modo Personalizado</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {genres.map((g) => {
                const Icon = g.icon;
                const isSelected = selectedGenre === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGenre(g.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Presets Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Seleccionar Universo Narrativo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {filteredPresets.map((p) => {
                const isSelected = themePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/50 text-cyan-200 shadow-md'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {p.lore}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lore & Atmosphere Preview Card */}
          {selectedPresetObj.id !== 'custom' && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>Ambientación y Sugerencias de Banderas ({selectedPresetObj.name}):</span>
              </div>
              <div className="text-slate-300 leading-relaxed">
                <strong className="text-slate-400">Atmósfera:</strong> {selectedPresetObj.atmosphere}
              </div>
              <div className="font-mono text-slate-400">
                <strong className="text-slate-400 font-sans">Banderas temáticas sugeridas:</strong>{' '}
                <span className="text-cyan-300">{selectedPresetObj.flagSuggestion}</span>
              </div>
            </div>
          )}

          {/* Custom Theme Name Input (if custom selected) */}
          {themePreset === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre o Universo de la Temática
              </label>
              <input
                type="text"
                value={customThemeName}
                onChange={(e) => setCustomThemeName(e.target.value)}
                placeholder="Ejemplo: Interstellar, Cyberpunk Edgerunners, Dune..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          )}

          {/* Difficulty Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nivel de Dificultad
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Easy', 'Medium', 'Hard', 'Insane'] as DifficultyLevel[]).map((lvl) => {
                const isSelected = difficulty === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 text-center rounded-lg border font-semibold transition-all ${
                      isSelected
                        ? lvl === 'Easy'
                          ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300'
                          : lvl === 'Medium'
                          ? 'border-amber-500 bg-amber-950/50 text-amber-300'
                          : lvl === 'Hard'
                          ? 'border-orange-500 bg-orange-950/50 text-orange-300'
                          : 'border-rose-500 bg-rose-950/50 text-rose-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vector Inicial (Foothold)
              </label>
              <input
                type="text"
                value={vector}
                onChange={(e) => setVector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Escalada de Privilegios (PrivEsc)
              </label>
              <input
                type="text"
                value={secondaryVector}
                onChange={(e) => setSecondaryVector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* OS & Flag Prefix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sistema Operativo Objetivo
              </label>
              <select
                value={targetOS}
                onChange={(e) => setTargetOS(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Debian 12 Bookworm">Debian 12 Bookworm</option>
                <option value="Ubuntu 24.04 LTS">Ubuntu 24.04 LTS</option>
                <option value="Alpine Linux 3.20 (Minimal)">Alpine Linux 3.20 (Minimal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Prefijo de Banderas (Formato, ej. CTF)
              </label>
              <input
                type="text"
                value={flagPrefix}
                onChange={(e) => setFlagPrefix(e.target.value)}
                placeholder="CTF, HTB, CYBER..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Instrucciones Didácticas Adicionales para Gemini
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Ejemplo: Diseñar pistas adicionales para alumnos principiantes o aislar la red en 10.10.120.0/24..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl transition-colors cursor-pointer shadow-lg shadow-cyan-950/50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Estructurando Reto y Pistas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Generar Escenario Completo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
