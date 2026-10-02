import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './htmlEscape';
import { generateHtmlReport } from './generateHtmlReport';
import { generateCertificateHtml } from './generateCertificateHtml';
import { CTFScenario } from '../types';

const XSS_PAYLOAD = '<img src=x onerror=alert(1)>';

test('escapeHtml neutraliza etiquetas, comillas y el payload clásico de XSS', () => {
  const escaped = escapeHtml(XSS_PAYLOAD);
  assert.ok(!escaped.includes('<img'));
  assert.ok(!escaped.includes('>'));
  assert.equal(escaped, '&lt;img src=x onerror=alert(1)&gt;');
});

test('escapeHtml escapa & " \' independientemente', () => {
  assert.equal(escapeHtml('&'), '&amp;');
  assert.equal(escapeHtml('"'), '&quot;');
  assert.equal(escapeHtml("'"), '&#039;');
});

function buildScenario(overrides: Partial<CTFScenario> = {}): CTFScenario {
  return {
    codename: XSS_PAYLOAD,
    themeName: XSS_PAYLOAD,
    difficulty: 'Medium',
    vector: XSS_PAYLOAD,
    secondaryVector: XSS_PAYLOAD,
    targetOS: XSS_PAYLOAD,
    ip: XSS_PAYLOAD,
    story: XSS_PAYLOAD,
    userFlag: XSS_PAYLOAD,
    rootFlag: XSS_PAYLOAD,
    userFlagPath: XSS_PAYLOAD,
    rootFlagPath: XSS_PAYLOAD,
    openPorts: [{ port: 80, service: XSS_PAYLOAD, version: XSS_PAYLOAD, purpose: XSS_PAYLOAD }],
    topology: { nodes: [], links: [] },
    provisionScript: '',
    dockerfile: '',
    dockerCompose: '',
    pythonScript: '',
    walkthrough: XSS_PAYLOAD,
    hints: [{ id: 'h1', level: 1, title: XSS_PAYLOAD, category: 'recon', text: XSS_PAYLOAD }],
    ...overrides,
  };
}

test('generateHtmlReport no deja pasar <img onerror> sin escapar en ningún campo del escenario', () => {
  const html = generateHtmlReport(buildScenario());
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'), 'el payload crudo no debe aparecer en el HTML generado');
  assert.ok(html.includes('&lt;img'), 'el payload escapado sí debe aparecer');
});

test('generateCertificateHtml escapa el nombre del alumno y los datos del escenario', () => {
  const html = generateCertificateHtml({
    studentName: XSS_PAYLOAD,
    scenario: buildScenario(),
    dateStr: '1 de enero de 2026',
    serialNumber: 'ABC-123',
    sha256Hash: 'deadbeef',
  });
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'), 'el payload crudo no debe aparecer en el certificado');
  assert.ok(html.includes('&lt;img'), 'el payload escapado sí debe aparecer');
});
