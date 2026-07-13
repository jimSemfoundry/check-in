import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig, type AppConfig } from '../config/env.js';
import { createDatabase, type Database } from '../db/client.js';
import { migrationsFolder } from '../db/migration-path.js';
import {
  anonymousSessions,
  habitCheckins,
  habits,
  rewardLedger,
  workspaces,
} from '../db/schema/index.js';
import type { ApiError } from '../lib/errors.js';
import type { SessionRecord } from '../modules/access/types.js';
import { DrizzleHabitService } from '../modules/habits/service.js';

const environment = loadConfig();
const databaseUrl = process.env.TEST_DATABASE_URL ?? environment.DATABASE_URL;
const databaseName = databaseUrl ? new URL(databaseUrl).pathname.slice(1) : '';
const canRun = Boolean(databaseUrl && databaseName.toLowerCase().includes('test'));

describe.skipIf(!canRun)('PostgreSQL habit/check-in transactions', () => {
  let db: Database;
  let pool: ReturnType<typeof createDatabase>['pool'];
  let service: DrizzleHabitService;
  let session: SessionRecord;
  let habitId: string;

  const config = {
    CHECKIN_FOOD_REWARD: 1,
  } satisfies Pick<AppConfig, 'CHECKIN_FOOD_REWARD'>;

  beforeAll(async () => {
    const database = createDatabase({ DATABASE_URL: databaseUrl! });
    db = database.db;
    pool = database.pool;
    await migrate(db, { migrationsFolder });
    service = new DrizzleHabitService(db, config);
  });

  beforeEach(async () => {
    await pool.query(`
      truncate table audit_events, reward_ledger, habit_checkins, habit_reminders, habit_schedules,
        daily_habit_plans, habits, anonymous_sessions, workspace_access_keys,
        pet_events, pets, pet_level_configs, pet_species, game_action_configs, workspaces
      restart identity cascade
    `);
    const [workspace] = await db
      .insert(workspaces)
      .values({ name: 'Test', slug: 'transaction-test', timezone: 'Asia/Bangkok' })
      .returning();
    const [createdSession] = await db
      .insert(anonymousSessions)
      .values({
        workspaceId: workspace!.id,
        role: 'participant',
        tokenHash: 'a'.repeat(64),
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      })
      .returning();
    session = {
      id: createdSession!.id,
      workspace: {
        id: workspace!.id,
        name: workspace!.name,
        slug: workspace!.slug,
        timezone: workspace!.timezone,
      },
      role: createdSession!.role,
      tokenHash: createdSession!.tokenHash,
      expiresAt: createdSession!.expiresAt,
      revokedAt: null,
    };
    const habit = await service.create(session, {
      name: 'Water',
      icon: 'water',
      targetCount: 1,
      targetUnit: null,
      frequencyType: 'daily',
      startDate: '2026-07-12',
      sortOrder: 0,
      schedules: [],
      reminder: null,
    });
    habitId = habit.id;
  });

  afterAll(async () => pool?.end());

  it('awards only once under concurrent check-ins', async () => {
    const now = new Date('2026-07-12T03:00:00.000Z');
    const results = await Promise.allSettled([
      service.checkin(session, habitId, undefined, now),
      service.checkin(session, habitId, undefined, now),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    expect((rejected as PromiseRejectedResult).reason).toMatchObject({
      code: 'CHECKIN_ALREADY_EXISTS',
    } satisfies Partial<ApiError>);
    expect(await db.select().from(habitCheckins)).toHaveLength(1);
    expect(await db.select().from(rewardLedger)).toHaveLength(1);
  });

  it('cancels an unspent reward atomically', async () => {
    const now = new Date('2026-07-12T03:00:00.000Z');
    await service.checkin(session, habitId, undefined, now);
    const result = await service.cancelCheckin(session, habitId, '2026-07-12', now);
    expect(result.foodBalance).toBe(0);
    expect(result.checkin.cancelledAt).not.toBeNull();
    expect(await db.select().from(rewardLedger)).toHaveLength(2);
  });

  it('does not partially cancel a spent reward', async () => {
    const now = new Date('2026-07-12T03:00:00.000Z');
    const completed = await service.checkin(session, habitId, undefined, now);
    await db.update(rewardLedger).set({ remainingAmount: 0 });
    await db.insert(rewardLedger).values({
      workspaceId: session.workspace.id,
      sourceType: 'feed',
      sourceId: crypto.randomUUID(),
      amount: -1,
      remainingAmount: 0,
      actorSessionId: session.id,
    });
    await expect(service.cancelCheckin(session, habitId, '2026-07-12', now)).rejects.toMatchObject({
      code: 'CHECKIN_REWARD_ALREADY_SPENT',
    });
    const [stored] = await db.select().from(habitCheckins);
    const [storedReward] = await db.select().from(rewardLedger);
    expect(stored!.id).toBe(completed.checkin.id);
    expect(stored!.cancelledAt).toBeNull();
    expect(storedReward!.remainingAmount).toBe(0);
  });

  it('cannot read a habit through another workspace session', async () => {
    const [other] = await db
      .insert(workspaces)
      .values({ name: 'Other', slug: 'other-test', timezone: 'Asia/Bangkok' })
      .returning();
    await expect(
      service.get(
        session,
        (
          await db
            .insert(habits)
            .values({
              workspaceId: other!.id,
              name: 'Secret',
              icon: 'lock',
              targetCount: 1,
              frequencyType: 'daily',
              startDate: '2026-07-12',
            })
            .returning()
        )[0]!.id,
      ),
    ).rejects.toMatchObject({ code: 'HABIT_NOT_FOUND' });
  });
});
