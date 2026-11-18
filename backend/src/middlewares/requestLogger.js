const crypto = require('crypto');
const { env } = require('../config/env');

function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  const start = Date.now();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    if (env.isTest) return;
    const duration = Date.now() - start;
    console.log(`[${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}

module.exports = requestLogger;
