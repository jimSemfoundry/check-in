import type { HistoryDay, HistoryMonth } from '@soft-habit/contracts';
import { and, eq, gte, isNull, lte } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { dailyHabitPlans, habitCheckins } from '../../db/schema/index.js';
import type { SessionRecord } from '../access/types.js';

export interface HistoryService {
  month(session: SessionRecord, month: string): Promise<HistoryMonth>;
  day(session: SessionRecord, date: string): Promise<HistoryDay>;
}

function monthBounds(month: string): { first: string; last: string; dayCount: number } {
  const [year, value] = month.split('-').map(Number);
  const dayCount = new Date(Date.UTC(year!, value!, 0)).getUTCDate();
  return { first: `${month}-01`, last: `${month}-${String(dayCount).padStart(2, '0')}`, dayCount };
}

export class DrizzleHistoryService implements HistoryService {
  constructor(private readonly db: Database) {}

  private async range(session: SessionRecord, first: string, last: string) {
    return Promise.all([
      this.db
        .select()
        .from(dailyHabitPlans)
        .where(
          and(
            eq(dailyHabitPlans.workspaceId, session.workspace.id),
            gte(dailyHabitPlans.planDate, first),
            lte(dailyHabitPlans.planDate, last),
          ),
        ),
      this.db
        .select({ habitId: habitCheckins.habitId, date: habitCheckins.checkinDate })
        .from(habitCheckins)
        .where(
          and(
            eq(habitCheckins.workspaceId, session.workspace.id),
            gte(habitCheckins.checkinDate, first),
            lte(habitCheckins.checkinDate, last),
            isNull(habitCheckins.cancelledAt),
          ),
        ),
    ]);
  }

  async day(session: SessionRecord, date: string): Promise<HistoryDay> {
    const [plans, checkins] = await this.range(session, date, date);
    const completed = new Set(checkins.map((checkin) => checkin.habitId));
    const items = plans.map((plan) => ({
      habitId: plan.habitId,
      name: plan.habitNameSnapshot,
      icon: plan.iconSnapshot,
      completed: completed.has(plan.habitId),
    }));
    return {
      date,
      plannedCount: items.length,
      completedCount: items.filter((item) => item.completed).length,
      habits: items,
    };
  }

  async month(session: SessionRecord, month: string): Promise<HistoryMonth> {
    const { first, last, dayCount } = monthBounds(month);
    const [plans, checkins] = await this.range(session, first, last);
    const completed = new Set(checkins.map((checkin) => `${checkin.date}:${checkin.habitId}`));
    const days = Array.from({ length: dayCount }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, '0')}`;
      const items = plans
        .filter((plan) => plan.planDate === date)
        .map((plan) => ({
          habitId: plan.habitId,
          name: plan.habitNameSnapshot,
          icon: plan.iconSnapshot,
          completed: completed.has(`${date}:${plan.habitId}`),
        }));
      return {
        date,
        plannedCount: items.length,
        completedCount: items.filter((item) => item.completed).length,
        habits: items,
      };
    });
    return { month, days };
  }
}
