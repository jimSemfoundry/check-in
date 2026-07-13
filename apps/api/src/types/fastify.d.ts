import type { SessionRecord } from '../modules/access/types.js';

declare module 'fastify' {
  interface FastifyRequest {
    session: SessionRecord | null;
  }
}
