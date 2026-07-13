import { todayResponseSchema } from '@soft-habit/contracts';
import { apiRequest } from '../../lib/api';
import { useMockApi } from '../../lib/config';
import { getMockToday } from './mock';

export const getToday = () =>
  useMockApi ? getMockToday() : apiRequest('/today', todayResponseSchema).then((r) => r.data);
