import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Script, createContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function loadServiceWorker() {
  const listeners = new Map<string, (event: unknown) => void>();
  const context = createContext({
    self: {
      location: { origin: 'https://jimapp.ccwu.cc' },
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn() },
      registration: { unregister: vi.fn(async () => true) },
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        listeners.set(type, listener);
      },
    },
    URL,
    Response,
    caches: {
      keys: vi.fn(async () => ['soft-habit-v1', 'soft-habit-v2', 'soft-habit-v3']),
      delete: vi.fn(),
    },
  });

  new Script(readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8')).runInContext(context);

  return { context, listeners };
}

describe('service worker', () => {
  it('does not intercept fetch requests', async () => {
    const { listeners } = loadServiceWorker();

    expect(listeners.has('fetch')).toBe(false);
  });

  it('clears old caches and unregisters on activation', async () => {
    const { context, listeners } = loadServiceWorker();
    const waitUntil = vi.fn();

    listeners.get('activate')?.({ waitUntil });

    await waitUntil.mock.calls[0]?.[0];

    expect(context.caches.delete).toHaveBeenCalledWith('soft-habit-v1');
    expect(context.caches.delete).toHaveBeenCalledWith('soft-habit-v2');
    expect(context.caches.delete).toHaveBeenCalledWith('soft-habit-v3');
    expect(context.self.registration.unregister).toHaveBeenCalled();
    expect(context.self.clients.claim).toHaveBeenCalled();
  });
});
