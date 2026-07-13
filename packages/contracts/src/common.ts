import { z } from 'zod';

export const uuidSchema = z.uuid();
export const isoDateSchema = z.iso.date();
export const yearMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const roleSchema = z.enum(['owner', 'participant']);
export type Role = z.infer<typeof roleSchema>;

export const errorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'ACCESS_KEY_INVALID',
  'ACCESS_KEY_EXPIRED',
  'ACCESS_KEY_REVOKED',
  'SESSION_EXPIRED',
  'INTERNAL_ERROR',
  'NOT_IMPLEMENTED',
  'HABIT_NOT_FOUND',
  'CHECKIN_ALREADY_EXISTS',
  'CHECKIN_NOT_DUE',
  'CHECKIN_DATE_NOT_TODAY',
  'CHECKIN_NOT_FOUND',
  'CHECKIN_REWARD_ALREADY_SPENT',
  'PET_NOT_FOUND',
  'PET_CONFIG_MISSING',
  'INSUFFICIENT_FOOD',
  'PET_PLAY_COOLDOWN',
]);

export const errorResponseSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
});

export const dataResponse = <T extends z.ZodType>(schema: T) => z.object({ data: schema });

export const messageResponseSchema = dataResponse(z.object({ message: z.string() }));
