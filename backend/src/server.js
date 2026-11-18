const { env, validateRequiredEnv } = require('./config/env');
const { connectDB } = require('./config/db');
const app = require('./app');

async function startServer() {
  validateRequiredEnv();
  await connectDB();

  app.listen(env.port, () => {
    console.log(`EventHub API escuchando en http://localhost:${env.port}`);
  });
}

startServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err.message);
  process.exit(1);
});
