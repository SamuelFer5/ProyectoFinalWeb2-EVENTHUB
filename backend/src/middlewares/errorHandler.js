const HttpError = require('../utils/HttpError');
const { env } = require('../config/env');

function notFound(req, res, next) {
  next(new HttpError(404, 'Ruta no encontrada'));
}

function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'JSON mal formado',
      requestId: req.requestId,
    });
  }

  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamano maximo permitido'
        : 'Error al procesar el archivo subido';
    return res.status(400).json({
      error: message,
      requestId: req.requestId,
    });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((item) => item.message)
      .join('; ');
    return res.status(400).json({
      error: message,
      requestId: req.requestId,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Valor invalido para ${err.path}`,
      requestId: req.requestId,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'campo';
    return res.status(409).json({
      error: `Ya existe un registro con ese ${field}`,
      requestId: req.requestId,
    });
  }

  if (err instanceof HttpError) {
    const body = {
      error: err.message,
      requestId: req.requestId,
    };
    if (err.details) {
      body.details = err.details;
    }
    return res.status(err.status).json(body);
  }

  if (!env.isTest) {
    console.error(err);
  }

  return res.status(500).json({
    error: 'Error interno del servidor',
    requestId: req.requestId,
  });
}

module.exports = { notFound, errorHandler };
