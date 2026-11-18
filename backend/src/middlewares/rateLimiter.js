const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

const skipInTest = () => env.isTest && process.env.ENABLE_RATE_LIMIT_IN_TEST !== 'true';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    error: 'Demasiadas solicitudes, intenta de nuevo mas tarde',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    error: 'Demasiados intentos de autenticacion, intenta de nuevo en unos minutos',
  },
});

module.exports = { apiLimiter, authLimiter };
