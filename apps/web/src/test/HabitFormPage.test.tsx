import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Session } from '@soft-habit/contracts';
import { expect, it, vi } from 'vitest';
import { SessionProvider } from '../features/access/SessionProvider';
import { HabitFormPage } from '../pages/HabitFormPage';

it('switches schedule fields with frequency', async () => {
  const session: Session = {
    sessionId: '10000000-0000-4000-8000-000000000001',
    workspace: {
      id: '10000000-0000-4000-8000-000000000002',
      name: '空间',
      slug: 'ours',
      timezone: 'Asia/Bangkok',
    },
    role: 'owner',
    expiresAt: '2030-01-01T00:00:00.000Z',
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ data: session }), { status: 200 })),
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <SessionProvider>
          <HabitFormPage />
        </SessionProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  const select = await screen.findByLabelText('重复');
  await userEvent.selectOptions(select, 'weekly');
  expect(screen.getByLabelText('每周次数')).toBeInTheDocument();
  await userEvent.selectOptions(select, 'monthly');
  expect(screen.getByLabelText('每月日期')).toBeInTheDocument();
});
