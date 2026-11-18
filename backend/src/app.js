const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { env } = require('./config/env');
const HttpError = require('./utils/HttpError');
const requestLogger = require('./middlewares/requestLogger');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');

const app = express();

if (env.isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet());
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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EventHub API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
