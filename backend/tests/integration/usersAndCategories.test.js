const request = require('supertest');
const {
  setupTestDb,
  clearTestDb,
  teardownTestDb,
  createVerifiedUser,
} = require('../helpers/testDb');
const app = require('../../src/app');

describe('Users, RBAC y Categories (/api/users, /api/categories)', () => {
  beforeAll(setupTestDb);
  afterEach(clearTestDb);
  afterAll(teardownTestDb);

  test('protege rutas administrativas con 401 y 403 segun autenticacion y rol', async () => {
    const attendee = await createVerifiedUser({
      email: 'attendee@eventhub.test',
      role: 'attendee',
    });
    const organizer = await createVerifiedUser({
      email: 'organizer@eventhub.test',
      role: 'organizer',
    });
    const admin = await createVerifiedUser({
      email: 'admin@eventhub.test',
      role: 'admin',
    });

    const unauth = await request(app).get('/api/users');
    expect(unauth.status).toBe(401);

    const attendeeRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${attendee.accessToken}`);
    expect(attendeeRes.status).toBe(403);

    const organizerRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${organizer.accessToken}`);
    expect(organizerRes.status).toBe(403);

    const adminRes = await request(app)
      .get('/api/users?limit=10')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data).toHaveLength(3);
    expect(adminRes.body.pagination.total).toBe(3);
  });

  test('permite actualizar perfil propio y que el admin cambie rol o desactive otro usuario', async () => {
    const attendee = await createVerifiedUser({
      name: 'Nombre Inicial',
      email: 'user@eventhub.test',
      role: 'attendee',
    });
    const admin = await createVerifiedUser({
      name: 'Admin Principal',
      email: 'admin@eventhub.test',
      role: 'admin',
    });

    const updateMe = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${attendee.accessToken}`)
      .send({ name: 'Nombre Actualizado' });
    expect(updateMe.status).toBe(200);
    expect(updateMe.body.data.name).toBe('Nombre Actualizado');

    // Admin no puede desactivarse a si mismo
    const selfDeactivate = await request(app)
      .patch(`/api/users/${admin.user._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ isActive: false });
    expect(selfDeactivate.status).toBe(400);

    // Admin cambia rol de attendee a organizer
    const promote = await request(app)
      .patch(`/api/users/${attendee.user._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ role: 'organizer' });
    expect(promote.status).toBe(200);
    expect(promote.body.data.role).toBe('organizer');
  });

  test('CRUD de categorias restringido a admin y listado publico', async () => {
    const attendee = await createVerifiedUser({
      email: 'attendee@eventhub.test',
      role: 'attendee',
    });
    const admin = await createVerifiedUser({
      email: 'admin@eventhub.test',
      role: 'admin',
    });

    const forbiddenCreate = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${attendee.accessToken}`)
      .send({ name: 'Musica' });
    expect(forbiddenCreate.status).toBe(403);

    const createRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Tecnologia', description: 'Charlas y conferencias de software' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.slug).toBe('tecnologia');

    const duplicateRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'tecnologia' });
    expect(duplicateRes.status).toBe(409);

    const publicList = await request(app).get('/api/categories');
    expect(publicList.status).toBe(200);
    expect(publicList.body.data).toHaveLength(1);

    const categoryId = createRes.body.data.id;
    const updateRes = await request(app)
      .patch(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Tecnologia e Innovacion' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.slug).toBe('tecnologia-e-innovacion');

    const deleteRes = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(deleteRes.status).toBe(200);
  });
});
