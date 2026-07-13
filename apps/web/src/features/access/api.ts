import {
  accessExchangeRequestSchema,
  logoutResponseSchema,
  sessionResponseSchema,
} from '@soft-habit/contracts';
import { apiRequest } from '../../lib/api';

export const getSession = () => apiRequest('/session', sessionResponseSchema).then((r) => r.data);

export const exchangeAccessKey = (accessKey: string) => {
  const body = accessExchangeRequestSchema.parse({ accessKey });
  return apiRequest('/access/exchange', sessionResponseSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then((r) => r.data);
};
export const logout = () =>
  apiRequest('/session/logout', logoutResponseSchema, { method: 'POST' }).then((r) => r.data);
