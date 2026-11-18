require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest,
  port: Number(process.env.PORT) || 3000,

  mongodbUri: isTest
    ? process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/eventhub_test'
    : process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventhub',

  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET || (isTest ? 'test-access-secret-key' : ''),
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || (isTest ? 'test-refresh-secret-key' : ''),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS) || 7,
  },

  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

  googleClientId: process.env.GOOGLE_CLIENT_ID || '',

  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'EventHub <onboarding@resend.dev>',
  },

  storage: {
    endpoint: process.env.STORAGE_ENDPOINT || '',
    region: process.env.STORAGE_REGION || 'auto',
    bucket: process.env.STORAGE_BUCKET || '',
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || '',
    publicUrl: process.env.STORAGE_PUBLIC_URL || '',
  },
};

function validateRequiredEnv() {
  if (env.isTest) return;

  const missing = [];
  if (!env.mongodbUri) missing.push('MONGODB_URI');
  if (!env.jwt.accessSecret) missing.push('JWT_ACCESS_SECRET');
  if (!env.jwt.refreshSecret) missing.push('JWT_REFRESH_SECRET');

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  }
}

module.exports = { env, validateRequiredEnv };
