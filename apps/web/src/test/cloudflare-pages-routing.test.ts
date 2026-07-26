import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type RedirectRule = {
  source: string;
  destination: string;
  status: number;
};

function loadRedirectRules() {
  const redirects = readFileSync(join(process.cwd(), 'public/_redirects'), 'utf8');

  return redirects
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line): RedirectRule => {
      const [source, destination, status = '302'] = line.split(/\s+/);
      return { source, destination, status: Number(status) };
    });
}

function matchesRule(source: string, path: string) {
  if (source.endsWith('/*')) return path.startsWith(source.slice(0, -1));
  if (source.includes('/:')) return path.startsWith(source.split('/:')[0] + '/');
  return source === path;
}

function findRedirect(path: string) {
  return loadRedirectRules().find((rule) => matchesRule(rule.source, path));
}

describe('Cloudflare Pages routing', () => {
  it('rewrites browser app routes to the SPA entry only for known app paths', () => {
    expect(findRedirect('/game')).toEqual({ source: '/game', destination: '/index.html', status: 200 });
    expect(findRedirect('/today')).toEqual({ source: '/today', destination: '/index.html', status: 200 });
    expect(findRedirect('/w/demo/join')).toEqual({ source: '/w/*', destination: '/index.html', status: 200 });
  });

  it('leaves asset URLs unmatched so missing JavaScript returns 404 instead of index HTML', () => {
    expect(findRedirect('/assets/missing-chunk.js')).toBeUndefined();
  });

  it('ships a top-level 404 page to disable Cloudflare Pages automatic SPA fallback', () => {
    const notFoundPage = readFileSync(join(process.cwd(), 'public/404.html'), 'utf8');

    expect(notFoundPage).toContain('<title>Not Found</title>');
  });
});
