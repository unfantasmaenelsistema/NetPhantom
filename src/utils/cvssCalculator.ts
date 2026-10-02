import { CVSSVector, CVSSScoreResult, CVSSSeverity, CTFScenario } from '../types';

export const CVSS_METRICS_INFO = {
  av: {
    name: 'Vector de Ataque (Attack Vector)',
    options: [
      { id: 'N', label: 'Network (N)', score: '0.85', desc: 'Explotable de forma remota a través de la red (Internet/LAN)' },
      { id: 'A', label: 'Adjacent (A)', score: '0.62', desc: 'Requiere acceso a la misma red física/lógica (subred local, Bluetooth)' },
      { id: 'L', label: 'Local (L)', score: '0.55', desc: 'Requiere acceso shell o consola local en el sistema objetivo' },
      { id: 'P', label: 'Physical (P)', score: '0.20', desc: 'Requiere interacción física directa con el hardware' },
    ],
  },
  ac: {
    name: 'Complejidad del Ataque (Attack Complexity)',
    options: [
      { id: 'L', label: 'Low (L)', score: '0.77', desc: 'Condiciones de explotación repetibles sin depender de condiciones de carrera' },
      { id: 'H', label: 'High (H)', score: '0.44', desc: 'Requiere eludir mitigaciones complejas (ASLR, DEP, bypass de canary)' },
    ],
  },
  pr: {
    name: 'Privilegios Requeridos (Privileges Required)',
    options: [
      { id: 'N', label: 'None (N)', score: '0.85', desc: 'No requiere autenticación previa en el servicio ni permisos' },
      { id: 'L', label: 'Low (L)', score: '0.62 / 0.68', desc: 'Requiere credenciales de usuario básico no privilegiado' },
      { id: 'H', label: 'High (H)', score: '0.27 / 0.50', desc: 'Requiere privilegios administrativos previos' },
    ],
  },
  ui: {
    name: 'Interacción del Usuario (User Interaction)',
    options: [
      { id: 'N', label: 'None (N)', score: '0.85', desc: 'El ataque no requiere acción alguna por parte de una víctima' },
      { id: 'R', label: 'Required (R)', score: '0.62', desc: 'Requiere que una víctima haga clic en un enlace o abra un archivo' },
    ],
  },
  s: {
    name: 'Alcance / Impacto en el Entorno (Scope)',
    options: [
      { id: 'U', label: 'Unchanged (U)', score: '1.0', desc: 'El impacto se restringe a la autoridad de seguridad del componente' },
      { id: 'C', label: 'Changed (C)', score: '1.08', desc: 'Afecta a componentes externos (ej: escape de contenedor Docker al host)' },
    ],
  },
  c: {
    name: 'Confidencialidad (Confidentiality)',
    options: [
      { id: 'H', label: 'High (H)', score: '0.56', desc: 'Exfiltración total de datos confidenciales, memoria o credenciales' },
      { id: 'L', label: 'Low (L)', score: '0.22', desc: 'Acceso parcial a información no crítica' },
      { id: 'N', label: 'None (N)', score: '0.00', desc: 'Sin impacto en la confidencialidad de la información' },
    ],
  },
  i: {
    name: 'Integridad (Integrity)',
    options: [
      { id: 'H', label: 'High (H)', score: '0.56', desc: 'Modificación total de archivos de sistema, bases de datos o código' },
      { id: 'L', label: 'Low (L)', score: '0.22', desc: 'Modificación limitada de datos secundarios' },
      { id: 'N', label: 'None (N)', score: '0.00', desc: 'Sin capacidad de alterar o borrar información' },
    ],
  },
  a: {
    name: 'Disponibilidad (Availability)',
    options: [
      { id: 'H', label: 'High (H)', score: '0.56', desc: 'Denegación completa de servicio (DoS) o apagado de la máquina' },
      { id: 'L', label: 'Low (L)', score: '0.22', desc: 'Degradación temporal del rendimiento' },
      { id: 'N', label: 'None (N)', score: '0.00', desc: 'Sin impacto en la operatividad del servicio' },
    ],
  },
};

const CVSS_METRIC_WEIGHTS = {
  av: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  ac: { L: 0.77, H: 0.44 },
  pr: {
    U: { N: 0.85, L: 0.62, H: 0.27 },
    C: { N: 0.85, L: 0.68, H: 0.5 },
  },
  ui: { N: 0.85, R: 0.62 },
  c: { N: 0.0, L: 0.22, H: 0.56 },
  i: { N: 0.0, L: 0.22, H: 0.56 },
  a: { N: 0.0, L: 0.22, H: 0.56 },
};

/**
 * FIRST.org CVSS v3.1 Official Round-Up Function
 * Smallest number, specified to one decimal place, that is greater than or equal to the input.
 */
function roundUp(input: number): number {
  const intInput = Math.round(input * 100000);
  if (intInput % 10000 === 0) {
    return intInput / 100000;
  }
  return (Math.floor(intInput / 10000) + 1) / 10;
}

