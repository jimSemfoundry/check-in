import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { Session } from '@soft-habit/contracts';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../features/access/SessionProvider';
import { HistoryPage } from '../pages/HistoryPage';

const candidate = {
  habitId: '10000000-0000-4000-8000-000000000011',
  name: '喝水',
  icon: 'water_drop',
};

const backfilled = new Set<string>();

vi.mock('../features/history/api', () => ({
  getHistoryMonth: async (month: string) => ({
    month,
    days: Array.from({ length: 31 }, (_, index) => ({
      date: `${month}-${String(index + 1).padStart(2, '0')}`,
      plannedCount: index === 24 ? 0 : 1,
      completedCount: index === 24 ? 0 : 1,
      habits: [],
    })),
  }),
  getHistoryDay: async (date: string) => ({
    date,
    plannedCount: date === '2026-07-25' ? 0 : 1,
    completedCount: date === '2026-07-25' ? 0 : 1,
    habits: backfilled.has(date) ? [{ ...candidate, completed: true }] : [],
  }),
  getHistoryBackfillCandidates: async (date: string) =>
    date === '2026-07-25' && !backfilled.has(date) ? [candidate] : [],
  backfillHistoryCheckin: async (_habitId: string, date: string) => {
    backfilled.add(date);
    return {
      data: {
        checkin: {
          id: '10000000-0000-4000-8000-000000000099',
          habitId: candidate.habitId,
          checkinDate: date,
          completedAt: '2026-07-26T00:00:00.000Z',
          cancelledAt: null,
        },
        foodBalance: 1,
      },
    };
  },
}));

const ownerSession: Session = {
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

describe('HistoryPage snapshotless backfill controls', () => {
  beforeEach(() => {
    backfilled.clear();
    vi.unstubAllGlobals();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ data: ownerSession }), { status: 200 })),
    );
  });

  it('shows owner backfill candidates for a selected 0/0 history date', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <SessionProvider>
            <HistoryPage />
          </SessionProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await userEvent.click((await screen.findByText('25')).closest('button')!);

    expect(await screen.findByText('2026-07-25 · 0/0')).toBeInTheDocument();
    await userEvent.click(await screen.findByLabelText('补签喝水'));

    expect(await screen.findByLabelText('已完成喝水')).toBeInTheDocument();
  });
});
