import { z } from 'zod';
import { dataResponse, isoDateSchema, uuidSchema } from './common.js';

export const frequencyTypeSchema = z.enum(['daily', 'weekly', 'monthly']);
export const habitScheduleSchema = z.object({
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  timesPerWeek: z.number().int().min(1).max(7).nullable().optional(),
  monthDay: z.number().int().min(1).max(31).nullable().optional(),
});
export const habitReminderSchema = z.object({
  enabled: z.boolean(),
  localTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
});
export const habitSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  icon: z.string(),
  targetCount: z.number().int().positive(),
  targetUnit: z.string().nullable(),
  frequencyType: frequencyTypeSchema,
  startDate: isoDateSchema,
  sortOrder: z.number().int(),
  archivedAt: z.iso.datetime().nullable(),
  schedules: z.array(habitScheduleSchema),
  reminder: habitReminderSchema.nullable(),
});
export const habitInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    icon: z.string().trim().min(1).max(100),
    targetCount: z.number().int().positive().max(10_000),
    targetUnit: z.string().trim().max(50).nullable().optional(),
    frequencyType: frequencyTypeSchema,
    startDate: isoDateSchema,
    sortOrder: z.number().int(),
    schedules: z.array(habitScheduleSchema),
    reminder: habitReminderSchema.nullable().optional(),
  })
  .superRefine((input, context) => {
    const weekdays = input.schedules.filter((schedule) => schedule.weekday != null);
    const weeklyCounts = input.schedules.filter((schedule) => schedule.timesPerWeek != null);
    const monthDays = input.schedules.filter((schedule) => schedule.monthDay != null);
    const invalid =
      (input.frequencyType === 'daily' && input.schedules.length > 0) ||
      (input.frequencyType === 'weekly' &&
        ((weekdays.length === 0 && weeklyCounts.length !== 1) ||
          (weekdays.length > 0 && weeklyCounts.length > 0) ||
          monthDays.length > 0)) ||
      (input.frequencyType === 'monthly' &&
        (monthDays.length === 0 || weekdays.length > 0 || weeklyCounts.length > 0));
    if (invalid) {
      context.addIssue({
        code: 'custom',
        path: ['schedules'],
        message: '重复规则与 frequencyType 不匹配',
      });
    }
  });
export const createHabitRequestSchema = habitInputSchema;
export const updateHabitRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    icon: z.string().trim().min(1).max(100).optional(),
    targetCount: z.number().int().positive().max(10_000).optional(),
    targetUnit: z.string().trim().max(50).nullable().optional(),
    frequencyType: frequencyTypeSchema.optional(),
    startDate: isoDateSchema.optional(),
    sortOrder: z.number().int().optional(),
    schedules: z.array(habitScheduleSchema).optional(),
    reminder: habitReminderSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
export const habitResponseSchema = dataResponse(habitSchema);
export const habitListResponseSchema = dataResponse(z.array(habitSchema));

export type Habit = z.infer<typeof habitSchema>;
export type CreateHabitRequest = z.infer<typeof createHabitRequestSchema>;
export type UpdateHabitRequest = z.infer<typeof updateHabitRequestSchema>;
