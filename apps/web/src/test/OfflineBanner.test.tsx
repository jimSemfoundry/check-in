import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { OfflineBanner } from '../components/OfflineBanner';

it('shows a clear status when the browser goes offline', () => {
  render(<OfflineBanner />);
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
  fireEvent(window, new Event('offline'));
  expect(screen.getByRole('status')).toHaveTextContent('写操作已暂停');
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});
