import { renamePetRequestSchema } from '@soft-habit/contracts';
import type { FastifyPluginAsync } from 'fastify';
import { requireCapability } from '../../plugins/permissions.js';
import type { PetService } from './service.js';

export const petRoutes: FastifyPluginAsync<{ petService: PetService }> = async (
  app,
  { petService },
) => {
  app.get('/pet', { preHandler: requireCapability('pet:read') }, async (request) => ({
    data: await petService.get(request.session!),
  }));
  app.patch('/pet/name', { preHandler: requireCapability('pet:interact') }, async (request) => {
    const { name } = renamePetRequestSchema.parse(request.body);
    return { data: await petService.rename(request.session!, name) };
  });
  app.post(
    '/pet/actions/feed',
    { preHandler: requireCapability('pet:interact') },
    async (request) => ({
      data: await petService.feed(request.session!),
    }),
  );
  app.post(
    '/pet/actions/play',
    { preHandler: requireCapability('pet:interact') },
    async (request) => ({
      data: await petService.play(request.session!),
    }),
  );
};
