const crypto = require('node:crypto');
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex')}`;
}
function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
module.exports = { hashPassword, verifyPassword };
