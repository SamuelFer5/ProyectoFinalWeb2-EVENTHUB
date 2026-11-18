const { verifyAccessToken } = require('../utils/tokens');
const userRepository = require('../repositories/userRepository');

// Permite identificar al usuario si envia token, pero deja pasar peticiones anonimas.
async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload.type === 'access') {
      const user = await userRepository.findById(payload.sub);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (_err) {
    // Si el token no es valido en una ruta publica, seguimos como usuario anonimo.
  }

  next();
}

module.exports = optionalAuthenticate;
