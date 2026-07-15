import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Script, createContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function loadServiceWorker() {
  const listeners = new Map<string, (event: unknown) => void>();
  const context = createContext({
    self: {
      location: { origin: 'https://jimapp.ccwu.cc' },
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        listeners.set(type, listener);
      },
    },
    URL,
    caches: {
      open: vi.fn(async () => ({
        addAll: vi.fn(),
        put: vi.fn(async (request: Request) => {
          if (new URL(request.url).protocol === 'chrome-extension:') {
            throw new TypeError("Request scheme 'chrome-extension' is unsupported");
          }
        }),
      })),
      match: vi.fn(),
    },
    fetch: vi.fn(async () => new Response('ok')),
  });

  new Script(readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8')).runInContext(context);

  return { context, listeners };
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
});
