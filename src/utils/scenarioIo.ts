import * as yaml from 'js-yaml';
import {
  CTFScenario,
  CVSSVector,
  DifficultyLevel,
  GradualHint,
  MitreTechnique,
  OpenPort,
  OwaspCategory,
  ScenarioTopology,
} from '../types';
import { findDockerComposeSecurityIssues } from './dockerSecurity';

const SAFE_DEFAULT_DOCKER_COMPOSE = `version: '3.8'\nservices:\n  target:\n    image: python:3.11-slim\n    ports:\n      - "127.0.0.1:8080:80"\n`;

export interface ParseResult {
  scenario?: CTFScenario;
  error?: string;
  /** Avisos no bloqueantes (p.ej. se sustituyó un docker-compose inseguro). */
  warnings?: string[];
}

// Límites defensivos de longitud. Cualquier .json/.yaml importado (p.ej. compartido
// por un profesor con sus alumnos) es contenido no confiable: se sanea aquí antes
// de que llegue a cualquier plantilla HTML (ver generateHtmlReport.ts / generateCertificateHtml.ts).
const MAX_SHORT = 200;
const MAX_MEDIUM = 2000;
const MAX_LONG = 20000;
const MAX_ARRAY_ITEMS = 100;

function str(value: unknown, maxLen: number, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
}

function optStr(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function enumVal<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function sanitizeOpenPorts(value: unknown): OpenPort[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_ARRAY_ITEMS).map((p) => ({
    port: num(p?.port, 0, 0, 65535),
    service: str(p?.service, MAX_SHORT, 'Desconocido'),
    version: str(p?.version, MAX_SHORT, 'Desconocida'),
    purpose: str(p?.purpose, MAX_MEDIUM, ''),
  }));
}

function sanitizeHints(value: unknown): GradualHint[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_ARRAY_ITEMS).map((h, idx) => ({
    id: str(h?.id, MAX_SHORT, `hint-${idx}`),
    level: num(h?.level, 1, 1, 3) as 1 | 2 | 3,
    title: str(h?.title, MAX_SHORT, 'Pista'),
    category: enumVal(h?.category, ['recon', 'foothold', 'privesc'] as const, 'recon'),
    text: str(h?.text, MAX_MEDIUM, ''),
  }));
}

function sanitizeTopology(value: unknown, fallbackIp: string): ScenarioTopology {
  const v = value && typeof value === 'object' ? (value as any) : {};
  const nodes = Array.isArray(v.nodes)
    ? v.nodes.slice(0, MAX_ARRAY_ITEMS).map((n: any) => ({
        id: str(n?.id, MAX_SHORT, 'node'),
        label: str(n?.label, MAX_SHORT, 'Nodo'),
        type: enumVal(n?.type, ['attacker', 'gateway', 'target', 'internal'] as const, 'target'),
        role: str(n?.role, MAX_SHORT, ''),
      }))
    : [
        { id: 'attacker', label: 'Kali Attacker', type: 'attacker' as const, role: 'Estudiante / Auditor' },
        { id: 'target', label: `Target (${fallbackIp})`, type: 'target' as const, role: 'Máquina Objetivo' },
      ];
  const links = Array.isArray(v.links)
    ? v.links.slice(0, MAX_ARRAY_ITEMS).map((l: any) => ({
        from: str(l?.from, MAX_SHORT, 'attacker'),
        to: str(l?.to, MAX_SHORT, 'target'),
        proto: str(l?.proto, MAX_SHORT, 'TCP'),
        desc: str(l?.desc, MAX_MEDIUM, ''),
      }))
    : [];
  return { nodes, links };
}

const MITRE_FIELDS = (m: any): MitreTechnique => ({
  id: str(m?.id, MAX_SHORT, ''),
  name: str(m?.name, MAX_SHORT, ''),
  tactic: str(m?.tactic, MAX_SHORT, ''),
  tacticId: str(m?.tacticId, MAX_SHORT, ''),
  url: optStr(m?.url, MAX_SHORT) || '',
  description: str(m?.description, MAX_MEDIUM, ''),
});

const OWASP_FIELDS = (o: any): OwaspCategory => ({
  code: str(o?.code, MAX_SHORT, ''),
  name: str(o?.name, MAX_SHORT, ''),
  url: optStr(o?.url, MAX_SHORT) || '',
  description: str(o?.description, MAX_MEDIUM, ''),
});

