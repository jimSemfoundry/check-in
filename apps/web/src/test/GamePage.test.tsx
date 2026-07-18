import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app/App';

vi.mock('../game/createGame', () => ({
  createFloatingIslandGame: vi.fn(() => ({ destroy: vi.fn() })),
}));

describe('game route', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders the full-screen floating island game outside the app shell', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/game']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const game = await screen.findByTestId('floating-island-game');
    expect(game).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
