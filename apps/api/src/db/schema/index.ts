import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const roleEnum = pgEnum('role', ['owner', 'participant']);
export const frequencyTypeEnum = pgEnum('frequency_type', ['daily', 'weekly', 'monthly']);
export const currencyTypeEnum = pgEnum('currency_type', ['food']);
export const rewardSourceTypeEnum = pgEnum('reward_source_type', ['checkin', 'feed', 'adjustment']);
export const actionTypeEnum = pgEnum('action_type', ['feed', 'play']);
export const petEventTypeEnum = pgEnum('pet_event_type', [
  'feed',
  'play',
  'rename',
  'level_up',
  'evolve',
]);

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    timezone: text('timezone').notNull().default('Asia/Bangkok'),
    ...timestamps,
  },
  (table) => [uniqueIndex('workspaces_slug_uidx').on(table.slug)],
);

export const workspaceAccessKeys = pgTable(
  'workspace_access_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    keyHash: text('key_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('workspace_access_keys_hash_uidx').on(table.keyHash),
    index('workspace_access_keys_workspace_idx').on(table.workspaceId),
  ],
);

export const anonymousSessions = pgTable(
  'anonymous_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    tokenHash: text('token_hash').notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('anonymous_sessions_token_hash_uidx').on(table.tokenHash),
    index('anonymous_sessions_workspace_idx').on(table.workspaceId),
  ],
);

export const habits = pgTable(
  'habits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon').notNull(),
    targetCount: integer('target_count').notNull(),
    targetUnit: text('target_unit'),
    frequencyType: frequencyTypeEnum('frequency_type').notNull(),
    startDate: date('start_date').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index('habits_workspace_idx').on(table.workspaceId)],
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    actorSessionId: uuid('actor_session_id')
      .notNull()
      .references(() => anonymousSessions.id),
    eventType: text('event_type').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    payload: jsonb('payload').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('audit_events_workspace_created_idx').on(table.workspaceId, table.createdAt)],
);

export const habitSchedules = pgTable('habit_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id')
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  weekday: smallint('weekday'),
  timesPerWeek: smallint('times_per_week'),
  monthDay: smallint('month_day'),
});

export const habitReminders = pgTable(
  'habit_reminders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    enabled: boolean('enabled').notNull().default(false),
    localTime: time('local_time'),
  },
  (table) => [uniqueIndex('habit_reminders_habit_uidx').on(table.habitId)],
);

export const habitCheckins = pgTable(
  'habit_checkins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habits.id),
    checkinDate: date('checkin_date').notNull(),
    completedBySessionId: uuid('completed_by_session_id')
      .notNull()
      .references(() => anonymousSessions.id),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  },
  (table) => [
    index('habit_checkins_workspace_date_idx').on(table.workspaceId, table.checkinDate),
    uniqueIndex('habit_checkins_active_uidx')
      .on(table.workspaceId, table.habitId, table.checkinDate)
      .where(sql`${table.cancelledAt} is null`),
  ],
);

export const rewardLedger = pgTable(
  'reward_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    currencyType: currencyTypeEnum('currency_type').notNull().default('food'),
    sourceType: rewardSourceTypeEnum('source_type').notNull(),
    sourceId: uuid('source_id').notNull(),
    amount: integer('amount').notNull(),
    remainingAmount: integer('remaining_amount').notNull().default(0),
    actorSessionId: uuid('actor_session_id')
      .notNull()
      .references(() => anonymousSessions.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('reward_ledger_workspace_idx').on(table.workspaceId),
    uniqueIndex('reward_ledger_source_uidx').on(
      table.workspaceId,
      table.sourceType,
      table.sourceId,
    ),
  ],
);

export const petSpecies = pgTable('pet_species', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  rarity: text('rarity').notNull(),
  assetKey: text('asset_key').notNull(),
});

export const petLevelConfigs = pgTable(
  'pet_level_configs',
  {
    speciesId: uuid('species_id')
      .notNull()
      .references(() => petSpecies.id, { onDelete: 'cascade' }),
    level: integer('level').notNull(),
    requiredExperience: integer('required_experience').notNull(),
    growthStage: text('growth_stage').notNull(),
  },
  (table) => [primaryKey({ columns: [table.speciesId, table.level] })],
);

export const gameActionConfigs = pgTable('game_action_configs', {
  actionType: actionTypeEnum('action_type').primaryKey(),
  foodCost: integer('food_cost').notNull(),
  experienceGain: integer('experience_gain').notNull(),
  intimacyGain: integer('intimacy_gain').notNull(),
  cooldownSeconds: integer('cooldown_seconds').notNull(),
});

export const pets = pgTable(
  'pets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    speciesId: uuid('species_id')
      .notNull()
      .references(() => petSpecies.id),
    name: text('name').notNull(),
    level: integer('level').notNull().default(1),
    experience: integer('experience').notNull().default(0),
    intimacy: integer('intimacy').notNull().default(0),
    growthStage: text('growth_stage').notNull(),
    lastPlayedAt: timestamp('last_played_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    ...timestamps,
  },
  (table) => [uniqueIndex('pets_workspace_uidx').on(table.workspaceId)],
);

export const petEvents = pgTable(
  'pet_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    petId: uuid('pet_id')
      .notNull()
      .references(() => pets.id, { onDelete: 'cascade' }),
    eventType: petEventTypeEnum('event_type').notNull(),
    actorSessionId: uuid('actor_session_id')
      .notNull()
      .references(() => anonymousSessions.id),
    payload: jsonb('payload').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('pet_events_pet_idx').on(table.petId)],
);

export const dailyHabitPlans = pgTable(
  'daily_habit_plans',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habits.id),
    planDate: date('plan_date').notNull(),
    habitNameSnapshot: text('habit_name_snapshot').notNull(),
    iconSnapshot: text('icon_snapshot').notNull(),
    targetCountSnapshot: integer('target_count_snapshot').notNull(),
    targetUnitSnapshot: text('target_unit_snapshot'),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.habitId, table.planDate] }),
    index('daily_habit_plans_workspace_date_idx').on(table.workspaceId, table.planDate),
  ],
);
