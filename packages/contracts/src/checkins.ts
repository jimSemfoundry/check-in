import { z } from 'zod';
import { dataResponse, isoDateSchema, uuidSchema } from './common.js';

export const checkinSchema = z.object({
  id: uuidSchema,
  habitId: uuidSchema,
  checkinDate: isoDateSchema,
  completedAt: z.iso.datetime(),
  cancelledAt: z.iso.datetime().nullable(),
});
export const createCheckinRequestSchema = z.object({ date: isoDateSchema.optional() });
export const cancelCheckinParamsSchema = z.object({ id: uuidSchema, date: isoDateSchema });
export const checkinResultSchema = z.object({
  checkin: checkinSchema,
  foodBalance: z.number().int(),
});
export const checkinResponseSchema = dataResponse(checkinResultSchema);
export const cancelCheckinResponseSchema = dataResponse(
  z.object({ checkin: checkinSchema, foodBalance: z.number().int() }),
);

export type Checkin = z.infer<typeof checkinSchema>;
