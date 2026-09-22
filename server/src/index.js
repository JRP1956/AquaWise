import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';

const {
  PORT = 4000,
  MONGODB_URI = 'mongodb://127.0.0.1:27017/aquawise',
  SESSION_SECRET,
  CLIENT_ORIGIN = 'http://localhost:5173',
  NODE_ENV = 'development',
} = process.env;

const isProduction = NODE_ENV === 'production';

if (isProduction && !SESSION_SECRET) {
  console.error('SESSION_SECRET must be set in production. Refusing to start with a default secret.');
  process.exit(1);
}

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('Could not connect to MongoDB.');
    console.error(`  URI tried: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
    console.error('  Start a local mongod, or set MONGODB_URI to your Atlas connection string in server/.env');
    process.exit(1);
  }

  const app = createApp({
    mongoUri: MONGODB_URI,
    sessionSecret: SESSION_SECRET || 'dev-only-insecure-secret',
    clientOrigin: CLIENT_ORIGIN,
    isProduction,
  });

  app.listen(PORT, () => console.log(`AquaWise API on http://localhost:${PORT} (${NODE_ENV})`));
}

start();
