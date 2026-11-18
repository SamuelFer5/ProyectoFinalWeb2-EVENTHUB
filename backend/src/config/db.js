const mongoose = require('mongoose');
const { env } = require('./env');

async function connectDB(customUri) {
  const uri = customUri || env.mongodbUri;
  if (!uri) {
    throw new Error('Falta MONGODB_URI en el archivo .env');
  }

  await mongoose.connect(uri);

  if (!env.isTest) {
    console.log('MongoDB conectado correctamente');
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
