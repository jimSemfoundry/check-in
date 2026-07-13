import {
  cancelCheckinResponseSchema,
  checkinResponseSchema,
  createCheckinRequestSchema,
} from '@soft-habit/contracts';
import { apiRequest } from '../../lib/api';
import { localDate, useMockApi } from '../../lib/config';
import { completed, delay, mockPet, uuid } from '../mock/store';

export async function setCheckin(habitId: string, checked: boolean) {
  const date = localDate();
  if (!useMockApi)
    return checked
      ? apiRequest(`/habits/${habitId}/checkins`, checkinResponseSchema, {
          method: 'POST',
          body: JSON.stringify(createCheckinRequestSchema.parse({ date })),
        })
      : apiRequest(`/habits/${habitId}/checkins/${date}`, cancelCheckinResponseSchema, {
          method: 'DELETE',
        });
  await delay();
  if (checked) completed.add(habitId);
  else completed.delete(habitId);
  mockPet.foodBalance += checked ? 1 : -1;
  const checkin = {
    id: uuid(),
    habitId,
    checkinDate: date,
    completedAt: new Date().toISOString(),
    cancelledAt: checked ? null : new Date().toISOString(),
  };
  return (checked ? checkinResponseSchema : cancelCheckinResponseSchema).parse({
    data: { checkin, foodBalance: mockPet.foodBalance },
  });
}
