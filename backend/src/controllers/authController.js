const authService = require('../services/authService');

function getRequestMetadata(req) {
  return {
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
  };
}

async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json({ data: result });
}

async function verifyEmail(req, res) {
  const result = await authService.verifyEmail(req.body.token);
  res.json({ data: result });
}

async function resendVerification(req, res) {
  const result = await authService.resendVerification(req.body.email);
  res.json({ data: result });
}

async function login(req, res) {
  const result = await authService.login(req.body, getRequestMetadata(req));
  res.json({ data: result });
}

async function loginWithGoogle(req, res) {
  const result = await authService.loginWithGoogle(req.body.idToken, getRequestMetadata(req));
  res.json({ data: result });
}

async function refresh(req, res) {
  const result = await authService.refreshSession(req.body.refreshToken);
  res.json({ data: result });
}

async function logout(req, res) {
  const result = await authService.logout(req.body.refreshToken);
  res.json({ data: result });
}

async function logoutAll(req, res) {
  const result = await authService.logoutAll(req.user._id);
  res.json({ data: result });
}

async function me(req, res) {
  res.json({ data: req.user.toPublic() });
}

async function listSessions(req, res) {
  const sessions = await authService.listActiveSessions(req.user._id);
  res.json({ data: sessions });
}

async function forgotPassword(req, res) {
  const result = await authService.forgotPassword(req.body.email);
  res.json({ data: result });
}

async function resetPassword(req, res) {
  const result = await authService.resetPassword(req.body.token, req.body.newPassword);
  res.json({ data: result });
}

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  loginWithGoogle,
  refresh,
  logout,
  logoutAll,
  me,
  listSessions,
  forgotPassword,
  resetPassword,
};
