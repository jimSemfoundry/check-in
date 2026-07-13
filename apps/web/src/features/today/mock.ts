import { todayResponseSchema } from '@soft-habit/contracts';
import { localDate } from '../../lib/config';
import { completed, delay, mockHabits, mockPet } from '../mock/store';

export async function getMockToday() {
  await delay();
  const date = localDate();
  const habits = mockHabits
    .filter((h) => !h.archivedAt)
    .map((habit) => ({
      habit,
      checkin: completed.has(habit.id)
        ? {
            id: habit.id.replace(/.$/, '9'),
            habitId: habit.id,
            checkinDate: date,
            completedAt: `${date}T08:00:00.000Z`,
            cancelledAt: null,
          }
        : null,
    }));
  return todayResponseSchema.parse({
    data: {
      date,
      habits,
      completedCount: habits.filter((h) => h.checkin).length,
      plannedCount: habits.length,
      pet: mockPet,
    },
  }).data;
}