function sanitizeFrameworks(value: unknown): CTFScenario['frameworks'] {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as any;
  const mitre = Array.isArray(v.mitre) ? v.mitre.slice(0, MAX_ARRAY_ITEMS).map(MITRE_FIELDS) : [];
  const owasp = Array.isArray(v.owasp) ? v.owasp.slice(0, MAX_ARRAY_ITEMS).map(OWASP_FIELDS) : [];
  const cwe = Array.isArray(v.cwe)
    ? v.cwe.slice(0, MAX_ARRAY_ITEMS).map((c: any) => ({
        id: str(c?.id, MAX_SHORT, ''),
        name: str(c?.name, MAX_SHORT, ''),
        url: optStr(c?.url, MAX_SHORT) || '',
      }))
    : undefined;
  if (mitre.length === 0 && owasp.length === 0) return undefined;
  return { mitre, owasp, cwe };
}

const CVSS_ENUMS = {
  av: ['N', 'A', 'L', 'P'],
  ac: ['L', 'H'],
  pr: ['N', 'L', 'H'],
  ui: ['N', 'R'],
  s: ['U', 'C'],
  c: ['N', 'L', 'H'],
  i: ['N', 'L', 'H'],
  a: ['N', 'L', 'H'],
} as const;

function sanitizeImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length > 5_000_000) return undefined;
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(trimmed)) return trimmed;
  if (/^https:\/\//i.test(trimmed) && trimmed.length <= MAX_MEDIUM) return trimmed;
  return undefined;
}

