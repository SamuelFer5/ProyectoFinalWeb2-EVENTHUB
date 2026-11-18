const request = require('supertest');
const {
  setupTestDb,
  clearTestDb,
  teardownTestDb,
  createVerifiedUser,
} = require('../helpers/testDb');
const app = require('../../src/app');
const Category = require('../../src/models/Category');

function futureDate(daysAhead = 15) {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();
}

describe('Events endpoints (/api/events)', () => {
  beforeAll(setupTestDb);
  afterEach(clearTestDb);
  afterAll(teardownTestDb);

  test('ciclo de vida de eventos, permisos por propietario y filtros publicos', async () => {
    const attendee = await createVerifiedUser({
      email: 'attendee@eventhub.test',
      role: 'attendee',
    });
    const org1 = await createVerifiedUser({
      name: 'Organizador Uno',
      email: 'org1@eventhub.test',
      role: 'organizer',
    });
    const org2 = await createVerifiedUser({
      name: 'Organizador Dos',
      email: 'org2@eventhub.test',
      role: 'organizer',
    });
    const admin = await createVerifiedUser({
      name: 'Admin',
      email: 'admin@eventhub.test',
      role: 'admin',
    });

    const techCat = await Category.create({
      name: 'Tecnologia',
      slug: 'tecnologia',
    });
    const musicCat = await Category.create({
      name: 'Musica',
      slug: 'musica',
    });

    // Attendee no puede crear eventos
    const forbidden = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${attendee.accessToken}`)
      .send({
        title: 'Evento No Permitido',
        description: 'Descripcion valida de prueba para evento',
        category: techCat._id.toString(),
        location: 'San Jose',
        date: futureDate(10),
        capacity: 50,
      });
    expect(forbidden.status).toBe(403);

    // Organizador 1 crea un evento en borrador
    const draftRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${org1.accessToken}`)
      .send({
        title: 'Taller de Node y MongoDB',
        description: 'Aprende arquitectura modular en Express y MongoDB',
        category: techCat._id.toString(),
        location: 'San Carlos, Alajuela',
        date: futureDate(10),
        capacity: 40,
        price: 0,
      });
    expect(draftRes.status).toBe(201);
    expect(draftRes.body.data.status).toBe('draft');
    expect(draftRes.body.data.availableSpots).toBe(40);
    const eventId = draftRes.body.data.id;

    // Evento en borrador no aparece en el catalogo publico
    const emptyPublic = await request(app).get('/api/events');
    expect(emptyPublic.status).toBe(200);
    expect(emptyPublic.body.data).toHaveLength(0);

    // Otro organizador no puede editar ni publicar el evento ajeno
    const stealEdit = await request(app)
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${org2.accessToken}`)
      .send({ title: 'Cambio no autorizado' });
    expect(stealEdit.status).toBe(403);

    // Propietario publica el evento
    const publishRes = await request(app)
      .patch(`/api/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${org1.accessToken}`);
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe('published');

    // Organizador 2 crea un segundo evento publicado de pago
    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${org2.accessToken}`)
      .send({
        title: 'Concierto Acustico',
        description: 'Noche de musica en vivo en el teatro nacional',
        category: musicCat._id.toString(),
        location: 'San Jose Centro',
        date: futureDate(20),
        capacity: 120,
        price: 15000,
        status: 'published',
      });

    // Catalogo publico con filtros (free=true y category)
    const freeEvents = await request(app).get('/api/events?free=true');
    expect(freeEvents.status).toBe(200);
    expect(freeEvents.body.data).toHaveLength(1);
    expect(freeEvents.body.data[0].title).toBe('Taller de Node y MongoDB');

    const byLocation = await request(app).get('/api/events?location=San%20Jose');
    expect(byLocation.status).toBe(200);
    expect(byLocation.body.data).toHaveLength(1);
    expect(byLocation.body.data[0].title).toBe('Concierto Acustico');

    // Subida de imagen valida y rechazo de archivo no permitido
    const uploadRes = await request(app)
      .post(`/api/events/${eventId}/image`)
      .set('Authorization', `Bearer ${org1.accessToken}`)
      .attach('image', Buffer.from('fake-png-content'), {
        filename: 'banner.png',
        contentType: 'image/png',
      });
    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.data.imageUrl).toContain('events/');

    const badFileRes = await request(app)
      .post(`/api/events/${eventId}/image`)
      .set('Authorization', `Bearer ${org1.accessToken}`)
      .attach('image', Buffer.from('not-an-image'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });
    expect(badFileRes.status).toBe(400);

    // No se puede eliminar una categoria con eventos asociados
    const deleteUsedCategory = await request(app)
      .delete(`/api/categories/${techCat._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(deleteUsedCategory.status).toBe(409);

    // Cancelar evento
    const cancelRes = await request(app)
      .patch(`/api/events/${eventId}/cancel`)
      .set('Authorization', `Bearer ${org1.accessToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('cancelled');
  });

  test('expone documentacion OpenAPI y endpoint de salud', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');

    const spec = await request(app).get('/openapi.json');
    expect(spec.status).toBe(200);
    expect(spec.body.info.title).toBe('EventHub API');
  });
});
