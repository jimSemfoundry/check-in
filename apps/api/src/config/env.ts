import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const rootEnvPath = fileURLToPath(new URL('../../../../.env', import.meta.url));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65_535).default(3001),
  DATABASE_URL: z.url().startsWith('postgresql://'),
  COOKIE_SECRET: z.string().min(32),
  ACCESS_KEY_PEPPER: z.string().min(32),
  WEB_ORIGIN: z.url(),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().max(365).default(30),
  DEFAULT_TIMEZONE: z.string().default('Asia/Bangkok'),
  CHECKIN_FOOD_REWARD: z.coerce.number().int().positive().max(100).default(1),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env?: NodeJS.ProcessEnv): AppConfig {
  if (!env && existsSync(rootEnvPath)) loadEnvFile(rootEnvPath);
  return envSchema.parse(env ?? process.env);
}
