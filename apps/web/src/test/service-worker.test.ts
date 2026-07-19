import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Script, createContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function loadServiceWorker(fetchResponse: Response = new Response('ok')) {
  const listeners = new Map<string, (event: unknown) => void>();
  const cache = {
    addAll: vi.fn(),
    put: vi.fn(async (request: Request) => {
      if (new URL(request.url).protocol === 'chrome-extension:') {
        throw new TypeError("Request scheme 'chrome-extension' is unsupported");
      }
    }),
  };
  const context = createContext({
    self: {
      location: { origin: 'https://jimapp.ccwu.cc' },
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn() },
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        listeners.set(type, listener);
      },
    },
    URL,
    Response,
    caches: {
      open: vi.fn(async () => cache),
      match: vi.fn(),
      keys: vi.fn(async () => ['soft-habit-v1', 'soft-habit-v2', 'soft-habit-v3']),
      delete: vi.fn(),
    },
    fetch: vi.fn(async () => fetchResponse.clone()),
  });

  new Script(readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8')).runInContext(context);

  return { cache, context, listeners };
}

describe('service worker', () => {
  it('ignores browser extension requests', async () => {
    const { listeners } = loadServiceWorker();
    const respondWith = vi.fn();

    listeners.get('fetch')?.({
      request: new Request('chrome-extension://example/content.js'),
      respondWith,
    });

    await Promise.resolve();

    expect(respondWith).not.toHaveBeenCalled();
  });

  it('passes through HTML fallback responses for script assets without caching them', async () => {
    const htmlResponse = new Response('<!doctype html>', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    const { cache, listeners } = loadServiceWorker(htmlResponse);
    const respondWith = vi.fn();

    listeners.get('fetch')?.({
      request: new Request('https://jimapp.ccwu.cc/assets/missing.js'),
      respondWith,
    });

    const response = await respondWith.mock.calls[0]?.[0];

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(cache.put).not.toHaveBeenCalled();
  });

  it('clears old caches on activation', async () => {
    const { context, listeners } = loadServiceWorker();
    const waitUntil = vi.fn();

    listeners.get('activate')?.({ waitUntil });

    await waitUntil.mock.calls[0]?.[0];

    expect(context.caches.delete).toHaveBeenCalledWith('soft-habit-v1');
    expect(context.caches.delete).toHaveBeenCalledWith('soft-habit-v2');
    expect(context.caches.delete).not.toHaveBeenCalledWith('soft-habit-v3');
  });
});
