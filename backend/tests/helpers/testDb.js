process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const argon2 = require('argon2');
const { connectDB, disconnectDB } = require('../../src/config/db');
const { User } = require('../../src/models/User');
const { signAccessToken } = require('../../src/utils/tokens');
const { clearTestInbox } = require('../../src/services/emailService');

async function setupTestDb() {
  await connectDB();
}

async function clearTestDb() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  clearTestInbox();
}

async function teardownTestDb() {
  await clearTestDb();
  await disconnectDB();
}

async function createVerifiedUser({
  name = 'Usuario Prueba',
  email = 'usuario@eventhub.test',
  password = 'Password123!',
  role = 'attendee',
  isActive = true,
} = {}) {
  const passwordHash = await argon2.hash(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    isEmailVerified: true,
    isActive,
  });

  const accessToken = signAccessToken(user);
  return { user, accessToken, password };
}

function extractTokenFromEmail(emailEntry) {
  const match = emailEntry.text.match(/token=([a-f0-9]+)/i);
  return match ? match[1] : null;
}

module.exports = {
  setupTestDb,
  clearTestDb,
  teardownTestDb,
  createVerifiedUser,
  extractTokenFromEmail,
};
