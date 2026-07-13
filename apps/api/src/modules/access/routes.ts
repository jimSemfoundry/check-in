import { accessExchangeRequestSchema } from '@soft-habit/contracts';
import type { FastifyPluginAsync } from 'fastify';
import type { AppConfig } from '../../config/env.js';
import { ApiError } from '../../lib/errors.js';
import { SESSION_COOKIE } from '../../plugins/auth.js';
import type { AccessService } from './service.js';
import type { SessionRecord } from './types.js';

const publicSession = (session: SessionRecord) => ({
  sessionId: session.id,
  workspace: session.workspace,
  role: session.role,
  expiresAt: session.expiresAt.toISOString(),
});

export const accessRoutes: FastifyPluginAsync<{
  accessService: AccessService;
  config: Pick<AppConfig, 'NODE_ENV'>;
}> = async (app, { accessService, config }) => {
  app.post('/access/exchange', async (request, reply) => {
    const input = accessExchangeRequestSchema.parse(request.body);
    const { token, session } = await accessService.exchange(input.accessKey);
    reply.setCookie(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      signed: true,
      expires: session.expiresAt,
    });
    return { data: publicSession(session) };
  });

  app.get('/session', async (request) => {
    if (!request.session) throw new ApiError(401, 'UNAUTHORIZED', '需要有效会话');
    return { data: publicSession(request.session) };
  });

  app.post('/session/logout', async (request, reply) => {
    if (!request.session) throw new ApiError(401, 'UNAUTHORIZED', '需要有效会话');
    await accessService.revoke(request.session.id);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { data: { loggedOut: true as const } };
  });
};
