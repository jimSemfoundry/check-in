import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import type { AppConfig } from './config/env.js';
import { createDatabase } from './db/client.js';
import { ApiError } from './lib/errors.js';
import { accessRoutes } from './modules/access/routes.js';
import { AccessService } from './modules/access/service.js';
import { DrizzleAuthStore } from './modules/access/store.js';
import type { AuthStore } from './modules/access/types.js';
import { habitRoutes } from './modules/habits/routes.js';
import { DrizzleHabitService, type HabitService } from './modules/habits/service.js';
import { historyRoutes } from './modules/history/routes.js';
import { DrizzleHistoryService, type HistoryService } from './modules/history/service.js';
import { petRoutes } from './modules/pets/routes.js';
import { DrizzlePetService, type PetService } from './modules/pets/service.js';
import { scaffoldRoutes } from './modules/scaffold/routes.js';
import { authPlugin } from './plugins/auth.js';

export interface BuildAppOptions {
  config: AppConfig;
  authStore?: AuthStore;
  habitService?: HabitService;
  historyService?: HistoryService;
  petService?: PetService;
  databaseHealthCheck?: () => Promise<void>;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      options.logger === false
        ? false
        : {
            level: options.config.NODE_ENV === 'test' ? 'silent' : 'info',
            redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers.set-cookie'],
          },
    genReqId: (request) => request.headers['x-request-id']?.toString() ?? crypto.randomUUID(),
  });

  let healthCheck = options.databaseHealthCheck;
  let authStore = options.authStore;
  let habitService = options.habitService;
  let historyService = options.historyService;
  let petService = options.petService;
  if (!authStore) {
    const { db, pool } = createDatabase(options.config);
    authStore = new DrizzleAuthStore(db);
    habitService ??= new DrizzleHabitService(db, options.config);
    historyService ??= new DrizzleHistoryService(db);
    petService ??= new DrizzlePetService(db);
    healthCheck ??= async () => {
      await pool.query('select 1');
    };
    app.addHook('onClose', async () => pool.end());
  }

  const accessService = new AccessService(authStore, options.config);
  if (!habitService) {
    throw new Error('habitService is required when using a custom authStore');
  }
  await app.register(cors, { origin: options.config.WEB_ORIGIN, credentials: true });
  await app.register(cookie, { secret: options.config.COOKIE_SECRET, hook: 'onRequest' });
  await app.register(authPlugin, { accessService });

  app.setNotFoundHandler(async () => {
    throw new ApiError(404, 'NOT_FOUND', '接口不存在');
  });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError || (error instanceof Error && error.name === 'ZodError')) {
      const details = error instanceof ZodError ? error.issues : [];
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: '请求参数不正确', details },
      });
    }
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      });
    }
    request.log.error({ err: error }, 'request failed');
    return reply.status(500).send({ error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } });
  });

  app.get('/health', async () => ({ data: { status: 'ok' as const } }));
  app.get('/health/database', async () => {
    if (!healthCheck) throw new ApiError(503, 'INTERNAL_ERROR', '数据库健康检查未配置');
    await healthCheck();
    return { data: { status: 'ok' as const } };
  });

  await app.register(accessRoutes, { prefix: '/api/v1', accessService, config: options.config });
  await app.register(habitRoutes, { prefix: '/api/v1', habitService });
  if (historyService && petService) {
    await app.register(historyRoutes, { prefix: '/api/v1', historyService });
    await app.register(petRoutes, { prefix: '/api/v1', petService });
  } else {
    await app.register(scaffoldRoutes, { prefix: '/api/v1' });
  }

  return app;
}
