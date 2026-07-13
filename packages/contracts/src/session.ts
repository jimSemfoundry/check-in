import { z } from 'zod';
import { dataResponse, roleSchema, uuidSchema } from './common.js';

export const accessExchangeRequestSchema = z.object({ accessKey: z.string().min(32).max(512) });
export const sessionSchema = z.object({
  sessionId: uuidSchema,
  workspace: z.object({
    id: uuidSchema,
    name: z.string(),
    slug: z.string(),
    timezone: z.string(),
  }),
  role: roleSchema,
  expiresAt: z.iso.datetime(),
});
export const sessionResponseSchema = dataResponse(sessionSchema);
export const logoutResponseSchema = dataResponse(z.object({ loggedOut: z.literal(true) }));

export type AccessExchangeRequest = z.infer<typeof accessExchangeRequestSchema>;
export type Session = z.infer<typeof sessionSchema>;
