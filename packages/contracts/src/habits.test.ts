import { describe, expect, it } from 'vitest';
import { createHabitRequestSchema } from './habits.js';

const base = {
  name: 'Drink water',
  icon: 'water',
  targetCount: 8,
  targetUnit: 'cups',
  startDate: '2026-07-12',
  sortOrder: 0,
};

describe('habit recurrence contract', () => {
  it('accepts each supported recurrence shape', () => {
    expect(
      createHabitRequestSchema.safeParse({ ...base, frequencyType: 'daily', schedules: [] })
        .success,
    ).toBe(true);
    expect(
      createHabitRequestSchema.safeParse({
        ...base,
        frequencyType: 'weekly',
        schedules: [{ weekday: 1 }, { weekday: 3 }],
      }).success,
    ).toBe(true);
    expect(
      createHabitRequestSchema.safeParse({
        ...base,
        frequencyType: 'weekly',
        schedules: [{ timesPerWeek: 3 }],
      }).success,
    ).toBe(true);
    expect(
      createHabitRequestSchema.safeParse({
        ...base,
        frequencyType: 'monthly',
        schedules: [{ monthDay: 31 }],
      }).success,
    ).toBe(true);
  });

  it('rejects recurrence fields belonging to another frequency type', () => {
    expect(
      createHabitRequestSchema.safeParse({
        ...base,
        frequencyType: 'daily',
        schedules: [{ weekday: 1 }],
      }).success,
    ).toBe(false);
    expect(
      createHabitRequestSchema.safeParse({
        ...base,
        frequencyType: 'weekly',
        schedules: [{ weekday: 1 }, { timesPerWeek: 2 }],
      }).success,
    ).toBe(false);
  });
});
