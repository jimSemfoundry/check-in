import { z } from 'zod';
import { dataResponse, uuidSchema } from './common.js';

export const petSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  species: z.object({
    code: z.string(),
    name: z.string(),
    rarity: z.string(),
    assetKey: z.string(),
  }),
  level: z.number().int().positive(),
  experience: z.number().int().nonnegative(),
  nextLevelExperience: z.number().int().nonnegative().nullable(),
  intimacy: z.number().int().nonnegative(),
  growthStage: z.string(),
  foodBalance: z.number().int(),
  actions: z.object({
    feed: z.object({ available: z.boolean(), reason: z.string().nullable() }),
    play: z.object({
      available: z.boolean(),
      reason: z.string().nullable(),
      cooldownRemainingSeconds: z.number().int().nonnegative(),
    }),
  }),
});
export const petResponseSchema = dataResponse(petSchema);
export const renamePetRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[\p{L}\p{N} _'-]+$/u),
});
export const petActionResponseSchema = petResponseSchema;

export type Pet = z.infer<typeof petSchema>;