function sanitizeCvss(value: unknown): Partial<CVSSVector> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as any;
  const result: Partial<CVSSVector> = {};
  (Object.keys(CVSS_ENUMS) as (keyof typeof CVSS_ENUMS)[]).forEach((key) => {
    if (typeof v[key] === 'string' && (CVSS_ENUMS[key] as readonly string[]).includes(v[key])) {
      (result as any)[key] = v[key];
    }
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Validates and parses raw string content from a .json or .yaml / .yml file.
 * Treats the input as untrusted (a classmate or instructor may share a crafted
 * .json): every field is type/length/enum-checked instead of trusted verbatim,
 * so a malicious import cannot smuggle markup or oversized payloads into the
 * app state, the exported HTML report or the certificate.
 */
export function validateAndParseScenario(content: string, fileName: string = ''): ParseResult {
  try {
    const trimmed = content.trim();
    if (!trimmed) {
      return { error: 'El archivo está vacío.' };
    }
    if (trimmed.length > 2_000_000) {
      return { error: 'El archivo es demasiado grande (máximo 2 MB).' };
    }

    let parsed: any;
    const looksYaml = fileName.endsWith('.yaml') || fileName.endsWith('.yml');

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      try {
        parsed = yaml.load(trimmed);
      } catch (yamlErr: any) {
        return { error: `No se pudo interpretar el archivo como JSON ni YAML: ${yamlErr.message || yamlErr}` };
      }
    }
    void looksYaml;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { error: 'El formato del archivo no es un objeto JSON o YAML válido.' };
    }

    // Required fields validation
    if (!parsed.codename || typeof parsed.codename !== 'string') {
      return { error: 'Falta el campo obligatorio "codename" (ej: FSOCIETY_01).' };
    }

    if (!parsed.themeName || typeof parsed.themeName !== 'string') {
      return { error: 'Falta el campo obligatorio "themeName" (ej: Evil Corp Banking Gateway).' };
    }

    // Normalize difficulty
    const validDifficulties: DifficultyLevel[] = ['Easy', 'Medium', 'Hard', 'Insane'];
    const difficulty = enumVal(parsed.difficulty, validDifficulties, 'Medium' as DifficultyLevel);

    const ip = str(parsed.ip, MAX_SHORT, '10.10.110.42');

    // Un docker-compose.yml importado nunca se confía a ciegas: si pide
    // privileged/host networking/montar rutas del host/capabilities
    // peligrosas, se sustituye por una plantilla segura y se avisa.
    const warnings: string[] = [];
    const importedCompose = optStr(parsed.dockerCompose, MAX_LONG);
    const composeIssues = importedCompose ? findDockerComposeSecurityIssues(importedCompose) : [];
    const dockerCompose = composeIssues.length > 0 ? SAFE_DEFAULT_DOCKER_COMPOSE : importedCompose || SAFE_DEFAULT_DOCKER_COMPOSE;
    if (composeIssues.length > 0) {
      warnings.push(
        `Se ignoró el docker-compose.yml importado por configuración insegura y se sustituyó por una plantilla segura: ${composeIssues.join(' ')}`
      );
    }

    // Build guaranteed, sanitized CTFScenario. Every string is type- and
    // length-checked; nothing from the imported file is trusted as-is.
    const scenario: CTFScenario = {
      codename: str(parsed.codename, MAX_SHORT, 'IMPORTED').toUpperCase().replace(/\s+/g, '_').slice(0, MAX_SHORT),
      themeName: str(parsed.themeName, MAX_SHORT, 'Reto Importado'),
      genre: enumVal(
        parsed.genre,
        ['scifi', 'fantasy', 'horror', 'cyberpunk', 'tv_series', 'custom'] as const,
        'cyberpunk'
      ),
      difficulty,
      vector: str(parsed.vector, MAX_SHORT, 'Vulnerabilidad web en endpoint no autenticado'),
      secondaryVector: str(parsed.secondaryVector, MAX_SHORT, 'Escalada de privilegios local'),
      targetOS: str(parsed.targetOS, MAX_SHORT, 'Debian 12 Bookworm'),
      ip,
      story: str(parsed.story, MAX_LONG, 'Reto de ciberseguridad importado.'),
      userFlag: str(parsed.userFlag, MAX_SHORT, 'FLAG{imported_user_flag}'),
      rootFlag: str(parsed.rootFlag, MAX_SHORT, 'FLAG{imported_root_flag}'),
      userFlagPath: str(parsed.userFlagPath, MAX_SHORT, '/home/elliot/user.txt'),
      rootFlagPath: str(parsed.rootFlagPath, MAX_SHORT, '/root/root.txt'),
      openPorts:
        sanitizeOpenPorts(parsed.openPorts).length > 0
          ? sanitizeOpenPorts(parsed.openPorts)
          : [
              { port: 80, service: 'HTTP', version: 'Gunicorn/21.2.0', purpose: 'Aplicación Web Principal' },
              { port: 22, service: 'SSH', version: 'OpenSSH 9.2p1', purpose: 'Gestión Remota' },
            ],
      topology: sanitizeTopology(parsed.topology, ip),
      provisionScript: str(parsed.provisionScript, MAX_LONG, '#!/bin/bash\necho "Provisioning custom scenario..."\n'),
      dockerfile: str(parsed.dockerfile, MAX_LONG, 'FROM python:3.11-slim\nWORKDIR /app\nCMD ["python3", "-m", "http.server", "80"]\n'),
      dockerCompose,
      pythonScript: str(parsed.pythonScript, MAX_LONG, '#!/usr/bin/env python3\nimport requests\nprint("Custom scenario exploit script")\n'),
      walkthrough: str(parsed.walkthrough, MAX_LONG, '## Guía de Solución\n\n1. Reconocimiento y escaneo.\n2. Explotación y escalada.\n'),
      hints:
        sanitizeHints(parsed.hints).length > 0
          ? sanitizeHints(parsed.hints)
          : [
              { id: 'h1', level: 1, title: 'Orientación Conceptual', category: 'recon', text: 'Analiza los servicios expuestos en el escaneo de puertos.' },
              { id: 'h2', level: 2, title: 'Pista Táctica', category: 'foothold', text: 'Presta atención a los parámetros de entrada en la aplicación web.' },
              { id: 'h3', level: 3, title: 'Vector Dirigido', category: 'foothold', text: 'Investiga la sintaxis de plantillas o inyecciones en el servicio.' },
            ],
      machineArtUrl: sanitizeImageUrl(parsed.machineArtUrl),
      frameworks: sanitizeFrameworks(parsed.frameworks),
      cvss: sanitizeCvss(parsed.cvss),
    };

    return warnings.length > 0 ? { scenario, warnings } : { scenario };
  } catch (err: any) {
    return { error: `Error procesando el archivo: ${err.message || String(err)}` };
  }
}

/**
 * Downloads scenario as .json file
 */
export function exportScenarioAsJson(scenario: CTFScenario): void {
  const jsonStr = JSON.stringify(scenario, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `netphantom_${scenario.codename.toLowerCase()}_blueprint.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads scenario as .yaml file
 */
export function exportScenarioAsYaml(scenario: CTFScenario): void {
  const yamlStr = yaml.dump(scenario, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });
  const blob = new Blob([yamlStr], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `netphantom_${scenario.codename.toLowerCase()}_blueprint.yaml`;
  a.click();
  URL.revokeObjectURL(url);
}
