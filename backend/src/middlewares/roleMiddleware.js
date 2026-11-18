const HttpError = require('../utils/HttpError');

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'Autenticacion requerida'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, 'No tienes permisos para realizar esta accion'));
    }

    next();
  };
}

module.exports = authorize;
