import { eq } from 'drizzle-orm';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, type AppConfig } from '../config/env.js';
import { generateSecret, hashSecret } from '../lib/crypto.js';
import { createDatabase, type Database } from './client.js';
import {
  gameActionConfigs,
  petLevelConfigs,
  pets,
  petSpecies,
  workspaceAccessKeys,
  workspaces,
} from './schema/index.js';

export async function seedDatabase(db: Database, config: AppConfig) {
  return db.transaction(async (tx) => {
    await tx
      .insert(petSpecies)
      .values({ code: 'soft-cat', name: '软软猫', rarity: 'common', assetKey: 'pets/soft-cat' })
      .onConflictDoNothing();
    const [species] = await tx
      .select()
      .from(petSpecies)
      .where(eq(petSpecies.code, 'soft-cat'))
      .limit(1);
    if (!species) throw new Error('Seed species missing');

    await tx
      .insert(workspaces)
      .values({ name: 'Soft Habit', slug: 'soft-habit-demo', timezone: config.DEFAULT_TIMEZONE })
      .onConflictDoNothing();
    const [workspace] = await tx
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, 'soft-habit-demo'))
      .limit(1);
    if (!workspace) throw new Error('Seed workspace missing');

    await tx
      .insert(petLevelConfigs)
      .values([
        { speciesId: species.id, level: 1, requiredExperience: 0, growthStage: 'baby' },
        { speciesId: species.id, level: 2, requiredExperience: 100, growthStage: 'baby' },
        { speciesId: species.id, level: 3, requiredExperience: 250, growthStage: 'young' },
        { speciesId: species.id, level: 4, requiredExperience: 500, growthStage: 'adult' },
      ])
      .onConflictDoNothing();
    await tx
      .insert(gameActionConfigs)
      .values([
        {
          actionType: 'feed',
          foodCost: 1,
          experienceGain: 20,
          intimacyGain: 5,
          cooldownSeconds: 0,
        },
        {
          actionType: 'play',
          foodCost: 0,
          experienceGain: 0,
          intimacyGain: 3,
          cooldownSeconds: 3600,
        },
      ])
      .onConflictDoNothing();
    await tx
      .insert(pets)
      .values({
        workspaceId: workspace.id,
        speciesId: species.id,
        name: '小软',
        growthStage: 'baby',
      })
      .onConflictDoNothing();

    const ownerKey = generateSecret();
    const participantKey = generateSecret();
    await tx.insert(workspaceAccessKeys).values([
      {
        workspaceId: workspace.id,
        role: 'owner',
        keyHash: hashSecret(ownerKey, config.ACCESS_KEY_PEPPER),
      },
      {
        workspaceId: workspace.id,
        role: 'participant',
        keyHash: hashSecret(participantKey, config.ACCESS_KEY_PEPPER),
      },
    ]);
    return { workspaceId: workspace.id, ownerKey, participantKey };
  });
}

async function main() {
  const config = loadConfig();
  const { db, pool } = createDatabase(config);
  try {
    const result = await seedDatabase(db, config);
    console.info('Seed completed. Save these one-time access keys securely:');
    console.info(`Owner: ${result.ownerKey}`);
    console.info(`Participant: ${result.participantKey}`);
  } finally {
    await pool.end();
  }
}

const invokedPath = process.argv[1];
if (invokedPath && resolve(fileURLToPath(import.meta.url)) === resolve(invokedPath)) await main();
