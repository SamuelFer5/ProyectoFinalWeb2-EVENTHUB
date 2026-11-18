const {
  setupTestDb,
  clearTestDb,
  teardownTestDb,
  createVerifiedUser,
} = require('../helpers/testDb');
const authService = require('../../src/services/authService');
const { User } = require('../../src/models/User');
const { getTestInbox } = require('../../src/services/emailService');

describe('authService (pruebas unitarias)', () => {
  beforeAll(setupTestDb);
  afterEach(clearTestDb);
  afterAll(teardownTestDb);

  test('registra un usuario con contrasena hasheada y envia correo de verificacion', async () => {
    const result = await authService.register({
      name: 'Samuel Fernandez',
      email: 'samuel@eventhub.test',
      password: 'Password123!',
      role: 'organizer',
    });

    expect(result.user.email).toBe('samuel@eventhub.test');
    expect(result.user.role).toBe('organizer');
    expect(result.user.isEmailVerified).toBe(false);
    expect(result.user.passwordHash).toBeUndefined();

    const stored = await User.findOne({ email: 'samuel@eventhub.test' }).select('+passwordHash');
    expect(stored.passwordHash).toMatch(/^\$argon2/);
    expect(stored.passwordHash).not.toBe('Password123!');

    const inbox = getTestInbox();
    expect(inbox).toHaveLength(1);
    expect(inbox[0].to).toBe('samuel@eventhub.test');
  });

  test('rechaza registro duplicado con HttpError 409', async () => {
    await createVerifiedUser({ email: 'dup@eventhub.test' });

    await expect(
      authService.register({
        name: 'Otro Usuario',
        email: 'dup@eventhub.test',
        password: 'Password123!',
      })
    ).rejects.toMatchObject({ status: 409 });
  });

  test('crea y autentica usuario con Google OAuth usando verificador', async () => {
    const mockVerifier = async () => ({
      sub: 'google-uid-123',
      email: 'alejandro@gmail.com',
      name: 'Alejandro Corrales',
    });

    const firstLogin = await authService.loginWithGoogle('fake-google-token', {}, mockVerifier);
    expect(firstLogin.user.email).toBe('alejandro@gmail.com');
    expect(firstLogin.user.authProvider).toBe('google');
    expect(firstLogin.user.isEmailVerified).toBe(true);
    expect(firstLogin.accessToken).toBeTruthy();
    expect(firstLogin.refreshToken).toBeTruthy();

    const secondLogin = await authService.loginWithGoogle('fake-google-token', {}, mockVerifier);
    expect(secondLogin.user.id).toBe(firstLogin.user.id);
  });

  test('rechaza refresh token invalido con 401', async () => {
    await expect(authService.refreshSession('token-falso-invalido')).rejects.toMatchObject({
      status: 401,
    });
  });
});
