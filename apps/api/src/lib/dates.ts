import type { Habit } from '@soft-habit/contracts';

export function dateInTimeZone(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function asUtcDate(date: string): Date {
  return new Date(`${date}T12:00:00.000Z`);
}

export function weekday(date: string): number {
  return asUtcDate(date).getUTCDay();
}

export function startOfIsoWeek(date: string): string {
  const value = asUtcDate(date);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value.toISOString().slice(0, 10);
}

function lastDayOfMonth(date: string): number {
  const value = asUtcDate(date);
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
}

export function archivedBeforeOrOn(
  archivedAt: string | null,
  date: string,
  timeZone: string,
): boolean {
  return archivedAt ? dateInTimeZone(new Date(archivedAt), timeZone) <= date : false;
}

export function isHabitDue(
  habit: Pick<Habit, 'frequencyType' | 'startDate' | 'archivedAt' | 'schedules'>,
  date: string,
  timeZone: string,
  completedThisWeek = 0,
): boolean {
  if (date < habit.startDate || archivedBeforeOrOn(habit.archivedAt, date, timeZone)) return false;
  if (habit.frequencyType === 'daily') return true;
  if (habit.frequencyType === 'monthly') {
    const day = Number(date.slice(8, 10));
    const lastDay = lastDayOfMonth(date);
    return habit.schedules.some(
      (schedule) => schedule.monthDay != null && Math.min(schedule.monthDay, lastDay) === day,
    );
  }
  const weeklyTarget = habit.schedules.find(
    (schedule) => schedule.timesPerWeek != null,
  )?.timesPerWeek;
  if (weeklyTarget != null) return completedThisWeek < weeklyTarget;
  return habit.schedules.some((schedule) => schedule.weekday === weekday(date));
}
