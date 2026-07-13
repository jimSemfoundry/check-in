import {
  createHabitRequestSchema,
  habitListResponseSchema,
  habitResponseSchema,
  type CreateHabitRequest,
  type Habit,
} from '@soft-habit/contracts';
import { apiRequest } from '../../lib/api';
import { useMockApi } from '../../lib/config';
import { delay, mockHabits, uuid } from '../mock/store';

export async function getHabits() {
  if (!useMockApi) return apiRequest('/habits', habitListResponseSchema).then((r) => r.data);
  await delay();
  return habitListResponseSchema.parse({ data: mockHabits }).data;
}
export async function getHabit(id: string) {
  if (!useMockApi) return apiRequest(`/habits/${id}`, habitResponseSchema).then((r) => r.data);
  await delay();
  const habit = mockHabits.find((h) => h.id === id);
  if (!habit) throw new Error('习惯不存在');
  return habit;
}
export async function saveHabit(input: CreateHabitRequest, id?: string) {
  const body = createHabitRequestSchema.parse(input);
  if (!useMockApi)
    return apiRequest(id ? `/habits/${id}` : '/habits', habitResponseSchema, {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(body),
    }).then((r) => r.data);
  await delay();
  const habit: Habit = {
    id: id ?? uuid(),
    archivedAt: null,
    ...body,
    targetUnit: body.targetUnit ?? null,
    reminder: body.reminder ?? null,
  };
  const index = mockHabits.findIndex((h) => h.id === id);
  if (index >= 0) mockHabits[index] = habit;
  else mockHabits.push(habit);
  return habitResponseSchema.parse({ data: habit }).data;
}
export async function archiveHabit(id: string) {
  if (!useMockApi) return apiRequest(`/habits/${id}`, habitResponseSchema, { method: 'DELETE' });
  await delay();
  const habit = mockHabits.find((h) => h.id === id);
  if (habit) habit.archivedAt = new Date().toISOString();
}
