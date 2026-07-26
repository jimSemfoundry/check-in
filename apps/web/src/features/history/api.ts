import {
  backfillCheckinRequestSchema,
  checkinResponseSchema,
  historyBackfillCandidatesResponseSchema,
  historyDayResponseSchema,
  historyMonthResponseSchema,
} from '@soft-habit/contracts';
import { apiRequest } from '../../lib/api';
import { localDate, useMockApi } from '../../lib/config';
import { completed, delay, mockHabits, mockPet, uuid } from '../mock/store';

const backfilled = new Map<string, Set<string>>();

const mockDay = (date: string) => {
  const count =
    date === localDate()
      ? completed.size
      : Math.abs(Number(date.slice(-2)) * 3) % (mockHabits.length + 1);
  const habits = mockHabits.map((h, i) => ({
    habitId: h.id,
    name: h.name,
    icon: h.icon,
    completed:
      (date === localDate() ? completed.has(h.id) : i < count) ||
      Boolean(backfilled.get(date)?.has(h.id)),
  }));
  return {
    date,
    plannedCount: mockHabits.length,
    completedCount: habits.filter((habit) => habit.completed).length,
    habits,
  };
};
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
export async function getHistoryBackfillCandidates(date: string) {
  if (!useMockApi)
    return apiRequest(
      `/history/backfill-candidates?date=${date}`,
      historyBackfillCandidatesResponseSchema,
    ).then((r) => r.data);
  await delay();
  const day = mockDay(date);
  const completedIds = new Set(day.habits.filter((habit) => habit.completed).map((habit) => habit.habitId));
  return historyBackfillCandidatesResponseSchema.parse({
    data: mockHabits
      .filter((habit) => !completedIds.has(habit.id))
      .map((habit) => ({ habitId: habit.id, name: habit.name, icon: habit.icon })),
  }).data;
}
export async function backfillHistoryCheckin(habitId: string, date: string) {
  const body = backfillCheckinRequestSchema.parse({ habitId, date });
  if (!useMockApi)
    return apiRequest('/history/checkins/backfill', checkinResponseSchema, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  await delay();
  if (date === localDate()) completed.add(habitId);
  const set = backfilled.get(date) ?? new Set<string>();
  set.add(habitId);
  backfilled.set(date, set);
  mockPet.foodBalance += 1;
  return checkinResponseSchema.parse({
    data: {
      checkin: {
        id: uuid(),
        habitId,
        checkinDate: date,
        completedAt: new Date().toISOString(),
        cancelledAt: null,
      },
      foodBalance: mockPet.foodBalance,
    },
  });
}
