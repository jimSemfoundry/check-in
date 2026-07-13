import type { Habit } from '@soft-habit/contracts';
import { describe, expect, it } from 'vitest';
import { dateInTimeZone, isHabitDue, startOfIsoWeek } from '../lib/dates.js';

const base: Habit = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Habit',
  icon: 'check',
  targetCount: 1,
  targetUnit: null,
  frequencyType: 'daily',
  startDate: '2026-01-01',
  sortOrder: 0,
  archivedAt: null,
  schedules: [],
  reminder: null,
};

describe('workspace dates', () => {
  it('uses the workspace timezone across a UTC day boundary', () => {
    const instant = new Date('2026-07-11T18:30:00.000Z');
    expect(dateInTimeZone(instant, 'Asia/Bangkok')).toBe('2026-07-12');
    expect(dateInTimeZone(instant, 'America/New_York')).toBe('2026-07-11');
  });

  it('finds the ISO week start across month and year boundaries', () => {
    expect(startOfIsoWeek('2026-01-01')).toBe('2025-12-29');
    expect(startOfIsoWeek('2026-07-12')).toBe('2026-07-06');
  });
});

describe('habit recurrence', () => {
  it('honors start and archive dates', () => {
    expect(isHabitDue({ ...base, startDate: '2026-07-12' }, '2026-07-11', 'Asia/Bangkok')).toBe(
      false,
    );
    expect(
      isHabitDue({ ...base, archivedAt: '2026-07-12T02:00:00.000Z' }, '2026-07-12', 'Asia/Bangkok'),
    ).toBe(false);
  });

  it('matches configured weekly weekdays', () => {
    const weekly: Habit = {
      ...base,
      frequencyType: 'weekly',
      schedules: [{ weekday: 1 }, { weekday: 3 }],
    };
    expect(isHabitDue(weekly, '2026-07-13', 'Asia/Bangkok')).toBe(true);
    expect(isHabitDue(weekly, '2026-07-14', 'Asia/Bangkok')).toBe(false);
  });

  it('keeps a weekly-count habit due until its target is reached', () => {
    const weekly: Habit = {
      ...base,
      frequencyType: 'weekly',
      schedules: [{ timesPerWeek: 3 }],
    };
    expect(isHabitDue(weekly, '2026-07-14', 'Asia/Bangkok', 2)).toBe(true);
    expect(isHabitDue(weekly, '2026-07-14', 'Asia/Bangkok', 3)).toBe(false);
  });

  it('clamps a monthly day to leap and non-leap month ends', () => {
    const monthly: Habit = {
      ...base,
      frequencyType: 'monthly',
      schedules: [{ monthDay: 31 }],
    };
    expect(isHabitDue(monthly, '2028-02-29', 'Asia/Bangkok')).toBe(true);
    expect(isHabitDue(monthly, '2027-02-28', 'Asia/Bangkok')).toBe(true);
    expect(isHabitDue(monthly, '2027-02-27', 'Asia/Bangkok')).toBe(false);
  });
});
