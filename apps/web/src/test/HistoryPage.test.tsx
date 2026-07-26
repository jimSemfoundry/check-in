import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { Session } from '@soft-habit/contracts';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../features/access/SessionProvider';
import { mockHabits } from '../features/mock/store';
import { HistoryPage } from '../pages/HistoryPage';

const baseSession: Session = {
  sessionId: '10000000-0000-4000-8000-000000000001',
  workspace: {
    id: '10000000-0000-4000-8000-000000000002',
    name: '我们的空间',
    slug: 'ours',
    timezone: 'Asia/Bangkok',
  },
  role: 'owner',
  expiresAt: '2030-01-01T00:00:00.000Z',
};

function renderHistory(role: Session['role']) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ data: { ...baseSession, role } }), { status: 200 })),
  );
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <SessionProvider>
          <HistoryPage />
        </SessionProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HistoryPage backfill controls', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('lets owners backfill an incomplete habit from history', async () => {
    renderHistory('owner');

    const button = await screen.findByLabelText(`补签${mockHabits[2]!.name}`);
    await userEvent.click(button);

    expect(await screen.findByLabelText(`已完成${mockHabits[2]!.name}`)).toBeInTheDocument();
  });

  it('keeps backfill controls hidden from participants', async () => {
    renderHistory('participant');

    expect(await screen.findByText(mockHabits[2]!.name)).toBeInTheDocument();
    expect(screen.queryByLabelText(`补签${mockHabits[2]!.name}`)).not.toBeInTheDocument();
  });
});
