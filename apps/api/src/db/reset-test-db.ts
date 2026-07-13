import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { loadConfig } from '../config/env.js';
import { createDatabase } from './client.js';
import { seedDatabase } from './seed.js';

const config = loadConfig();
const databaseName = new URL(config.DATABASE_URL).pathname.slice(1);
if (config.NODE_ENV !== 'test' || !databaseName.toLowerCase().includes('test')) {
  throw new Error('Refusing reset: NODE_ENV must be test and database name must contain "test"');
}

const { db, pool } = createDatabase(config);
try {
  await pool.query('drop schema public cascade; create schema public');
  await migrate(db, { migrationsFolder: new URL('./migrations', import.meta.url).pathname });
  await seedDatabase(db, config);
  console.info(`Test database ${databaseName} reset completed`);
} finally {
  await pool.end();
}
