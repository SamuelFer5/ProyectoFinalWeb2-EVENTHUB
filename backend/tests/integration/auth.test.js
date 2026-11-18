const request = require('supertest');
const {
  setupTestDb,
  clearTestDb,
  teardownTestDb,
  extractTokenFromEmail,
} = require('../helpers/testDb');
const app = require('../../src/app');
const { getTestInbox } = require('../../src/services/emailService');

describe('Auth endpoints (/api/auth)', () => {
  beforeAll(setupTestDb);
  afterEach(clearTestDb);
  afterAll(teardownTestDb);

  test('flujo completo: registro, verificacion de correo, login, refresh con rotacion y logout', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Samuel Fernandez',
      email: 'samuel@eventhub.test',
      password: 'Password123!',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.user.role).toBe('attendee');
    expect(registerRes.body.data.user.isEmailVerified).toBe(false);

    // No debe permitir login antes de verificar el correo
    const blockedLogin = await request(app).post('/api/auth/login').send({
      email: 'samuel@eventhub.test',
      password: 'Password123!',
    });
    expect(blockedLogin.status).toBe(403);

    // Extraemos el token enviado por correo y verificamos
    const verifyToken = extractTokenFromEmail(getTestInbox()[0]);
    expect(verifyToken).toBeTruthy();

    const verifyRes = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verifyToken });
    expect(verifyRes.status).toBe(200);

    // El token de verificacion debe ser de un solo uso
    const reuseVerify = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verifyToken });
    expect(reuseVerify.status).toBe(400);

    // Login exitoso
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'samuel@eventhub.test',
      password: 'Password123!',
    });
    expect(loginRes.status).toBe(200);
    const { accessToken, refreshToken } = loginRes.body.data;
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // Consultar /me y sesiones activas
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('samuel@eventhub.test');

    const sessionsRes = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(sessionsRes.status).toBe(200);
    expect(sessionsRes.body.data).toHaveLength(1);

    // Refresh rota el refreshToken e invalida el anterior
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    const rotatedRefreshToken = refreshRes.body.data.refreshToken;
    expect(rotatedRefreshToken).toBeTruthy();
    expect(rotatedRefreshToken).not.toBe(refreshToken);

    const reuseOldRefresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(reuseOldRefresh.status).toBe(401);

    // Logout revoca la sesion actual
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: rotatedRefreshToken });
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: rotatedRefreshToken });
    expect(refreshAfterLogout.status).toBe(401);
  });

  test('flujo de recuperacion y restablecimiento de contrasena invalida sesiones previas', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alejandro Corrales',
      email: 'alejandro@eventhub.test',
      password: 'OldPassword123!',
    });

    const verifyToken = extractTokenFromEmail(getTestInbox()[0]);
    await request(app).post('/api/auth/verify-email').send({ token: verifyToken });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'alejandro@eventhub.test',
      password: 'OldPassword123!',
    });
    const oldRefreshToken = loginRes.body.data.refreshToken;

    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'alejandro@eventhub.test' });
    expect(forgotRes.status).toBe(200);

    const inbox = getTestInbox();
    const resetToken = extractTokenFromEmail(inbox[inbox.length - 1]);
    expect(resetToken).toBeTruthy();

    const resetRes = await request(app).post('/api/auth/reset-password').send({
      token: resetToken,
      newPassword: 'NewPassword456!',
    });
    expect(resetRes.status).toBe(200);

    // Token de recuperacion de un solo uso
    const reuseReset = await request(app).post('/api/auth/reset-password').send({
      token: resetToken,
      newPassword: 'AnotherPassword789!',
    });
    expect(reuseReset.status).toBe(400);

    // Sesion anterior debe quedar revocada
    const refreshOld = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefreshToken });
    expect(refreshOld.status).toBe(401);

    // Login con la contrasena anterior falla y con la nueva funciona
    const badLogin = await request(app).post('/api/auth/login').send({
      email: 'alejandro@eventhub.test',
      password: 'OldPassword123!',
    });
    expect(badLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/auth/login').send({
      email: 'alejandro@eventhub.test',
      password: 'NewPassword456!',
    });
    expect(newLogin.status).toBe(200);
  });

  test('validaciones de registro rechazan rol admin y datos invalidos', async () => {
    const adminAttempt = await request(app).post('/api/auth/register').send({
      name: 'Intento Admin',
      email: 'admin@eventhub.test',
      password: 'Password123!',
      role: 'admin',
    });
    expect(adminAttempt.status).toBe(400);

    const shortPassword = await request(app).post('/api/auth/register').send({
      name: 'Ana',
      email: 'correo-invalido',
      password: '123',
    });
    expect(shortPassword.status).toBe(400);
    expect(shortPassword.body.details).toBeDefined();
  });
});
