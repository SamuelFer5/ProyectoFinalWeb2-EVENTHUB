const Session = require('../models/Session');

function createSession(data) {
  return Session.create(data);
}

function findActiveByIdAndHash(sessionId, refreshTokenHash) {
  return Session.findOne({
    _id: sessionId,
    refreshTokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
}

function findActiveByHash(refreshTokenHash) {
  return Session.findOne({
    refreshTokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
}

function listActiveByUser(userId) {
  return Session.find({
    user: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ updatedAt: -1 });
}

function revokeById(sessionId) {
  return Session.findByIdAndUpdate(sessionId, { revokedAt: new Date() }, { returnDocument: 'after' });
}

function revokeAllByUser(userId) {
  return Session.updateMany(
    { user: userId, revokedAt: null },
    { revokedAt: new Date() }
  );
}

module.exports = {
  createSession,
  findActiveByIdAndHash,
  findActiveByHash,
  listActiveByUser,
  revokeById,
  revokeAllByUser,
};
