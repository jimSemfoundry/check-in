import type { Habit, Pet } from '@soft-habit/contracts';
import { localDate } from '../../lib/config';

const date = localDate();
export const mockHabits: Habit[] = [
  ['10000000-0000-4000-8000-000000000011', '喝水', 'water_drop', 8, '杯'],
  ['10000000-0000-4000-8000-000000000012', '阅读', 'menu_book', 30, '分钟'],
  ['10000000-0000-4000-8000-000000000013', '散步', 'directions_walk', 6000, '步'],
  ['10000000-0000-4000-8000-000000000014', '早睡', 'bedtime', 1, '次'],
].map(([id, name, icon, targetCount, targetUnit], sortOrder) => ({
  id: String(id),
  name: String(name),
  icon: String(icon),
  targetCount: Number(targetCount),
  targetUnit: String(targetUnit),
  frequencyType: 'daily',
  startDate: date,
  sortOrder,
  archivedAt: null,
  schedules: [],
  reminder: null,
}));
export const completed = new Set([mockHabits[0]!.id, mockHabits[1]!.id]);
export const mockPet: Pet = {
  id: '10000000-0000-4000-8000-000000000020',
  name: '糯米',
  species: { code: 'cat', name: '小猫', rarity: 'common', assetKey: 'cat' },
  level: 3,
  experience: 40,
  nextLevelExperience: 100,
  intimacy: 68,
  growthStage: 'baby',
  foodBalance: 12,
  actions: {
    feed: { available: true, reason: null },
    play: { available: true, reason: null, cooldownRemainingSeconds: 0 },
  },
};
export const delay = () => new Promise((resolve) => setTimeout(resolve, 180));
export const uuid = () => crypto.randomUUID();
