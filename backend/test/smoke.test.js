const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../index');

function listen() {
  return new Promise(resolve => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function getJson(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.ok, true, `${path} should respond with 2xx`);
  return response.json();
}

test('public API smoke flow', async () => {
  const server = await listen();
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const health = await getJson(baseUrl, '/api/health');
    assert.equal(health.status, 'ok');

    const legal = await getJson(baseUrl, '/api/config/legal');
    assert.ok(legal.termsUrl);
    assert.ok(legal.privacyUrl);
    assert.ok(legal.support.email);

    for (let i = 0; i < 8; i += 1) {
      await getJson(baseUrl, '/api/health');
    }

    const metrics = await getJson(baseUrl, '/api/metrics');
    assert.ok(metrics.requests >= 9);
    assert.ok(metrics.latency.p95Ms < 500, `p95 latency was ${metrics.latency.p95Ms}ms`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
