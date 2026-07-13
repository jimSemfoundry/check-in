import { historyDayQuerySchema, historyMonthQuerySchema } from '@soft-habit/contracts';
import type { FastifyPluginAsync } from 'fastify';
import { requireCapability } from '../../plugins/permissions.js';
import type { HistoryService } from './service.js';

export const historyRoutes: FastifyPluginAsync<{ historyService: HistoryService }> = async (
  app,
  { historyService },
) => {
  app.get('/history/month', { preHandler: requireCapability('history:read') }, async (request) => {
    const { month } = historyMonthQuerySchema.parse(request.query);
    return { data: await historyService.month(request.session!, month) };
  });
  app.get('/history/day', { preHandler: requireCapability('history:read') }, async (request) => {
    const { date } = historyDayQuerySchema.parse(request.query);
    return { data: await historyService.day(request.session!, date) };
  });
};
