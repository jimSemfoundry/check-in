import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../config/env.js';
import { createDatabase, type Database } from '../db/client.js';
import {
  anonymousSessions,
  dailyHabitPlans,
  gameActionConfigs,
  habitCheckins,
  habits,
  petEvents,
  petLevelConfigs,
  pets,
  petSpecies,
  rewardLedger,
  workspaces,
} from '../db/schema/index.js';
import type { SessionRecord } from '../modules/access/types.js';
import { DrizzleHistoryService } from '../modules/history/service.js';
import { DrizzlePetService } from '../modules/pets/service.js';

const environment = loadConfig();
const databaseUrl = process.env.TEST_DATABASE_URL ?? environment.DATABASE_URL;
const databaseName = new URL(databaseUrl).pathname.slice(1);
const canRun = databaseName.toLowerCase().includes('test');

describe.skipIf(!canRun)('PostgreSQL history and pet transactions', () => {
  let db: Database;
  let pool: ReturnType<typeof createDatabase>['pool'];
  let historyService: DrizzleHistoryService;
  let petService: DrizzlePetService;
  let session: SessionRecord;
  let secondSession: SessionRecord;
  let petId: string;

  beforeAll(async () => {
    const database = createDatabase({ DATABASE_URL: databaseUrl });
    db = database.db;
    pool = database.pool;
    await migrate(db, { migrationsFolder: new URL('../db/migrations', import.meta.url).pathname });
    historyService = new DrizzleHistoryService(db);
    petService = new DrizzlePetService(db);
  });

  beforeEach(async () => {
    await pool.query(`
      truncate table audit_events, reward_ledger, habit_checkins, habit_reminders, habit_schedules,
        daily_habit_plans, habits, pet_events, pets, pet_level_configs, pet_species,
        game_action_configs, anonymous_sessions, workspace_access_keys, workspaces
      restart identity cascade
    `);
    const [workspace] = await db
      .insert(workspaces)
      .values({ name: 'Pet Test', slug: 'pet-test', timezone: 'Asia/Bangkok' })
      .returning();
    const createdSessions = await db
      .insert(anonymousSessions)
      .values([
        {
          workspaceId: workspace!.id,
          role: 'owner',
          tokenHash: 'b'.repeat(64),
          expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        },
        {
          workspaceId: workspace!.id,
          role: 'participant',
          tokenHash: 'c'.repeat(64),
          expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        },
      ])
      .returning();
    const asSession = (row: (typeof createdSessions)[number]): SessionRecord => ({
      id: row.id,
      workspace: {
        id: workspace!.id,
        name: workspace!.name,
        slug: workspace!.slug,
        timezone: workspace!.timezone,
      },
      role: row.role,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: null,
    });
    session = asSession(createdSessions[0]!);
    secondSession = asSession(createdSessions[1]!);

    const [species] = await db
      .insert(petSpecies)
      .values({ code: 'test-cat', name: 'Test Cat', rarity: 'common', assetKey: 'test-cat' })
      .returning();
    await db.insert(petLevelConfigs).values([
      { speciesId: species!.id, level: 1, requiredExperience: 0, growthStage: 'baby' },
      { speciesId: species!.id, level: 2, requiredExperience: 100, growthStage: 'baby' },
      { speciesId: species!.id, level: 3, requiredExperience: 250, growthStage: 'young' },
      { speciesId: species!.id, level: 4, requiredExperience: 500, growthStage: 'adult' },
    ]);
    await db.insert(gameActionConfigs).values([
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
    ]);
    const [pet] = await db
      .insert(pets)
      .values({
        workspaceId: workspace!.id,
        speciesId: species!.id,
        name: 'Mochi',
        growthStage: 'baby',
      })
      .returning();
    petId = pet!.id;
  });

  afterAll(async () => pool?.end());

  async function addFood(amount = 1) {
    await db.insert(rewardLedger).values({
      workspaceId: session.workspace.id,
      sourceType: 'checkin',
      sourceId: randomUUID(),
      amount,
      remainingAmount: amount,
      actorSessionId: session.id,
    });
  }

  it('returns immutable plan snapshots after a habit is renamed and archived', async () => {
    const [habit] = await db
      .insert(habits)
      .values({
        workspaceId: session.workspace.id,
        name: 'New name',
        icon: 'new',
        targetCount: 1,
        frequencyType: 'daily',
        startDate: '2026-07-01',
        archivedAt: new Date('2026-07-13T00:00:00.000Z'),
      })
      .returning();
    await db.insert(dailyHabitPlans).values({
      workspaceId: session.workspace.id,
      habitId: habit!.id,
      planDate: '2026-07-12',
      habitNameSnapshot: 'Old name',
      iconSnapshot: 'old',
      targetCountSnapshot: 1,
    });
    await db.insert(habitCheckins).values({
      workspaceId: session.workspace.id,
      habitId: habit!.id,
      checkinDate: '2026-07-12',
      completedBySessionId: session.id,
    });
    const day = await historyService.day(session, '2026-07-12');
    expect(day).toMatchObject({
      plannedCount: 1,
      completedCount: 1,
      habits: [{ name: 'Old name', icon: 'old', completed: true }],
    });
    const month = await historyService.month(session, '2026-07');
    expect(month.days).toHaveLength(31);
    expect(month.days[11]).toEqual(day);
  });

  it('returns authoritative pet state and action availability', async () => {
    const pet = await petService.get(session, new Date('2026-07-13T03:00:00.000Z'));
    expect(pet).toMatchObject({
      name: 'Mochi',
      level: 1,
      experience: 0,
      nextLevelExperience: 100,
      foodBalance: 0,
      actions: { feed: { available: false }, play: { available: true } },
    });
  });

  it('feeds atomically and handles multiple level and stage changes', async () => {
    await addFood();
    await db.update(pets).set({ experience: 90 }).where(eq(pets.id, petId));
    await db
      .update(gameActionConfigs)
      .set({ experienceGain: 200 })
      .where(eq(gameActionConfigs.actionType, 'feed'));
    const result = await petService.feed(session, new Date('2026-07-13T03:00:00.000Z'));
    expect(result).toMatchObject({
      level: 3,
      experience: 290,
      intimacy: 5,
      growthStage: 'young',
      foodBalance: 0,
    });
    const events = await db.select().from(petEvents).where(eq(petEvents.petId, petId));
    expect(events.map((event) => event.eventType).sort()).toEqual([
      'evolve',
      'feed',
      'level_up',
      'level_up',
    ]);
  });

  it('allows only one session to consume the last food', async () => {
    await addFood();
    const now = new Date('2026-07-13T03:00:00.000Z');
    const results = await Promise.allSettled([
      petService.feed(session, now),
      petService.feed(secondSession, now),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(
      (result) => result.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ code: 'INSUFFICIENT_FOOD' });
    const [pet] = await db.select().from(pets).where(eq(pets.id, petId));
    expect(pet).toMatchObject({ experience: 20, intimacy: 5 });
    expect(await db.select().from(petEvents).where(eq(petEvents.eventType, 'feed'))).toHaveLength(
      1,
    );
  });

  it('does not change pet or ledger when food is insufficient', async () => {
    await expect(petService.feed(session)).rejects.toMatchObject({ code: 'INSUFFICIENT_FOOD' });
    const [pet] = await db.select().from(pets).where(eq(pets.id, petId));
    expect(pet).toMatchObject({ experience: 0, intimacy: 0, version: 1 });
    expect(await db.select().from(rewardLedger)).toHaveLength(0);
    expect(await db.select().from(petEvents)).toHaveLength(0);
  });

  it('enforces play cooldown without partial updates', async () => {
    const now = new Date('2026-07-13T03:00:00.000Z');
    const first = await petService.play(secondSession, now);
    expect(first.intimacy).toBe(3);
    await expect(petService.play(session, new Date(now.getTime() + 1000))).rejects.toMatchObject({
      code: 'PET_PLAY_COOLDOWN',
    });
    const [pet] = await db.select().from(pets).where(eq(pets.id, petId));
    expect(pet).toMatchObject({ intimacy: 3, version: 2 });
    expect(await db.select().from(petEvents).where(eq(petEvents.eventType, 'play'))).toHaveLength(
      1,
    );
  });

  it('allows both roles to rename and records each event', async () => {
    await petService.rename(session, 'Owner Name');
    const result = await petService.rename(secondSession, 'Friend Name');
    expect(result.name).toBe('Friend Name');
    const events = await db
      .select()
      .from(petEvents)
      .where(and(eq(petEvents.petId, petId), eq(petEvents.eventType, 'rename')));
    expect(events).toHaveLength(2);
    expect(events.map((event) => event.actorSessionId)).toEqual([session.id, secondSession.id]);
  });
});
