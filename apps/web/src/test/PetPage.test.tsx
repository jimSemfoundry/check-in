import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { mockPet } from '../features/mock/store';
import { PetPage } from '../pages/PetPage';

describe('PetPage', () => {
  const original = structuredClone(mockPet);
  afterEach(() => Object.assign(mockPet, structuredClone(original)));
  it('disables feeding when food is insufficient and shows play cooldown', async () => {
    mockPet.foodBalance = 0;
    mockPet.actions.play = { available: false, reason: '正在休息', cooldownRemainingSeconds: 60 };
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PetPage />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('button', { name: /喂食/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /玩耍/ })).toBeDisabled();
    expect(screen.getByText(/60 秒后/)).toBeInTheDocument();
  });
});
