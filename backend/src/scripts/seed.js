const argon2 = require('argon2');
const { connectDB, disconnectDB } = require('../config/db');
const { User } = require('../models/User');
const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Tecnologia', slug: 'tecnologia', description: 'Charlas, talleres y conferencias de tecnologia' },
  { name: 'Musica', slug: 'musica', description: 'Conciertos, festivales y presentaciones en vivo' },
  { name: 'Deportes', slug: 'deportes', description: 'Torneos, carreras y actividades deportivas' },
  { name: 'Educacion', slug: 'educacion', description: 'Cursos, seminarios y congresos academicos' },
  { name: 'Arte y Cultura', slug: 'arte-y-cultura', description: 'Exposiciones, teatro y eventos culturales' },
];

async function runSeed() {
  await connectDB();

  for (const item of DEFAULT_CATEGORIES) {
    await Category.updateOne({ slug: item.slug }, { $setOnInsert: item }, { upsert: true });
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@eventhub.local').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminEventHub123!';

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await argon2.hash(adminPassword);
    await User.create({
      name: 'Administrador EventHub',
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });
    console.log(`Admin inicial creado: ${adminEmail}`);
  } else {
    console.log(`Admin ya existente: ${adminEmail}`);
  }

  console.log('Categorias base listas');
  await disconnectDB();
}

runSeed().catch((err) => {
  console.error('Error ejecutando seed:', err.message);
  process.exit(1);
});
