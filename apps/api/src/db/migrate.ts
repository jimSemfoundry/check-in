import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { loadConfig } from '../config/env.js';
import { createDatabase } from './client.js';
import { migrationsFolder } from './migration-path.js';

const config = loadConfig();
const { db, pool } = createDatabase(config);

try {
  await migrate(db, { migrationsFolder });
  console.info('Database migrations completed');
} finally {
  await pool.end();
}
