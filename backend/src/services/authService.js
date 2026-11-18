const argon2 = require('argon2');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const { env } = require('../config/env');
const HttpError = require('../utils/HttpError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
  getRefreshExpirationDate,
} = require('../utils/tokens');
const userRepository = require('../repositories/userRepository');
const sessionRepository = require('../repositories/sessionRepository');
const emailService = require('./emailService');

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

const googleClient = new OAuth2Client(env.googleClientId || undefined);

async function verifyGoogleIdToken(idToken) {
  if (!env.googleClientId) {
    throw new HttpError(503, 'Google OAuth no esta configurado en el servidor');
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new HttpError(401, 'Token de Google invalido');
    }
    return payload;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, 'Token de Google invalido o expirado');
  }
}

async function createSessionTokens(user, metadata = {}) {
  const sessionId = new mongoose.Types.ObjectId();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user._id, sessionId);

  await sessionRepository.createSession({
    _id: sessionId,
    user: user._id,
    refreshTokenHash: hashToken(refreshToken),
    userAgent: metadata.userAgent || '',
    ip: metadata.ip || '',
    expiresAt: getRefreshExpirationDate(),
  });

  return {
    accessToken,
    refreshToken,
    sessionId: sessionId.toString(),
  };
}

async function register({ name, email, password, role = 'attendee' }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new HttpError(409, 'Ya existe una cuenta registrada con ese correo');
  }

  const passwordHash = await argon2.hash(password);
  const verificationToken = generateRandomToken();

  const user = await userRepository.createUser({
    name,
    email,
    passwordHash,
    role,
    authProvider: 'local',
    isEmailVerified: false,
    emailVerificationTokenHash: hashToken(verificationToken),
    emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  });

  await emailService.sendVerificationEmail(user, verificationToken);

  return {
    user: user.toPublic(),
    message: 'Usuario registrado. Revisa tu correo para verificar la cuenta.',
  };
}

async function verifyEmail(rawToken) {
  const tokenHash = hashToken(rawToken);
  const user = await userRepository.findByVerificationTokenHash(tokenHash);

  if (!user) {
    throw new HttpError(400, 'El token de verificacion es invalido o ha expirado');
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();

  return { message: 'Correo verificado correctamente' };
}

async function resendVerification(email) {
  const user = await userRepository.findByEmail(email);

  // Respondemos igual aunque el correo no exista para evitar enumeracion de cuentas.
  if (!user || user.isEmailVerified || !user.isActive) {
    return {
      message: 'Si el correo existe y esta pendiente de verificacion, enviaremos un nuevo enlace.',
    };
  }

  const verificationToken = generateRandomToken();
  user.emailVerificationTokenHash = hashToken(verificationToken);
  user.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
  await user.save();

  await emailService.sendVerificationEmail(user, verificationToken);

  return {
    message: 'Si el correo existe y esta pendiente de verificacion, enviaremos un nuevo enlace.',
  };
}

async function login({ email, password }, metadata = {}) {
  const user = await userRepository.findByEmailWithPassword(email);

  if (!user || !user.passwordHash) {
    throw new HttpError(401, 'Credenciales invalidas');
  }

  const passwordMatches = await argon2.verify(user.passwordHash, password);
  if (!passwordMatches) {
    throw new HttpError(401, 'Credenciales invalidas');
  }

  if (!user.isActive) {
    throw new HttpError(403, 'Esta cuenta se encuentra desactivada');
  }

  if (!user.isEmailVerified) {
    throw new HttpError(403, 'Debes verificar tu correo antes de iniciar sesion');
  }

  const tokens = await createSessionTokens(user, metadata);

  return {
    user: user.toPublic(),
    ...tokens,
  };
}

async function loginWithGoogle(idToken, metadata = {}, verifier = verifyGoogleIdToken) {
  const payload = await verifier(idToken);
  const email = payload.email.toLowerCase();
  const googleId = payload.sub;
  const name = payload.name || email.split('@')[0];

  let user = await userRepository.findByGoogleId(googleId);

  if (!user) {
    user = await userRepository.findByEmail(email);
    if (user) {
      user.googleId = googleId;
      user.isEmailVerified = true;
      await user.save();
    } else {
      user = await userRepository.createUser({
        name,
        email,
        googleId,
        role: 'attendee',
        authProvider: 'google',
        isEmailVerified: true,
      });
    }
  }

  if (!user.isActive) {
    throw new HttpError(403, 'Esta cuenta se encuentra desactivada');
  }

  const tokens = await createSessionTokens(user, metadata);

  return {
    user: user.toPublic(),
    ...tokens,
  };
}

async function refreshSession(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_err) {
    throw new HttpError(401, 'Refresh token invalido o expirado');
  }

  if (payload.type !== 'refresh' || !payload.sid) {
    throw new HttpError(401, 'Refresh token invalido');
  }

  const session = await sessionRepository.findActiveByIdAndHash(
    payload.sid,
    hashToken(refreshToken)
  );
  if (!session) {
    throw new HttpError(401, 'La sesion no existe o ya fue revocada');
  }

  const user = await userRepository.findById(session.user);
  if (!user || !user.isActive) {
    await sessionRepository.revokeById(session._id);
    throw new HttpError(401, 'Usuario no autorizado');
  }

  // Rotamos el refresh token en cada renovacion para reducir el riesgo de reutilizacion.
  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user._id, session._id);

  session.refreshTokenHash = hashToken(newRefreshToken);
  session.expiresAt = getRefreshExpirationDate();
  await session.save();

  return {
    user: user.toPublic(),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

async function logout(refreshToken) {
  const session = await sessionRepository.findActiveByHash(hashToken(refreshToken));
  if (session) {
    await sessionRepository.revokeById(session._id);
  }
  return { message: 'Sesion cerrada correctamente' };
}

async function logoutAll(userId) {
  await sessionRepository.revokeAllByUser(userId);
  return { message: 'Se cerraron todas las sesiones activas' };
}

async function listActiveSessions(userId) {
  const sessions = await sessionRepository.listActiveByUser(userId);
  return sessions.map((session) => session.toJSON());
}

async function forgotPassword(email) {
  const user = await userRepository.findByEmail(email);

  if (user && user.isActive) {
    const resetToken = generateRandomToken();
    user.passwordResetTokenHash = hashToken(resetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await user.save();

    await emailService.sendPasswordResetEmail(user, resetToken);
  }

  return {
    message: 'Si el correo esta registrado, recibiras un enlace para restablecer tu contrasena.',
  };
}

async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashToken(rawToken);
  const user = await userRepository.findByPasswordResetTokenHash(tokenHash);

  if (!user) {
    throw new HttpError(400, 'El token de recuperacion es invalido o ha expirado');
  }

  user.passwordHash = await argon2.hash(newPassword);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  // Invalidamos sesiones anteriores al cambiar la contrasena.
  await sessionRepository.revokeAllByUser(user._id);

  return { message: 'Contrasena actualizada correctamente' };
}

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  loginWithGoogle,
  refreshSession,
  logout,
  logoutAll,
  listActiveSessions,
  forgotPassword,
  resetPassword,
};
