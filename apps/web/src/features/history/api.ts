import { historyDayResponseSchema, historyMonthResponseSchema } from '@soft-habit/contracts';
import { apiRequest } from '../../lib/api';
import { localDate, useMockApi } from '../../lib/config';
import { completed, delay, mockHabits } from '../mock/store';

const mockDay = (date: string) => ({
  date,
  plannedCount: mockHabits.length,
  completedCount:
    date === localDate()
      ? completed.size
      : Math.abs(Number(date.slice(-2)) * 3) % (mockHabits.length + 1),
  habits: mockHabits.map((h, i) => ({
    habitId: h.id,
    name: h.name,
    icon: h.icon,
    completed:
      date === localDate()
        ? completed.has(h.id)
        : i < Math.abs(Number(date.slice(-2)) * 3) % (mockHabits.length + 1),
  })),
});
export async function getHistoryMonth(month: string) {
  if (!useMockApi)
    return apiRequest(`/history/month?month=${month}`, historyMonthResponseSchema).then(
      (r) => r.data,
    );
  await delay();
  const [year, value] = month.split('-').map(Number);
  const count = new Date(year!, value!, 0).getDate();
  return historyMonthResponseSchema.parse({
    data: {
      month,
      days: Array.from({ length: count }, (_, i) =>
        mockDay(`${month}-${String(i + 1).padStart(2, '0')}`),
      ),
    },
  }).data;
}
export async function getHistoryDay(date: string) {
  if (!useMockApi)
    return apiRequest(`/history/day?date=${date}`, historyDayResponseSchema).then((r) => r.data);
  await delay();
  return historyDayResponseSchema.parse({ data: mockDay(date) }).data;
}
