import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repairInvalidJsonEscapes } from './jsonRepair';

test('repara un escape invalido como \\$PATH en un campo de script dentro del JSON', () => {
  const broken = '{"provisionScript":"export PATH=/tmp:\\$PATH"}';
  assert.throws(() => JSON.parse(broken));
  const repaired = repairInvalidJsonEscapes(broken);
  const parsed = JSON.parse(repaired);
  assert.equal(parsed.provisionScript, 'export PATH=/tmp:\\$PATH');
});

test('no toca escapes ya validos (\\n, \\", \\\\, \\u00e9)', () => {
  const valid = '{"a":"line1\\nline2","b":"quote\\"here","c":"back\\\\slash","d":"\\u00e9"}';
  assert.equal(repairInvalidJsonEscapes(valid), valid);
  const parsed = JSON.parse(repairInvalidJsonEscapes(valid));
  assert.equal(parsed.a, 'line1\nline2');
  assert.equal(parsed.d, 'é');
});
