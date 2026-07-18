import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../features/access/SessionProvider';

describe('SessionProvider public route behavior', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    vi.unstubAllGlobals();
  });

  it('does not fetch a session for the standalone game route', async () => {
    window.history.pushState({}, '', '/game');
    vi.stubGlobal('fetch', vi.fn());

    render(
      <QueryClientProvider client={new QueryClient()}>
        <SessionProvider>
          <div>game</div>
        </SessionProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(fetch).not.toHaveBeenCalled());
  });
});
