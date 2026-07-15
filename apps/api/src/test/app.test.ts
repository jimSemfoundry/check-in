import type { Habit, Role } from '@soft-habit/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import type { AppConfig } from '../config/env.js';
import { hashSecret } from '../lib/crypto.js';
import { ApiError } from '../lib/errors.js';
import type { HabitService } from '../modules/habits/service.js';
import { MemoryAuthStore } from './memory-auth-store.js';

const config: AppConfig = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: 'postgresql://localhost/soft_habit_test',
  COOKIE_SECRET: 'cookie-secret-that-is-at-least-32-characters',
  ACCESS_KEY_PEPPER: 'access-pepper-that-is-at-least-32-characters',
  WEB_ORIGIN: 'http://localhost:5173',
  SESSION_TTL_DAYS: 30,
  DEFAULT_TIMEZONE: 'Asia/Bangkok',
  CHECKIN_FOOD_REWARD: 1,
};

const pending = async (): Promise<never> => {
  throw new ApiError(501, 'NOT_IMPLEMENTED', 'test service');
};
const unavailableHabitService: HabitService = {
  list: pending,
  get: pending,
  create: pending,
  update: pending,
  archive: pending,
  today: pending,
  checkin: pending,
  cancelCheckin: pending,
};

const habitFixture: Habit = {
  id: '10000000-0000-4000-8000-000000000002',
  name: 'Drink water',
  icon: 'water',
  targetCount: 8,
  targetUnit: 'cups',
  frequencyType: 'daily',
  startDate: '2026-07-12',
  sortOrder: 0,
  archivedAt: null,
  schedules: [],
  reminder: null,
};

const workingHabitService: HabitService = {
  ...unavailableHabitService,
  list: async () => [habitFixture],
  get: async () => habitFixture,
  create: async (_session, input) => ({
    ...habitFixture,
    ...input,
    targetUnit: input.targetUnit ?? null,
    reminder: input.reminder ?? null,
  }),
  update: async (_session, _id, input) => ({
    ...habitFixture,
    name: input.name ?? habitFixture.name,
    icon: input.icon ?? habitFixture.icon,
    targetCount: input.targetCount ?? habitFixture.targetCount,
    targetUnit: input.targetUnit ?? habitFixture.targetUnit,
    frequencyType: input.frequencyType ?? habitFixture.frequencyType,
    startDate: input.startDate ?? habitFixture.startDate,
    sortOrder: input.sortOrder ?? habitFixture.sortOrder,
    schedules: input.schedules ?? habitFixture.schedules,
    reminder: input.reminder ?? habitFixture.reminder,
  }),
  archive: async () => ({ ...habitFixture, archivedAt: '2026-07-12T03:00:00.000Z' }),
  checkin: async () => ({
    checkin: {
      id: '10000000-0000-4000-8000-000000000003',
      habitId: habitFixture.id,
      checkinDate: '2026-07-12',
      completedAt: '2026-07-12T03:00:00.000Z',
      cancelledAt: null,
    },
    foodBalance: 1,
  }),
  cancelCheckin: async () => ({
    checkin: {
      id: '10000000-0000-4000-8000-000000000003',
      habitId: habitFixture.id,
      checkinDate: '2026-07-12',
      completedAt: '2026-07-12T03:00:00.000Z',
      cancelledAt: '2026-07-12T04:00:00.000Z',
    },
    foodBalance: 0,
  }),
};

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

async function authenticated(role: Role, habitService = unavailableHabitService) {
  const store = new MemoryAuthStore();
  const accessKey = `${role}-access-key-that-is-definitely-long-enough`;
  store.addAccessKey(hashSecret(accessKey, config.ACCESS_KEY_PEPPER), role);
  const app = await buildApp({
    config,
    authStore: store,
    habitService,
    databaseHealthCheck: async () => {},
    logger: false,
  });
  apps.push(app);
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/access/exchange',
    payload: { accessKey },
  });
  expect(response.statusCode).toBe(200);
  const setCookie = response.headers['set-cookie'];
  const cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(';')[0];
  expect(cookie).toBeTruthy();
  return { app, store, cookie: cookie! };
}

