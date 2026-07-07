const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../index');

function listen() {
  return new Promise(resolve => {
    const server = app.listen(0, () => resolve(server));
  });
}

test('legal config publishes compliance values from environment', async () => {
  const previousEnv = {
    TERMS_VERSION: process.env.TERMS_VERSION,
    PRIVACY_POLICY_VERSION: process.env.PRIVACY_POLICY_VERSION,
    TERMS_URL: process.env.TERMS_URL,
    PRIVACY_URL: process.env.PRIVACY_URL,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    SUPPORT_WHATSAPP: process.env.SUPPORT_WHATSAPP,
    DPO_EMAIL: process.env.DPO_EMAIL,
    CNPJ: process.env.CNPJ,
    RAZAO_SOCIAL: process.env.RAZAO_SOCIAL
  };

  Object.assign(process.env, {
    TERMS_VERSION: '2026-07-07',
    PRIVACY_POLICY_VERSION: '2026-07-07',
    TERMS_URL: 'https://example.com/termos',
    PRIVACY_URL: 'https://example.com/privacidade',
    SUPPORT_EMAIL: 'suporte@example.com',
    SUPPORT_WHATSAPP: '+5511999999999',
    DPO_EMAIL: 'dpo@example.com',
    CNPJ: '12.345.678/0001-90',
    RAZAO_SOCIAL: 'Empresa Exemplo Ltda'
  });

  const server = await listen();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/config/legal`);
    assert.equal(response.ok, true);
    const legal = await response.json();

    assert.equal(legal.termsVersion, '2026-07-07');
    assert.equal(legal.privacyVersion, '2026-07-07');
    assert.equal(legal.termsUrl, 'https://example.com/termos');
    assert.equal(legal.privacyUrl, 'https://example.com/privacidade');
    assert.equal(legal.support.email, 'suporte@example.com');
    assert.equal(legal.support.whatsapp, '+5511999999999');
    assert.equal(legal.dataProtection.dpoEmail, 'dpo@example.com');
    assert.equal(legal.entity.cnpj, '12.345.678/0001-90');
    assert.equal(legal.entity.razaoSocial, 'Empresa Exemplo Ltda');
  } finally {
    await new Promise(resolve => server.close(resolve));
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
