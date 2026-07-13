import {
  petActionResponseSchema,
  petResponseSchema,
  renamePetRequestSchema,
} from '@soft-habit/contracts';
import { apiRequest } from '../../lib/api';
import { useMockApi } from '../../lib/config';
import { delay, mockPet } from '../mock/store';
export async function getPet() {
  if (!useMockApi) return apiRequest('/pet', petResponseSchema).then((r) => r.data);
  await delay();
  return petResponseSchema.parse({ data: mockPet }).data;
}
export async function petAction(action: 'feed' | 'play') {
  if (!useMockApi)
    return apiRequest(`/pet/actions/${action}`, petActionResponseSchema, { method: 'POST' }).then(
      (r) => r.data,
    );
  await delay();
  if (action === 'feed') {
    if (mockPet.foodBalance < 1) throw new Error('食物不足');
    mockPet.foodBalance--;
    mockPet.experience += 10;
  } else {
    mockPet.intimacy += 2;
    mockPet.actions.play = { available: false, reason: '正在休息', cooldownRemainingSeconds: 60 };
  }
  return petResponseSchema.parse({ data: mockPet }).data;
}
export async function renamePet(name: string) {
  const body = renamePetRequestSchema.parse({ name });
  if (!useMockApi)
    return apiRequest('/pet/name', petResponseSchema, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then((r) => r.data);
  await delay();
  mockPet.name = body.name;
  return petResponseSchema.parse({ data: mockPet }).data;
}
const petAssets: Record<string, string> = {
  'cat:baby:happy': '/pet/cat-baby-happy.png',
  'soft-cat:baby:happy': '/pet/cat-baby-happy.png',
};
export const getPetAsset = (species: string, growthStage: string, mood: string) =>
  petAssets[`${species}:${growthStage}:${mood}`] ?? '/pet/cat-baby-happy.png';
