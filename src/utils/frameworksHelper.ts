import { CTFScenario, SecurityFrameworks, MitreTechnique, OwaspCategory, CweMapping } from '../types';

export const COMMON_MITRE_TECHNIQUES: Record<string, MitreTechnique> = {
  T1190: {
    id: 'T1190',
    name: 'Exploit Public-Facing Application',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    url: 'https://attack.mitre.org/techniques/T1190/',
    description: 'Explotación de vulnerabilidades en servicios o aplicaciones accesibles desde la red externa para obtener acceso inicial.',
  },
  'T1059.006': {
    id: 'T1059.006',
    name: 'Command and Scripting Interpreter: Python',
    tactic: 'Execution',
    tacticId: 'TA0002',
    url: 'https://attack.mitre.org/techniques/T1059/006/',
    description: 'Inyección o abuso de intérpretes Python para ejecutar payloads o llamadas al sistema.',
  },
  'T1059.004': {
    id: 'T1059.004',
    name: 'Command and Scripting Interpreter: Unix Shell',
    tactic: 'Execution',
    tacticId: 'TA0002',
    url: 'https://attack.mitre.org/techniques/T1059/004/',
    description: 'Ejecución de scripts y comandos directos de shell Unix/Bash mediante inyección o ejecución remota de comandos.',
  },
  'T1548.001': {
    id: 'T1548.001',
    name: 'Abuse Elevation Control Mechanism: Setuid and Setgid',
    tactic: 'Privilege Escalation',
    tacticId: 'TA0004',
    url: 'https://attack.mitre.org/techniques/T1548/001/',
    description: 'Aprovechamiento de permisos SUID/SGID configurados de forma incorrecta para ejecutar código con privilegios elevados.',
  },
  'T1548.003': {
    id: 'T1548.003',
    name: 'Abuse Elevation Control Mechanism: Sudo and Sudo Caching',
    tactic: 'Privilege Escalation',
    tacticId: 'TA0004',
    url: 'https://attack.mitre.org/techniques/T1548/003/',
    description: 'Abuso de reglas permisivas en /etc/sudoers (NOPASSWD) o binarios permitidos con sudo para escalar a root.',
  },
  'T1574.007': {
    id: 'T1574.007',
    name: 'Hijack Execution Flow: Path Interception by PATH Environment Variable',
    tactic: 'Privilege Escalation',
    tacticId: 'TA0004',
    url: 'https://attack.mitre.org/techniques/T1574/007/',
    description: 'Intercepción de la ruta de ejecución (Path Hijacking) manipulando la variable $PATH para que un binario privilegiado ejecute un payload local.',
  },
  'T1574.006': {
    id: 'T1574.006',
    name: 'Hijack Execution Flow: Dynamic Linker Technologies (LD_PRELOAD)',
    tactic: 'Privilege Escalation',
    tacticId: 'TA0004',
    url: 'https://attack.mitre.org/techniques/T1574/006/',
    description: 'Inyección de bibliotecas dinámicas compartidas mediante directivas LD_PRELOAD preservadas en entornos sudo.',
  },
  'T1611': {
    id: 'T1611',
    name: 'Escape to Host',
    tactic: 'Privilege Escalation',
    tacticId: 'TA0004',
    url: 'https://attack.mitre.org/techniques/T1611/',
    description: 'Evasión de contenedores Docker mediante montaje del socket de control docker.sock o contenedores con flag --privileged.',
  },
  'T1053.003': {
    id: 'T1053.003',
    name: 'Scheduled Task/Job: Cron',
    tactic: 'Persistence / PrivEsc',
    tacticId: 'TA0004',
    url: 'https://attack.mitre.org/techniques/T1053/003/',
    description: 'Abuso de tareas programadas desatendidas (cronjobs) que ejecutan scripts vulnerables a wildcard injection o permisos de escritura.',
  },
  'T1078': {
    id: 'T1078',
    name: 'Valid Accounts',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    url: 'https://attack.mitre.org/techniques/T1078/',
    description: 'Uso de credenciales por defecto, filtradas en recursos compartidos o extraídas de configuraciones de respaldo.',
  },
  'T1021.002': {
    id: 'T1021.002',
    name: 'Remote Services: SMB/Windows Admin Shares',
    tactic: 'Lateral Movement / Foothold',
    tacticId: 'TA0008',
    url: 'https://attack.mitre.org/techniques/T1021/002/',
    description: 'Acceso y enumeración de recursos compartidos SMB anónimos para recolectar notas o claves privadas.',
  },
};

