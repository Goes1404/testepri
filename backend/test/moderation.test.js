const test = require('node:test');
const assert = require('node:assert');
const { moderateText } = require('../src/services/moderation');

test('moderateText allows normal community content', () => {
  const result = moderateText('Consegui bolsa integral de Medicina pelo ProUni! Muito feliz.');
  assert.strictEqual(result.allowed, true);
  assert.deepStrictEqual(result.matches, []);
});

test('moderateText blocks profanity', () => {
  const result = moderateText('esse curso é uma merda');
  assert.strictEqual(result.allowed, false);
  assert.ok(result.matches.length > 0);
});

test('moderateText blocks scam phrases', () => {
  const result = moderateText('Compre sua vaga garantida, me chame no privado');
  assert.strictEqual(result.allowed, false);
});

test('moderateText catches accented/normalized variants', () => {
  const result = moderateText('você é um otário');
  assert.strictEqual(result.allowed, false);
});

test('moderateText does not flag words containing blacklisted substrings', () => {
  // "imersão" contém "mer", "computação" contém "puta"? não — mas garante fronteira de palavra
  const result = moderateText('A computação quântica é o futuro da imersão acadêmica');
  assert.strictEqual(result.allowed, true);
});
