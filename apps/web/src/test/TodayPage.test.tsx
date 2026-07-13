import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { Session } from '@soft-habit/contracts';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../features/access/SessionProvider';
import { TodayPage } from '../pages/TodayPage';

const session: Session = {
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
beforeEach(() =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ data: session }), { status: 200 })),
  ),
);
describe('TodayPage', () => {
  it('shows progress and owner controls from injected data', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <SessionProvider>
            <TodayPage />
          </SessionProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('50%')).toBeInTheDocument();
    expect(screen.getByLabelText('添加习惯')).toBeInTheDocument();
    expect(screen.getByText('喝水')).toBeInTheDocument();
  });
  it('hides management controls from participants and completes a habit', async () => {
    const participant = { ...session, role: 'participant' as const };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ data: participant }), { status: 200 })),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <SessionProvider>
            <TodayPage />
          </SessionProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('喝水')).toBeInTheDocument();
    expect(screen.queryByLabelText('添加习惯')).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('完成散步'));
    expect(await screen.findByLabelText('撤销散步')).toBePressed();
  });
});
