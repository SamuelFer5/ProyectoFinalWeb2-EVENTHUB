const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id || user._id.toString(),
      role: user.role,
      email: user.email,
      type: 'access',
    },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn, jwtid: crypto.randomUUID() }
  );
}

function signRefreshToken(userId, sessionId) {
  return jwt.sign(
    {
      sub: userId.toString(),
      sid: sessionId.toString(),
      type: 'refresh',
    },
    env.jwt.refreshSecret,
    { expiresIn: `${env.jwt.refreshExpiresDays}d`, jwtid: crypto.randomUUID() }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Guardamos el hash SHA-256 en base de datos para no exponer el token original.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshExpirationDate() {
  const ms = env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
  getRefreshExpirationDate,
};
