import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAndParseScenario } from './scenarioIo';

test('rechaza un archivo vacío', () => {
  const result = validateAndParseScenario('', 'vacio.json');
  assert.ok(result.error);
  assert.ok(!result.scenario);
});

test('rechaza JSON sin los campos obligatorios codename/themeName', () => {
  const result = validateAndParseScenario(JSON.stringify({ story: 'solo una historia' }), 'incompleto.json');
  assert.ok(result.error);
});

test('rechaza contenido que no es ni JSON ni YAML válido', () => {
  const result = validateAndParseScenario('{{{ esto no es nada', 'roto.json');
  assert.ok(result.error);
});

test('acepta un escenario mínimo válido y rellena los valores por defecto', () => {
  const result = validateAndParseScenario(
    JSON.stringify({ codename: 'test_01', themeName: 'Reto de prueba' }),
    'minimo.json'
  );
  assert.ok(result.scenario);
  assert.equal(result.scenario!.codename, 'TEST_01');
  assert.equal(result.scenario!.themeName, 'Reto de prueba');
  assert.equal(result.scenario!.difficulty, 'Medium');
  assert.ok(result.scenario!.openPorts.length > 0);
  assert.ok(result.scenario!.hints.length > 0);
});

test('trunca campos de texto excesivamente largos en vez de aceptarlos íntegros', () => {
  const hugeStory = 'A'.repeat(50_000);
  const result = validateAndParseScenario(
    JSON.stringify({ codename: 'LARGO_01', themeName: 'Test', story: hugeStory }),
    'largo.json'
  );
  assert.ok(result.scenario);
  assert.ok(result.scenario!.story.length < hugeStory.length);
});

test('ignora una dificultad fuera del enum permitido y usa el valor por defecto', () => {
  const result = validateAndParseScenario(
    JSON.stringify({ codename: 'ENUM_01', themeName: 'Test', difficulty: 'SuperImposible' }),
    'enum.json'
  );
  assert.ok(result.scenario);
  assert.equal(result.scenario!.difficulty, 'Medium');
});

test('un docker-compose con privileged:true se sustituye por una plantilla segura y genera un aviso', () => {
  const malicious = `version: '3.8'\nservices:\n  target:\n    image: alpine\n    privileged: true\n`;
  const result = validateAndParseScenario(
    JSON.stringify({ codename: 'EVIL_01', themeName: 'Test', dockerCompose: malicious }),
    'evil.json'
  );
  assert.ok(result.scenario);
  assert.ok(!result.scenario!.dockerCompose.includes('privileged'));
  assert.ok(result.warnings && result.warnings.length > 0);
});

test('un docker-compose sin directivas peligrosas se conserva tal cual, sin avisos', () => {
  const safe = `version: '3.8'\nservices:\n  target:\n    image: alpine\n    ports:\n      - "127.0.0.1:8080:80"\n`;
  const result = validateAndParseScenario(
    JSON.stringify({ codename: 'SAFE_01', themeName: 'Test', dockerCompose: safe }),
    'safe.json'
  );
  assert.ok(result.scenario);
  assert.equal(result.scenario!.dockerCompose, safe.trim());
  assert.ok(!result.warnings || result.warnings.length === 0);
});

test('acepta el mismo contenido en formato YAML', () => {
  const yamlContent = 'codename: YAML_01\nthemeName: Reto en YAML\ndifficulty: Hard\n';
  const result = validateAndParseScenario(yamlContent, 'reto.yaml');
  assert.ok(result.scenario);
  assert.equal(result.scenario!.codename, 'YAML_01');
  assert.equal(result.scenario!.difficulty, 'Hard');
});
