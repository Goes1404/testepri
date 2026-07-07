const crypto = require('crypto');

function getKey() {
  const secret = process.env.PII_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || 'dev-only-portal-aluno-key';
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptText(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return [
    'aes-256-gcm',
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64')
  ].join(':');
}

function decryptText(payload) {
  if (!payload) return null;
  const [algorithm, ivBase64, tagBase64, encryptedBase64] = String(payload).split(':');
  if (algorithm !== 'aes-256-gcm') {
    throw new Error('Unsupported encrypted payload.');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivBase64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, 'base64')),
    decipher.final()
  ]).toString('utf8');
}

module.exports = {
  encryptText,
  decryptText
};
