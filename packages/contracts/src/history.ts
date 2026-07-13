import { z } from 'zod';
import { dataResponse, isoDateSchema, uuidSchema, yearMonthSchema } from './common.js';

export const historyMonthQuerySchema = z.object({ month: yearMonthSchema });
export const historyDayQuerySchema = z.object({ date: isoDateSchema });
export const historyDaySchema = z.object({
  date: isoDateSchema,
  plannedCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  habits: z.array(
    z.object({
      habitId: uuidSchema,
      name: z.string(),
      icon: z.string(),
      completed: z.boolean(),
    }),
  ),
});
export const historyMonthResponseSchema = dataResponse(
  z.object({ month: yearMonthSchema, days: z.array(historyDaySchema) }),
);
export const historyDayResponseSchema = dataResponse(historyDaySchema);

export type HistoryDay = z.infer<typeof historyDaySchema>;
export type HistoryMonth = z.infer<typeof historyMonthResponseSchema>['data'];