export const COMMON_OWASP_CATEGORIES: Record<string, OwaspCategory> = {
  'A01:2021': {
    code: 'A01:2021',
    name: 'Broken Access Control',
    url: 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/',
    description: 'Fallas en el control de acceso que permiten a usuarios no privilegiados acceder a recursos reservados o escalar privilegios en el sistema.',
  },
  'A03:2021': {
    code: 'A03:2021',
    name: 'Injection',
    url: 'https://owasp.org/Top10/A03_2021-Injection/',
    description: 'Entrada de datos no confiable interpretada como código (SSTI, SQLi, Command Injection, LDAP) permitiendo ejecución arbitraria.',
  },
  'A05:2021': {
    code: 'A05:2021',
    name: 'Security Misconfiguration',
    url: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
    description: 'Configuraciones por defecto inseguras, permisos excesivos en servicios, cabeceras faltantes o exposición de interfaces de depuración.',
  },
  'A08:2021': {
    code: 'A08:2021',
    name: 'Software and Data Integrity Failures',
    url: 'https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/',
    description: 'Deserialización insegura de objetos sin verificación de integridad (Python Pickle, PHP unserialize, Java deserialization).',
  },
};

/**
 * Intelligent framework inference engine:
 * If the scenario already has structured frameworks, returns them.
 * Otherwise, analyzes the vector names and open ports to accurately map
 * MITRE ATT&CK techniques, OWASP Top 10 categories, and CWE vulnerabilities.
 */