/**
 * Calculates official CVSS v3.1 Base Score, Exploitability and Impact sub-scores
 */
export function calculateCVSS31(vector: CVSSVector): CVSSScoreResult {
  const { av, ac, pr, ui, s, c, i, a } = vector;

  const avVal = CVSS_METRIC_WEIGHTS.av[av];
  const acVal = CVSS_METRIC_WEIGHTS.ac[ac];
  const prVal = CVSS_METRIC_WEIGHTS.pr[s][pr];
  const uiVal = CVSS_METRIC_WEIGHTS.ui[ui];

  const cVal = CVSS_METRIC_WEIGHTS.c[c];
  const iVal = CVSS_METRIC_WEIGHTS.i[i];
  const aVal = CVSS_METRIC_WEIGHTS.a[a];

  // Impact Sub-Score (ISS)
  const iss = 1 - (1 - cVal) * (1 - iVal) * (1 - aVal);

  let impact = 0;
  if (s === 'U') {
    impact = 6.42 * iss;
  } else {
    impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  }

  // Exploitability Sub-Score
  const exploitability = 8.22 * avVal * acVal * prVal * uiVal;

  let baseScore = 0;
  if (impact <= 0) {
    baseScore = 0;
  } else if (s === 'U') {
    baseScore = roundUp(Math.min(impact + exploitability, 10));
  } else {
    baseScore = roundUp(Math.min(1.08 * (impact + exploitability), 10));
  }

  baseScore = Math.min(10, Math.max(0, Math.round(baseScore * 10) / 10));

  let severity: CVSSSeverity = 'None';
  if (baseScore === 0) severity = 'None';
  else if (baseScore <= 3.9) severity = 'Low';
  else if (baseScore <= 6.9) severity = 'Medium';
  else if (baseScore <= 8.9) severity = 'High';
  else severity = 'Critical';

  const vectorString = `CVSS:3.1/AV:${av}/AC:${ac}/PR:${pr}/UI:${ui}/S:${s}/C:${c}/I:${i}/A:${a}`;

  return {
    score: baseScore,
    severity,
    vectorString,
    exploitability: Math.round(exploitability * 10) / 10,
    impact: Math.round(impact * 10) / 10,
  };
}

/**
 * Infers an accurate initial CVSS v3.1 vector based on scenario vectors and difficulty
 */
export function inferCVSSVector(scenario: CTFScenario): CVSSVector {
  if (scenario.cvss) {
    return {
      av: scenario.cvss.av || 'N',
      ac: scenario.cvss.ac || 'L',
      pr: scenario.cvss.pr || 'N',
      ui: scenario.cvss.ui || 'N',
      s: scenario.cvss.s || 'U',
      c: scenario.cvss.c || 'H',
      i: scenario.cvss.i || 'H',
      a: scenario.cvss.a || 'H',
    };
  }

  const vec = (scenario.vector || '').toLowerCase();
  const priv = (scenario.secondaryVector || '').toLowerCase();
  const diff = scenario.difficulty;

  let av: 'N' | 'A' | 'L' | 'P' = 'N';
  let ac: 'L' | 'H' = 'L';
  let pr: 'N' | 'L' | 'H' = 'N';
  let ui: 'N' | 'R' = 'N';
  let s: 'U' | 'C' = 'U';
  let c: 'N' | 'L' | 'H' = 'H';
  let i: 'N' | 'L' | 'H' = 'H';
  let a: 'N' | 'L' | 'H' = 'H';

  // Attack Complexity
  if (diff === 'Hard' || diff === 'Insane' || vec.includes('race') || priv.includes('overflow') || priv.includes('rop')) {
    ac = 'H';
  }

  // User Interaction
  if (vec.includes('csrf') || vec.includes('xss') || vec.includes('phishing')) {
    ui = 'R';
  }

  // Privileges Required
  if (vec.includes('autenticado') || vec.includes('authenticated') || vec.includes('interno')) {
    pr = 'L';
  }

  // Scope: Docker escapes / VM escapes change the scope to Changed (C)
  if (priv.includes('escape') || priv.includes('docker') || priv.includes('host') || priv.includes('container')) {
    s = 'C';
  }

  return { av, ac, pr, ui, s, c, i, a };
}

export function getSeverityStyle(severity: CVSSSeverity): {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
} {
  switch (severity) {
    case 'Critical':
      return {
        bg: 'bg-rose-950/70',
        text: 'text-rose-400',
        border: 'border-rose-800/80',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      };
    case 'High':
      return {
        bg: 'bg-amber-950/70',
        text: 'text-amber-400',
        border: 'border-amber-800/80',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      };
    case 'Medium':
      return {
        bg: 'bg-yellow-950/70',
        text: 'text-yellow-400',
        border: 'border-yellow-800/80',
        badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      };
    case 'Low':
      return {
        bg: 'bg-emerald-950/70',
        text: 'text-emerald-400',
        border: 'border-emerald-800/80',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      };
    default:
      return {
        bg: 'bg-slate-900',
        text: 'text-slate-400',
        border: 'border-slate-800',
        badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
      };
  }
}
