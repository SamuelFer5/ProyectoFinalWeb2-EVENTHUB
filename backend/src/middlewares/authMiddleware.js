const HttpError = require('../utils/HttpError');
const { verifyAccessToken } = require('../utils/tokens');
const userRepository = require('../repositories/userRepository');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Token de autenticacion requerido'));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(new HttpError(401, 'Token de autenticacion requerido'));
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (_err) {
    return next(new HttpError(401, 'Token invalido o expirado'));
  }

  if (payload.type !== 'access') {
    return next(new HttpError(401, 'Tipo de token invalido'));
  }

  const user = await userRepository.findById(payload.sub);
  if (!user || !user.isActive) {
    return next(new HttpError(401, 'Usuario no autorizado o inactivo'));
  }

  req.user = user;
  next();
}

module.exports = authenticate;
