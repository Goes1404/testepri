const test = require('node:test');
const assert = require('node:assert/strict');
const { scanBuffer, EICAR_SIGNATURE } = require('../src/services/virusScan');

test('scanBuffer accepts a clean file', async () => {
  const result = await scanBuffer(Buffer.from('%PDF-1.4 conteudo legitimo de teste'));
  assert.equal(result.clean, true);
  assert.equal(result.virusName, null);
});

test('scanBuffer rejects the EICAR test file', async () => {
  const result = await scanBuffer(Buffer.from(EICAR_SIGNATURE));
  assert.equal(result.clean, false);
  assert.ok(result.virusName);
});
