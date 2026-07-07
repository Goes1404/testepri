const test = require('node:test');
const assert = require('node:assert/strict');
const { requireAuth } = require('../src/middleware/auth');
const { supabase } = require('../src/db');

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('requireAuth rejects missing Authorization header', async () => {
  const res = mockResponse();
  let nextCalled = false;

  await requireAuth({ headers: {} }, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Missing or malformed Authorization header.');
  assert.equal(nextCalled, false);
});

test('requireAuth rejects invalid or expired Supabase token', async () => {
  const originalGetUser = supabase.auth.getUser;
  supabase.auth.getUser = async token => {
    assert.equal(token, 'expired-token');
    return { data: { user: null }, error: new Error('JWT expired') };
  };

  const res = mockResponse();
  let nextCalled = false;

  try {
    await requireAuth({ headers: { authorization: 'Bearer expired-token' } }, res, () => {
      nextCalled = true;
    });
  } finally {
    supabase.auth.getUser = originalGetUser;
  }

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Invalid or expired authentication token.');
  assert.equal(nextCalled, false);
});

test('requireAuth attaches verified Supabase user and calls next', async () => {
  const originalGetUser = supabase.auth.getUser;
  const user = { id: 'user-123', email: 'aluno@example.com' };
  supabase.auth.getUser = async token => {
    assert.equal(token, 'valid-token');
    return { data: { user }, error: null };
  };

  const req = { headers: { authorization: 'Bearer valid-token' } };
  const res = mockResponse();
  let nextCalled = false;

  try {
    await requireAuth(req, res, () => {
      nextCalled = true;
    });
  } finally {
    supabase.auth.getUser = originalGetUser;
  }

  assert.equal(res.statusCode, 200);
  assert.deepEqual(req.user, user);
  assert.equal(nextCalled, true);
});
