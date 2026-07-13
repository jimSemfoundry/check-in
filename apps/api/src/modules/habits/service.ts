import type {
  Checkin,
  CreateHabitRequest,
  Habit,
  Pet,
  UpdateHabitRequest,
} from '@soft-habit/contracts';
import { createHabitRequestSchema } from '@soft-habit/contracts';
import { and, asc, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import type { AppConfig } from '../../config/env.js';
import type { Database } from '../../db/client.js';
import {
  auditEvents,
  dailyHabitPlans,
  gameActionConfigs,
  habitCheckins,
  habitReminders,
  habitSchedules,
  habits,
  petLevelConfigs,
  pets,
  petSpecies,
  rewardLedger,
} from '../../db/schema/index.js';
import { dateInTimeZone, isHabitDue, startOfIsoWeek } from '../../lib/dates.js';
import { ApiError } from '../../lib/errors.js';
import type { SessionRecord } from '../access/types.js';

export interface TodayResult {
  date: string;
  habits: { habit: Habit; checkin: Checkin | null }[];
  completedCount: number;
  plannedCount: number;
  pet: Pet;
}

export interface HabitService {
  list(session: SessionRecord): Promise<Habit[]>;
  get(session: SessionRecord, id: string): Promise<Habit>;
  create(session: SessionRecord, input: CreateHabitRequest): Promise<Habit>;
  update(session: SessionRecord, id: string, input: UpdateHabitRequest): Promise<Habit>;
  archive(session: SessionRecord, id: string): Promise<Habit>;
  today(session: SessionRecord, now?: Date): Promise<TodayResult>;
  checkin(
    session: SessionRecord,
    habitId: string,
    requestedDate?: string,
    now?: Date,
  ): Promise<{ checkin: Checkin; foodBalance: number }>;
  cancelCheckin(
    session: SessionRecord,
    habitId: string,
    date: string,
    now?: Date,
  ): Promise<{ checkin: Checkin; foodBalance: number }>;
}

type HabitRow = typeof habits.$inferSelect;
type ScheduleRow = typeof habitSchedules.$inferSelect;
type ReminderRow = typeof habitReminders.$inferSelect;

function toHabit(row: HabitRow, schedules: ScheduleRow[], reminder: ReminderRow | null): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    targetCount: row.targetCount,
    targetUnit: row.targetUnit,
    frequencyType: row.frequencyType,
    startDate: row.startDate,
    sortOrder: row.sortOrder,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    schedules: schedules.map((schedule) => ({
      weekday: schedule.weekday,
      timesPerWeek: schedule.timesPerWeek,
      monthDay: schedule.monthDay,
    })),
    reminder: reminder
      ? { enabled: reminder.enabled, localTime: reminder.localTime?.slice(0, 5) ?? null }
      : null,
  };
}

function toCheckin(row: typeof habitCheckins.$inferSelect): Checkin {
  return {
    id: row.id,
    habitId: row.habitId,
    checkinDate: row.checkinDate,
    completedAt: row.completedAt.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
  };
}

export class DrizzleHabitService implements HabitService {
  constructor(
    private readonly db: Database,
    private readonly config: Pick<AppConfig, 'CHECKIN_FOOD_REWARD'>,
  ) {}

  private async hydrate(rows: HabitRow[]): Promise<Habit[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    const [schedules, reminders] = await Promise.all([
      this.db.select().from(habitSchedules).where(inArray(habitSchedules.habitId, ids)),
      this.db.select().from(habitReminders).where(inArray(habitReminders.habitId, ids)),
    ]);
    return rows.map((row) =>
      toHabit(
        row,
        schedules.filter((schedule) => schedule.habitId === row.id),
        reminders.find((reminder) => reminder.habitId === row.id) ?? null,
      ),
    );
  }

