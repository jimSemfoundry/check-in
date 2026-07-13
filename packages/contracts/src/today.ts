import { z } from 'zod';
import { checkinSchema } from './checkins.js';
import { dataResponse, isoDateSchema } from './common.js';
import { habitSchema } from './habits.js';
import { petSchema } from './pets.js';

export const todayResponseSchema = dataResponse(
  z.object({
    date: isoDateSchema,
    habits: z.array(z.object({ habit: habitSchema, checkin: checkinSchema.nullable() })),
    completedCount: z.number().int().nonnegative(),
    plannedCount: z.number().int().nonnegative(),
    pet: petSchema,
  }),
);
