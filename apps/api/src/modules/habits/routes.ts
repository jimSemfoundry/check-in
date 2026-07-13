import {
  createCheckinRequestSchema,
  createHabitRequestSchema,
  isoDateSchema,
  updateHabitRequestSchema,
  uuidSchema,
} from '@soft-habit/contracts';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireCapability } from '../../plugins/permissions.js';
import type { HabitService } from './service.js';

const idParamsSchema = z.object({ id: uuidSchema });
const cancelParamsSchema = z.object({ id: uuidSchema, date: isoDateSchema });

export const habitRoutes: FastifyPluginAsync<{ habitService: HabitService }> = async (
  app,
  { habitService },
) => {
  app.get('/today', { preHandler: requireCapability('habit:read') }, async (request) => ({
    data: await habitService.today(request.session!),
  }));
  app.get('/habits', { preHandler: requireCapability('habit:read') }, async (request) => ({
    data: await habitService.list(request.session!),
  }));
  app.get('/habits/:id', { preHandler: requireCapability('habit:read') }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    return { data: await habitService.get(request.session!, id) };
  });
  app.post('/habits', { preHandler: requireCapability('habit:manage') }, async (request) => ({
    data: await habitService.create(request.session!, createHabitRequestSchema.parse(request.body)),
  }));
  app.patch('/habits/:id', { preHandler: requireCapability('habit:manage') }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    return {
      data: await habitService.update(
        request.session!,
        id,
        updateHabitRequestSchema.parse(request.body),
      ),
    };
  });
  app.delete('/habits/:id', { preHandler: requireCapability('habit:manage') }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    return { data: await habitService.archive(request.session!, id) };
  });
  app.post(
    '/habits/:id/checkins',
    { preHandler: requireCapability('checkin:manage') },
    async (request) => {
      const { id } = idParamsSchema.parse(request.params);
      const { date } = createCheckinRequestSchema.parse(request.body ?? {});
      return { data: await habitService.checkin(request.session!, id, date) };
    },
  );
  app.delete(
    '/habits/:id/checkins/:date',
    { preHandler: requireCapability('checkin:manage') },
    async (request) => {
      const { id, date } = cancelParamsSchema.parse(request.params);
      return { data: await habitService.cancelCheckin(request.session!, id, date) };
    },
  );
};
