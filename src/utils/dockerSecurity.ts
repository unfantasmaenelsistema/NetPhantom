import * as yaml from 'js-yaml';

/**
 * Hard security boundary for any docker-compose.yml NetPhantom did not write
 * itself: output from Gemini (server.ts /api/generate-scenario) and files a
 * user imports (scenarioIo.ts). Both are untrusted text that ends up in
 * instructions a professor or student will copy-paste and run locally with
 * `docker compose up`, so directives that would grant host-level access are
 * rejected rather than trusted.
 */

// Capabilities a vulnerable-lab compose may reasonably need (e.g. a SUID /
// sudo privilege-escalation exercise). Anything outside this list is
// rejected: capabilities like SYS_ADMIN, SYS_PTRACE, SYS_MODULE or NET_ADMIN
// are effectively a path to host compromise or container breakout and have
// no place in a beginner CTF lab.
const SAFE_CAP_ADD = new Set([
  'CHOWN',
  'DAC_OVERRIDE',
  'FOWNER',
  'FSETID',
  'KILL',
  'SETGID',
  'SETUID',
  'SETPCAP',
  'SETFCAP',
  'NET_BIND_SERVICE',
  'SYS_CHROOT',
  'AUDIT_WRITE',
]);

function isHostPathVolumeSource(source: string): boolean {
  const s = source.trim();
  if (!s) return false;
  // A named Docker volume is a bare identifier; anything else (absolute path,
  // relative path, home-relative, Windows drive letter, docker.sock, ...) is
  // treated as a host bind-mount and rejected.
  return !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(s);
}

/**
 * Scans a docker-compose.yml (as plain text) for directives that would grant
 * the container host-level access, and returns a human-readable reason per
 * issue found. An empty array means no issues were found.
 *
 * Runs a text-based safety net first (so it still catches obvious danger
 * even if the YAML doesn't parse cleanly), then a structured check via
 * js-yaml for the directives that need it (cap_add allow-list, volumes).
 */
export function findDockerComposeSecurityIssues(composeText: unknown): string[] {
  if (typeof composeText !== 'string' || !composeText.trim()) return [];
  const issues: string[] = [];

  if (/privileged\s*:\s*true/i.test(composeText)) {
    issues.push('"privileged: true" concede acceso casi total al host y no está permitido.');
  }
  if (/network_mode\s*:\s*["']?host["']?/i.test(composeText)) {
    issues.push('"network_mode: host" comparte la pila de red del host y no está permitido.');
  }
  if (/^\s*pid\s*:\s*["']?host["']?/im.test(composeText)) {
    issues.push('"pid: host" expone los procesos del host y no está permitido.');
  }
  if (/^\s*ipc\s*:\s*["']?host["']?/im.test(composeText)) {
    issues.push('"ipc: host" expone la memoria/IPC del host y no está permitido.');
  }
  if (/\/var\/run\/docker\.sock/i.test(composeText)) {
    issues.push('Montar /var/run/docker.sock equivale a "privileged" (permite escapar al host) y no está permitido.');
  }

  try {
    const parsed: any = yaml.load(composeText);
    const services = parsed?.services && typeof parsed.services === 'object' ? parsed.services : {};
    for (const [name, svc] of Object.entries<any>(services)) {
      if (!svc || typeof svc !== 'object') continue;

      if (Array.isArray(svc.cap_add)) {
        for (const cap of svc.cap_add) {
          const capName = String(cap).toUpperCase().replace(/^CAP_/, '');
          if (capName === 'ALL' || !SAFE_CAP_ADD.has(capName)) {
            issues.push(`El servicio "${name}" añade la capability "${cap}", fuera de la lista permitida para un laboratorio CTF.`);
          }
        }
      }

      if (Array.isArray(svc.volumes)) {
        for (const vol of svc.volumes) {
          if (typeof vol !== 'string') continue;
          const source = vol.split(':')[0];
          if (isHostPathVolumeSource(source)) {
            issues.push(`El servicio "${name}" monta una ruta del host ("${vol}"), lo que no está permitido.`);
          }
        }
      }
    }
  } catch {
    // Si el YAML no se puede analizar, nos quedamos solo con las
    // comprobaciones de texto de arriba (siguen aplicando).
  }

  return issues;
}