export function getScenarioFrameworks(scenario: CTFScenario): SecurityFrameworks {
  if (scenario.frameworks && scenario.frameworks.mitre.length > 0) {
    return scenario.frameworks;
  }

  const vecLower = (scenario.vector || '').toLowerCase();
  const privLower = (scenario.secondaryVector || '').toLowerCase();

  const mitre: MitreTechnique[] = [];
  const owasp: OwaspCategory[] = [];
  const cwe: CweMapping[] = [];

  // --- Initial Access / Vector Analysis ---
  if (vecLower.includes('ssti') || vecLower.includes('template')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1190']);
    mitre.push(COMMON_MITRE_TECHNIQUES['T1059.006']);
    owasp.push(COMMON_OWASP_CATEGORIES['A03:2021']);
    cwe.push({
      id: 'CWE-94',
      name: "Improper Control of Generation of Code ('Code Injection')",
      url: 'https://cwe.mitre.org/data/definitions/94.html',
    });
    cwe.push({
      id: 'CWE-1336',
      name: 'Improper Neutralization of Special Elements Used in a Template Engine',
      url: 'https://cwe.mitre.org/data/definitions/1336.html',
    });
  } else if (vecLower.includes('sql') || vecLower.includes('sqli')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1190']);
    owasp.push(COMMON_OWASP_CATEGORIES['A03:2021']);
    cwe.push({
      id: 'CWE-89',
      name: "Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')",
      url: 'https://cwe.mitre.org/data/definitions/89.html',
    });
  } else if (vecLower.includes('command') || vecLower.includes('rce') || vecLower.includes('inyección')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1190']);
    mitre.push(COMMON_MITRE_TECHNIQUES['T1059.004']);
    owasp.push(COMMON_OWASP_CATEGORIES['A03:2021']);
    cwe.push({
      id: 'CWE-78',
      name: 'Improper Neutralization of Special Elements used in an OS Command',
      url: 'https://cwe.mitre.org/data/definitions/78.html',
    });
  } else if (vecLower.includes('pickle') || vecLower.includes('deserializ')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1190']);
    mitre.push(COMMON_MITRE_TECHNIQUES['T1059.006']);
    owasp.push(COMMON_OWASP_CATEGORIES['A08:2021']);
    cwe.push({
      id: 'CWE-502',
      name: 'Deserialization of Untrusted Data',
      url: 'https://cwe.mitre.org/data/definitions/502.html',
    });
  } else if (vecLower.includes('smb') || vecLower.includes('samba') || vecLower.includes('recurso')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1021.002']);
    mitre.push(COMMON_MITRE_TECHNIQUES['T1078']);
    owasp.push(COMMON_OWASP_CATEGORIES['A01:2021']);
    owasp.push(COMMON_OWASP_CATEGORIES['A05:2021']);
    cwe.push({
      id: 'CWE-284',
      name: 'Improper Access Control',
      url: 'https://cwe.mitre.org/data/definitions/284.html',
    });
  } else if (vecLower.includes('lfi') || vecLower.includes('file inclusion') || vecLower.includes('traversal')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1190']);
    owasp.push(COMMON_OWASP_CATEGORIES['A01:2021']);
    cwe.push({
      id: 'CWE-22',
      name: "Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal')",
      url: 'https://cwe.mitre.org/data/definitions/22.html',
    });
  } else {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1190']);
    owasp.push(COMMON_OWASP_CATEGORIES['A03:2021']);
    cwe.push({
      id: 'CWE-20',
      name: 'Improper Input Validation',
      url: 'https://cwe.mitre.org/data/definitions/20.html',
    });
  }

  // --- Privilege Escalation Analysis ---
  if (privLower.includes('suid') || privLower.includes('path hijacking') || privLower.includes('secuestro')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1548.001']);
    mitre.push(COMMON_MITRE_TECHNIQUES['T1574.007']);
    owasp.push(COMMON_OWASP_CATEGORIES['A01:2021']);
    cwe.push({
      id: 'CWE-250',
      name: 'Execution with Unnecessary Privileges',
      url: 'https://cwe.mitre.org/data/definitions/250.html',
    });
    cwe.push({
      id: 'CWE-426',
      name: 'Untrusted Search Path',
      url: 'https://cwe.mitre.org/data/definitions/426.html',
    });
  } else if (privLower.includes('preload') || privLower.includes('ld_preload')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1548.003']);
    mitre.push(COMMON_MITRE_TECHNIQUES['T1574.006']);
    owasp.push(COMMON_OWASP_CATEGORIES['A01:2021']);
    cwe.push({
      id: 'CWE-426',
      name: 'Untrusted Search Path',
      url: 'https://cwe.mitre.org/data/definitions/426.html',
    });
  } else if (privLower.includes('sudo') || privLower.includes('nopasswd')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1548.003']);
    owasp.push(COMMON_OWASP_CATEGORIES['A01:2021']);
    cwe.push({
      id: 'CWE-269',
      name: 'Improper Privilege Management',
      url: 'https://cwe.mitre.org/data/definitions/269.html',
    });
  } else if (privLower.includes('docker') || privLower.includes('socket')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1611']);
    owasp.push(COMMON_OWASP_CATEGORIES['A05:2021']);
    cwe.push({
      id: 'CWE-250',
      name: 'Execution with Unnecessary Privileges',
      url: 'https://cwe.mitre.org/data/definitions/250.html',
    });
  } else if (privLower.includes('cron') || privLower.includes('wildcard')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1053.003']);
    owasp.push(COMMON_OWASP_CATEGORIES['A01:2021']);
    cwe.push({
      id: 'CWE-155',
      name: 'Improper Neutralization of Wildcards or Matching Symbols',
      url: 'https://cwe.mitre.org/data/definitions/155.html',
    });
  } else if (privLower.includes('cap') || privLower.includes('capability')) {
    mitre.push(COMMON_MITRE_TECHNIQUES['T1548']);
    owasp.push(COMMON_OWASP_CATEGORIES['A01:2021']);
    cwe.push({
      id: 'CWE-250',
      name: 'Execution with Unnecessary Privileges',
      url: 'https://cwe.mitre.org/data/definitions/250.html',
    });
  }

  // Deduplicate entries by ID
  const uniqueMitre = Array.from(new Map(mitre.map((m) => [m.id, m])).values());
  const uniqueOwasp = Array.from(new Map(owasp.map((o) => [o.code, o])).values());
  const uniqueCwe = Array.from(new Map(cwe.map((c) => [c.id, c])).values());

  return {
    mitre: uniqueMitre,
    owasp: uniqueOwasp,
    cwe: uniqueCwe,
  };
}
