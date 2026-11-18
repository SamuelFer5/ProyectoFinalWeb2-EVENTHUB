const { User } = require('../models/User');

function createUser(data) {
  return User.create(data);
}

function findById(id) {
  return User.findById(id);
}

function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase() });
}

function findByEmailWithPassword(email) {
  return User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
}

function findByGoogleId(googleId) {
  return User.findOne({ googleId });
}

function findByVerificationTokenHash(tokenHash) {
  return User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() },
  }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
}

function findByPasswordResetTokenHash(tokenHash) {
  return User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpiresAt +passwordHash');
}

function updateById(id, updates) {
  return User.findByIdAndUpdate(id, updates, { returnDocument: 'after', runValidators: true });
}

async function listUsers({ filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) {
  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return { items, total };
}

module.exports = {
  createUser,
  findById,
  findByEmail,
  findByEmailWithPassword,
  findByGoogleId,
  findByVerificationTokenHash,
  findByPasswordResetTokenHash,
  updateById,
  listUsers,
};
