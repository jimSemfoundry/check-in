import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { ApiError } from '../lib/errors.js';
import type { AccessService } from '../modules/access/service.js';

export const SESSION_COOKIE = 'soft_habit_session';

export const authPlugin = fp<{
  accessService: AccessService;
}>(async (app, options) => {
  app.decorateRequest('session', null);
  app.addHook('onRequest', async (request) => {
    const signedCookie = request.cookies[SESSION_COOKIE];
    if (!signedCookie) return;
    const unsigned = request.unsignCookie(signedCookie);
    if (!unsigned.valid || !unsigned.value) return;
    request.session = await options.accessService.authenticate(unsigned.value);
  });
});

export const requireSession: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (request) => {
    if (!request.session) {
      throw new ApiError(401, 'UNAUTHORIZED', '需要有效会话');
    }
  });
};