  async list(session: SessionRecord): Promise<Habit[]> {
    const rows = await this.db
      .select()
      .from(habits)
      .where(and(eq(habits.workspaceId, session.workspace.id), isNull(habits.archivedAt)))
      .orderBy(asc(habits.sortOrder), asc(habits.createdAt));
    return this.hydrate(rows);
  }

  async get(session: SessionRecord, id: string): Promise<Habit> {
    const [row] = await this.db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.id, id),
          eq(habits.workspaceId, session.workspace.id),
          isNull(habits.archivedAt),
        ),
      )
      .limit(1);
    if (!row) throw new ApiError(404, 'HABIT_NOT_FOUND', '习惯不存在');
    return (await this.hydrate([row]))[0]!;
  }

  async create(session: SessionRecord, input: CreateHabitRequest): Promise<Habit> {
    const validated = createHabitRequestSchema.parse(input);
    const id = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(habits)
        .values({
          workspaceId: session.workspace.id,
          name: validated.name,
          icon: validated.icon,
          targetCount: validated.targetCount,
          targetUnit: validated.targetUnit ?? null,
          frequencyType: validated.frequencyType,
          startDate: validated.startDate,
          sortOrder: validated.sortOrder,
        })
        .returning({ id: habits.id });
      if (!created) throw new Error('Habit insert returned no row');
      if (validated.schedules.length) {
        await tx.insert(habitSchedules).values(
          validated.schedules.map((schedule) => ({
            habitId: created.id,
            weekday: schedule.weekday ?? null,
            timesPerWeek: schedule.timesPerWeek ?? null,
            monthDay: schedule.monthDay ?? null,
          })),
        );
      }
      if (validated.reminder) {
        await tx.insert(habitReminders).values({
          habitId: created.id,
          enabled: validated.reminder.enabled,
          localTime: validated.reminder.localTime,
        });
      }
      await tx.insert(auditEvents).values({
        workspaceId: session.workspace.id,
        actorSessionId: session.id,
        eventType: 'habit.created',
        entityType: 'habit',
        entityId: created.id,
        payload: { name: validated.name, frequencyType: validated.frequencyType },
      });
      return created.id;
    });
    return this.get(session, id);
  }

  async update(session: SessionRecord, id: string, input: UpdateHabitRequest): Promise<Habit> {
    const current = await this.get(session, id);
    const merged = createHabitRequestSchema.parse({ ...current, ...input });
    await this.db.transaction(async (tx) => {
      const updated = await tx
        .update(habits)
        .set({
          name: merged.name,
          icon: merged.icon,
          targetCount: merged.targetCount,
          targetUnit: merged.targetUnit ?? null,
          frequencyType: merged.frequencyType,
          startDate: merged.startDate,
          sortOrder: merged.sortOrder,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, id), eq(habits.workspaceId, session.workspace.id)))
        .returning({ id: habits.id });
      if (!updated.length) throw new ApiError(404, 'HABIT_NOT_FOUND', '习惯不存在');
      if (input.frequencyType !== undefined || input.schedules !== undefined) {
        await tx.delete(habitSchedules).where(eq(habitSchedules.habitId, id));
        if (merged.schedules.length) {
          await tx.insert(habitSchedules).values(
            merged.schedules.map((schedule) => ({
              habitId: id,
              weekday: schedule.weekday ?? null,
              timesPerWeek: schedule.timesPerWeek ?? null,
              monthDay: schedule.monthDay ?? null,
            })),
          );
        }
      }
      if (input.reminder !== undefined) {
        await tx.delete(habitReminders).where(eq(habitReminders.habitId, id));
        if (merged.reminder) {
          await tx.insert(habitReminders).values({
            habitId: id,
            enabled: merged.reminder.enabled,
            localTime: merged.reminder.localTime,
          });
        }
      }
      await tx.insert(auditEvents).values({
        workspaceId: session.workspace.id,
        actorSessionId: session.id,
        eventType: 'habit.updated',
        entityType: 'habit',
        entityId: id,
        payload: { changedFields: Object.keys(input) },
      });
    });
    return this.get(session, id);
  }

  async archive(session: SessionRecord, id: string): Promise<Habit> {
    const current = await this.get(session, id);
    const updated = await this.db.transaction(async (tx) => {
      const [archived] = await tx
        .update(habits)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(habits.id, id),
            eq(habits.workspaceId, session.workspace.id),
            isNull(habits.archivedAt),
          ),
        )
        .returning();
      if (!archived) throw new ApiError(404, 'HABIT_NOT_FOUND', '习惯不存在');
      await tx.insert(auditEvents).values({
        workspaceId: session.workspace.id,
        actorSessionId: session.id,
        eventType: 'habit.archived',
        entityType: 'habit',
        entityId: id,
        payload: {},
      });
      return archived;
    });
    if (!updated) throw new ApiError(404, 'HABIT_NOT_FOUND', '习惯不存在');
    return { ...current, archivedAt: updated.archivedAt!.toISOString() };
  }

  private async balance(workspaceId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<string>`coalesce(sum(${rewardLedger.amount}), 0)` })
      .from(rewardLedger)
      .where(eq(rewardLedger.workspaceId, workspaceId));
    return Number(row?.total ?? 0);
  }

  private async pet(workspaceId: string, now: Date): Promise<Pet> {
    const [row] = await this.db
      .select({ pet: pets, species: petSpecies })
      .from(pets)
      .innerJoin(petSpecies, eq(petSpecies.id, pets.speciesId))
      .where(eq(pets.workspaceId, workspaceId))
      .limit(1);
    if (!row) throw new ApiError(404, 'NOT_FOUND', '宠物不存在');
    const [nextLevel, feedConfig, playConfig, foodBalance] = await Promise.all([
      this.db
        .select()
        .from(petLevelConfigs)
        .where(
          and(
            eq(petLevelConfigs.speciesId, row.pet.speciesId),
            eq(petLevelConfigs.level, row.pet.level + 1),
          ),
        )
        .limit(1),
      this.db
        .select()
        .from(gameActionConfigs)
        .where(eq(gameActionConfigs.actionType, 'feed'))
        .limit(1),
      this.db
        .select()
        .from(gameActionConfigs)
        .where(eq(gameActionConfigs.actionType, 'play'))
        .limit(1),
      this.balance(workspaceId),
    ]);
    const cooldown = playConfig[0]?.cooldownSeconds ?? 0;
    const elapsed = row.pet.lastPlayedAt
      ? Math.floor((now.getTime() - row.pet.lastPlayedAt.getTime()) / 1000)
      : cooldown;
    const cooldownRemainingSeconds = Math.max(0, cooldown - elapsed);
    const feedCost = feedConfig[0]?.foodCost ?? 1;
    return {
      id: row.pet.id,
      name: row.pet.name,
      species: {
        code: row.species.code,
        name: row.species.name,
        rarity: row.species.rarity,
        assetKey: row.species.assetKey,
      },
      level: row.pet.level,
      experience: row.pet.experience,
      nextLevelExperience: nextLevel[0]?.requiredExperience ?? null,
      intimacy: row.pet.intimacy,
      growthStage: row.pet.growthStage,
      foodBalance,
      actions: {
        feed: {
          available: foodBalance >= feedCost,
          reason: foodBalance >= feedCost ? null : '食物不足',
        },
        play: {
          available: cooldownRemainingSeconds === 0,
          reason: cooldownRemainingSeconds === 0 ? null : '冷却中',
          cooldownRemainingSeconds,
        },
      },
    };
  }

  async today(session: SessionRecord, now = new Date()): Promise<TodayResult> {
    const date = dateInTimeZone(now, session.workspace.timezone);
    const all = await this.list(session);
    const weekStart = startOfIsoWeek(date);
    const weeklyRows = await this.db
      .select({ habitId: habitCheckins.habitId, count: sql<string>`count(*)` })
      .from(habitCheckins)
      .where(
        and(
          eq(habitCheckins.workspaceId, session.workspace.id),
          gte(habitCheckins.checkinDate, weekStart),
          isNull(habitCheckins.cancelledAt),
        ),
      )
      .groupBy(habitCheckins.habitId);
    const weeklyCounts = new Map(weeklyRows.map((row) => [row.habitId, Number(row.count)]));
    const checkins = await this.db
      .select()
      .from(habitCheckins)
      .where(
        and(
          eq(habitCheckins.workspaceId, session.workspace.id),
          eq(habitCheckins.checkinDate, date),
          isNull(habitCheckins.cancelledAt),
        ),
      );
    const checkedHabitIds = new Set(checkins.map((checkin) => checkin.habitId));
    const due = all.filter(
      (habit) =>
        checkedHabitIds.has(habit.id) ||
        isHabitDue(habit, date, session.workspace.timezone, weeklyCounts.get(habit.id) ?? 0),
    );
    const result = due.map((habit) => ({
      habit,
      checkin: checkins.find((checkin) => checkin.habitId === habit.id)
        ? toCheckin(checkins.find((checkin) => checkin.habitId === habit.id)!)
        : null,
    }));
    if (due.length) {
      await this.db
        .insert(dailyHabitPlans)
        .values(
          due.map((habit) => ({
            workspaceId: session.workspace.id,
            habitId: habit.id,
            planDate: date,
            habitNameSnapshot: habit.name,
            iconSnapshot: habit.icon,
            targetCountSnapshot: habit.targetCount,
            targetUnitSnapshot: habit.targetUnit,
          })),
        )
        .onConflictDoNothing();
    }
    return {
      date,
      habits: result,
      completedCount: result.filter((item) => item.checkin).length,
      plannedCount: result.length,
      pet: await this.pet(session.workspace.id, now),
    };
  }

  async checkin(
    session: SessionRecord,
    habitId: string,
    requestedDate?: string,
    now = new Date(),
  ): Promise<{ checkin: Checkin; foodBalance: number }> {
    const today = dateInTimeZone(now, session.workspace.timezone);
    const date = requestedDate ?? today;
    if (date !== today) throw new ApiError(400, 'CHECKIN_DATE_NOT_TODAY', '只能打卡工作空间的今天');
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(habits)
        .where(
          and(
            eq(habits.id, habitId),
            eq(habits.workspaceId, session.workspace.id),
            isNull(habits.archivedAt),
          ),
        )
        .limit(1);
      if (!row) throw new ApiError(404, 'HABIT_NOT_FOUND', '习惯不存在');
      const [existing] = await tx
        .select({ id: habitCheckins.id })
        .from(habitCheckins)
        .where(
          and(
            eq(habitCheckins.workspaceId, session.workspace.id),
            eq(habitCheckins.habitId, habitId),
            eq(habitCheckins.checkinDate, date),
            isNull(habitCheckins.cancelledAt),
          ),
        )
        .limit(1);
      if (existing) throw new ApiError(409, 'CHECKIN_ALREADY_EXISTS', '今天已经完成过该习惯');
      const schedules = await tx
        .select()
        .from(habitSchedules)
        .where(eq(habitSchedules.habitId, habitId));
      const habit = toHabit(row, schedules, null);
      const weekStart = startOfIsoWeek(date);
      const [weekly] = await tx
        .select({ count: sql<string>`count(*)` })
        .from(habitCheckins)
        .where(
          and(
            eq(habitCheckins.workspaceId, session.workspace.id),
            eq(habitCheckins.habitId, habitId),
            gte(habitCheckins.checkinDate, weekStart),
            isNull(habitCheckins.cancelledAt),
          ),
        );
      if (!isHabitDue(habit, date, session.workspace.timezone, Number(weekly?.count ?? 0))) {
        throw new ApiError(409, 'CHECKIN_NOT_DUE', '该习惯今天不在计划中');
      }
      const [created] = await tx
        .insert(habitCheckins)
        .values({
          workspaceId: session.workspace.id,
          habitId,
          checkinDate: date,
          completedBySessionId: session.id,
          completedAt: now,
        })
        .onConflictDoNothing()
        .returning();
      if (!created) throw new ApiError(409, 'CHECKIN_ALREADY_EXISTS', '今天已经完成过该习惯');
      await tx
        .insert(dailyHabitPlans)
        .values({
          workspaceId: session.workspace.id,
          habitId,
          planDate: date,
          habitNameSnapshot: habit.name,
          iconSnapshot: habit.icon,
          targetCountSnapshot: habit.targetCount,
          targetUnitSnapshot: habit.targetUnit,
        })
        .onConflictDoNothing();
      await tx.insert(rewardLedger).values({
        workspaceId: session.workspace.id,
        sourceType: 'checkin',
        sourceId: created.id,
        amount: this.config.CHECKIN_FOOD_REWARD,
        remainingAmount: this.config.CHECKIN_FOOD_REWARD,
        actorSessionId: session.id,
      });
      const [balance] = await tx
        .select({ total: sql<string>`coalesce(sum(${rewardLedger.amount}), 0)` })
        .from(rewardLedger)
        .where(eq(rewardLedger.workspaceId, session.workspace.id));
      return { checkin: toCheckin(created), foodBalance: Number(balance?.total ?? 0) };
    });
  }

  async cancelCheckin(
    session: SessionRecord,
    habitId: string,
    date: string,
    now = new Date(),
  ): Promise<{ checkin: Checkin; foodBalance: number }> {
    const today = dateInTimeZone(now, session.workspace.timezone);
    if (date !== today)
      throw new ApiError(400, 'CHECKIN_DATE_NOT_TODAY', '只能撤销工作空间今天的打卡');
    return this.db.transaction(async (tx) => {
      const [checkin] = await tx
        .select()
        .from(habitCheckins)
        .where(
          and(
            eq(habitCheckins.workspaceId, session.workspace.id),
            eq(habitCheckins.habitId, habitId),
            eq(habitCheckins.checkinDate, date),
            isNull(habitCheckins.cancelledAt),
          ),
        )
        .for('update')
        .limit(1);
      if (!checkin) throw new ApiError(404, 'CHECKIN_NOT_FOUND', '找不到可撤销的打卡');
      const [reward] = await tx
        .select()
        .from(rewardLedger)
        .where(
          and(
            eq(rewardLedger.workspaceId, session.workspace.id),
            eq(rewardLedger.sourceType, 'checkin'),
            eq(rewardLedger.sourceId, checkin.id),
          ),
        )
        .for('update')
        .limit(1);
      if (!reward || reward.remainingAmount < reward.amount) {
        throw new ApiError(409, 'CHECKIN_REWARD_ALREADY_SPENT', '该打卡奖励已经消费，不能撤销');
      }
      const [cancelled] = await tx
        .update(habitCheckins)
        .set({ cancelledAt: now })
        .where(
          and(
            eq(habitCheckins.id, checkin.id),
            eq(habitCheckins.workspaceId, session.workspace.id),
          ),
        )
        .returning();
      await tx
        .update(rewardLedger)
        .set({ remainingAmount: 0 })
        .where(eq(rewardLedger.id, reward.id));
      await tx.insert(rewardLedger).values({
        workspaceId: session.workspace.id,
        sourceType: 'adjustment',
        sourceId: checkin.id,
        amount: -reward.amount,
        remainingAmount: 0,
        actorSessionId: session.id,
      });
      const [balance] = await tx
        .select({ total: sql<string>`coalesce(sum(${rewardLedger.amount}), 0)` })
        .from(rewardLedger)
        .where(eq(rewardLedger.workspaceId, session.workspace.id));
      return { checkin: toCheckin(cancelled!), foodBalance: Number(balance?.total ?? 0) };
    });
  }
}