describe('infrastructure', () => {
  it('serves application and database health checks', async () => {
    const app = await buildApp({
      config,
      authStore: new MemoryAuthStore(),
      habitService: unavailableHabitService,
      databaseHealthCheck: async () => {},
      logger: false,
    });
    apps.push(app);
    expect((await app.inject({ method: 'GET', url: '/health' })).json()).toEqual({
      data: { status: 'ok' },
    });
    expect((await app.inject({ method: 'GET', url: '/health/database' })).statusCode).toBe(200);
  });

  it('returns the stable validation error envelope', async () => {
    const app = await buildApp({
      config,
      authStore: new MemoryAuthStore(),
      habitService: unavailableHabitService,
      logger: false,
    });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/access/exchange',
      payload: { accessKey: 'short' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('allows browser preflight requests for habit management methods', async () => {
    const app = await buildApp({
      config,
      authStore: new MemoryAuthStore(),
      habitService: unavailableHabitService,
      logger: false,
    });
    apps.push(app);
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/habits/10000000-0000-4000-8000-000000000002',
      headers: {
        origin: config.WEB_ORIGIN,
        'access-control-request-method': 'PATCH',
        'access-control-request-headers': 'content-type',
      },
    });
    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-methods']).toContain('PATCH');
    expect(response.headers['access-control-allow-methods']).toContain('DELETE');
  });
});

describe('anonymous session lifecycle', () => {
  it('exchanges a key without storing the plaintext key or token', async () => {
    const { app, store, cookie } = await authenticated('participant');
    const session = await app.inject({
      method: 'GET',
      url: '/api/v1/session',
      headers: { cookie },
    });
    expect(session.statusCode).toBe(200);
    expect(session.json().data.role).toBe('participant');
    expect(store.sessions[0]?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(cookie).not.toContain(store.sessions[0]!.tokenHash);
  });

  it('invalidates the session immediately on logout', async () => {
    const { app, cookie } = await authenticated('owner');
    expect(
      (await app.inject({ method: 'POST', url: '/api/v1/session/logout', headers: { cookie } }))
        .statusCode,
    ).toBe(200);
    expect(
      (await app.inject({ method: 'GET', url: '/api/v1/session', headers: { cookie } })).statusCode,
    ).toBe(401);
  });

  it('rejects expired and revoked access keys', async () => {
    for (const overrides of [{ expiresAt: new Date(0) }, { revokedAt: new Date() }]) {
      const store = new MemoryAuthStore();
      const accessKey = 'expired-or-revoked-access-key-long-enough';
      store.addAccessKey(hashSecret(accessKey, config.ACCESS_KEY_PEPPER), 'owner', overrides);
      const app = await buildApp({
        config,
        authStore: store,
        habitService: unavailableHabitService,
        logger: false,
      });
      apps.push(app);
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/access/exchange',
        payload: { accessKey },
      });
      expect(response.statusCode).toBe(401);
    }
  });
});

describe('permission boundaries', () => {
  it('does not allow a participant to manage habits', async () => {
    const { app, cookie } = await authenticated('participant');
    for (const request of [
      { method: 'POST' as const, url: '/api/v1/habits' },
      { method: 'PATCH' as const, url: '/api/v1/habits/10000000-0000-4000-8000-000000000002' },
      { method: 'DELETE' as const, url: '/api/v1/habits/10000000-0000-4000-8000-000000000002' },
    ]) {
      const response = await app.inject({ ...request, headers: { cookie } });
      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe('FORBIDDEN');
    }
  });

  it('allows an owner through habit management authorization', async () => {
    const { app, cookie } = await authenticated('owner');
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/habits',
      headers: { cookie },
      payload: {
        name: 'Drink water',
        icon: 'water',
        targetCount: 8,
        targetUnit: 'cups',
        frequencyType: 'daily',
        startDate: '2026-07-12',
        sortOrder: 0,
        schedules: [],
      },
    });
    expect(response.statusCode).toBe(501);
    expect(response.json().error.code).toBe('NOT_IMPLEMENTED');
  });

  it('allows both roles through check-in and pet interaction authorization', async () => {
    for (const role of ['owner', 'participant'] as const) {
      const { app, cookie } = await authenticated(role);
      for (const request of [
        {
          method: 'POST' as const,
          url: '/api/v1/habits/10000000-0000-4000-8000-000000000002/checkins',
        },
        { method: 'POST' as const, url: '/api/v1/pet/actions/feed' },
        { method: 'POST' as const, url: '/api/v1/pet/actions/play' },
        { method: 'PATCH' as const, url: '/api/v1/pet/name' },
      ]) {
        expect((await app.inject({ ...request, headers: { cookie } })).statusCode).toBe(501);
      }
    }
  });

  it('rejects protected APIs without a session', async () => {
    const app = await buildApp({
      config,
      authStore: new MemoryAuthStore(),
      habitService: unavailableHabitService,
      logger: false,
    });
    apps.push(app);
    expect((await app.inject({ method: 'GET', url: '/api/v1/habits' })).statusCode).toBe(401);
  });
});

describe('habit and check-in routes', () => {
  it('maps owner habit queries and mutations to the service', async () => {
    const { app, cookie } = await authenticated('owner', workingHabitService);
    expect(
      (await app.inject({ method: 'GET', url: '/api/v1/habits', headers: { cookie } })).statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/api/v1/habits/${habitFixture.id}`,
          headers: { cookie },
        })
      ).json().data.id,
    ).toBe(habitFixture.id);
    const payload = {
      name: 'Drink water',
      icon: 'water',
      targetCount: 8,
      targetUnit: 'cups',
      frequencyType: 'daily',
      startDate: '2026-07-12',
      sortOrder: 0,
      schedules: [],
    };
    expect(
      (await app.inject({ method: 'POST', url: '/api/v1/habits', headers: { cookie }, payload }))
        .statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: `/api/v1/habits/${habitFixture.id}`,
          headers: { cookie },
          payload: { name: 'Water' },
        })
      ).json().data.name,
    ).toBe('Water');
    expect(
      (
        await app.inject({
          method: 'DELETE',
          url: `/api/v1/habits/${habitFixture.id}`,
          headers: { cookie },
        })
      ).json().data.archivedAt,
    ).not.toBeNull();
  });

  it('maps participant check-in and cancellation to the service', async () => {
    const { app, cookie } = await authenticated('participant', workingHabitService);
    const completed = await app.inject({
      method: 'POST',
      url: `/api/v1/habits/${habitFixture.id}/checkins`,
      headers: { cookie },
      payload: { date: '2026-07-12' },
    });
    expect(completed.statusCode).toBe(200);
    expect(completed.json().data.foodBalance).toBe(1);
    const cancelled = await app.inject({
      method: 'DELETE',
      url: `/api/v1/habits/${habitFixture.id}/checkins/2026-07-12`,
      headers: { cookie },
    });
    expect(cancelled.statusCode).toBe(200);
    expect(cancelled.json().data.foodBalance).toBe(0);
  });
});
