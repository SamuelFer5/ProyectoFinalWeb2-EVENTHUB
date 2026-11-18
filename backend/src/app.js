const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const { env } = require('./config/env');
const HttpError = require('./utils/HttpError');
const openapiSpec = require('./docs/openapi');
const requestLogger = require('./middlewares/requestLogger');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

if (env.isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new HttpError(403, 'Origen no permitido por CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use('/api', apiLimiter);

app.get('/openapi.json', (req, res) => {
  res.json(openapiSpec);
});

// Scalar distribuye un modulo ESM que el cargador CJS de Jest no importa con require.
if (!env.isTest) {
  const { apiReference } = require('@scalar/express-api-reference');
  app.use(
    '/docs/scalar',
    apiReference({
      content: openapiSpec,
      theme: 'purple',
    })
  );
}

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    customSiteTitle: 'EventHub API - Documentacion',
  })
);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EventHub API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
