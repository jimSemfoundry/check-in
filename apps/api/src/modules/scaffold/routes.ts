import type { FastifyPluginAsync, preHandlerHookHandler } from 'fastify';
import { ApiError } from '../../lib/errors.js';
import { requireCapability, type Capability } from '../../plugins/permissions.js';

const pending = async () => {
  throw new ApiError(501, 'NOT_IMPLEMENTED', '该业务接口将在后续阶段实现');
};

function guard(capability: Capability): { preHandler: preHandlerHookHandler } {
  return { preHandler: requireCapability(capability) };
}

export const scaffoldRoutes: FastifyPluginAsync = async (app) => {
  app.get('/history/month', guard('history:read'), pending);
  app.get('/history/day', guard('history:read'), pending);
  app.get('/pet', guard('pet:read'), pending);
  app.patch('/pet/name', guard('pet:interact'), pending);
  app.post('/pet/actions/feed', guard('pet:interact'), pending);
  app.post('/pet/actions/play', guard('pet:interact'), pending);
};
