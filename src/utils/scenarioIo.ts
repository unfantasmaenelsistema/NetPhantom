import * as yaml from 'js-yaml';
import { CTFScenario, DifficultyLevel } from '../types';

export interface ParseResult {
  scenario?: CTFScenario;
  error?: string;
}

/**
 * Validates and parses raw string content from a .json or .yaml / .yml file
 */
export function validateAndParseScenario(content: string, fileName: string = ''): ParseResult {
  try {
    const trimmed = content.trim();
    if (!trimmed) {
      return { error: 'El archivo está vacío.' };
    }

    let parsed: any;
    const isYaml = fileName.endsWith('.yaml') || fileName.endsWith('.yml') || trimmed.startsWith('---') || trimmed.includes(': ');

    try {
      // First attempt JSON
      parsed = JSON.parse(trimmed);
    } catch {
      // If JSON fails, attempt YAML
      parsed = yaml.load(trimmed);
    }

    if (!parsed || typeof parsed !== 'object') {
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
    let difficulty: DifficultyLevel = 'Medium';
    if (parsed.difficulty && validDifficulties.includes(parsed.difficulty as DifficultyLevel)) {
      difficulty = parsed.difficulty as DifficultyLevel;
    }

    // Build guaranteed CTFScenario
    const scenario: CTFScenario = {
      codename: parsed.codename.toUpperCase().replace(/\s+/g, '_'),
      themeName: parsed.themeName,
      genre: parsed.genre || 'cyberpunk',
      difficulty,
      vector: parsed.vector || 'Vulnerabilidad web en endpoint no autenticado',
      secondaryVector: parsed.secondaryVector || 'Escalada de privilegios local',
      targetOS: parsed.targetOS || 'Debian 12 Bookworm',
      ip: parsed.ip || '10.10.110.42',
      story: parsed.story || 'Reto de ciberseguridad importado.',
      userFlag: parsed.userFlag || 'FLAG{imported_user_flag}',
      rootFlag: parsed.rootFlag || 'FLAG{imported_root_flag}',
      userFlagPath: parsed.userFlagPath || '/home/elliot/user.txt',
      rootFlagPath: parsed.rootFlagPath || '/root/root.txt',
      openPorts: Array.isArray(parsed.openPorts) && parsed.openPorts.length > 0
        ? parsed.openPorts
        : [
            { port: 80, service: 'HTTP', version: 'Gunicorn/21.2.0', purpose: 'Aplicación Web Principal' },
            { port: 22, service: 'SSH', version: 'OpenSSH 9.2p1', purpose: 'Gestión Remota' },
          ],
      topology: parsed.topology || {
        attackerIp: '10.10.110.5',
        targetIp: parsed.ip || '10.10.110.42',
        gatewayIp: '10.10.110.1',
        internalSubnet: '10.10.110.0/24',
        isolatedNodes: ['vault-database-db01'],
      },
      provisionScript: parsed.provisionScript || '#!/bin/bash\necho "Provisioning custom scenario..."\n',
      dockerfile: parsed.dockerfile || 'FROM python:3.11-slim\nWORKDIR /app\nCMD ["python3", "-m", "http.server", "80"]\n',
      dockerCompose: parsed.dockerCompose || `version: '3.8'\nservices:\n  target:\n    image: python:3.11-slim\n    ports:\n      - "80:80"\n`,
      pythonScript: parsed.pythonScript || '#!/usr/bin/env python3\nimport requests\nprint("Custom scenario exploit script")\n',
      walkthrough: parsed.walkthrough || '## Guía de Solución\n\n1. Reconocimiento y escaneo.\n2. Explotación y escalada.\n',
      hints: Array.isArray(parsed.hints) && parsed.hints.length > 0
        ? parsed.hints
        : [
            { level: 1, title: 'Orientación Conceptual', text: 'Analiza los servicios expuestos en el escaneo de puertos.' },
            { level: 2, title: 'Pista Táctica', text: 'Presta atención a los parámetros de entrada en la aplicación web.' },
            { level: 3, title: 'Vector Dirigido', text: 'Investiga la sintaxis de plantillas o inyecciones en el servicio.' },
          ],
      machineArtUrl: parsed.machineArtUrl,
      frameworks: parsed.frameworks,
      cvss: parsed.cvss,
    };

    return { scenario };
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
