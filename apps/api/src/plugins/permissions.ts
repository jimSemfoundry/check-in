import type { Role } from '@soft-habit/contracts';
import type { preHandlerHookHandler } from 'fastify';
import { ApiError } from '../lib/errors.js';

export type Capability =
  | 'habit:read'
  | 'habit:manage'
  | 'checkin:manage'
  | 'history:read'
  | 'pet:read'
  | 'pet:interact'
  | 'workspace:manage';

export const capabilityMatrix: Readonly<Record<Role, ReadonlySet<Capability>>> = {
  owner: new Set([
    'habit:read',
    'habit:manage',
    'checkin:manage',
    'history:read',
    'pet:read',
    'pet:interact',
    'workspace:manage',
  ]),
  participant: new Set([
    'habit:read',
    'checkin:manage',
    'history:read',
    'pet:read',
    'pet:interact',
  ]),
};

export function requireRole(role: Role): preHandlerHookHandler {
  return async (request) => {
    if (!request.session) throw new ApiError(401, 'UNAUTHORIZED', '需要有效会话');
    if (request.session.role !== role)
      throw new ApiError(403, 'FORBIDDEN', '当前角色无权执行此操作');
  };
}

export function requireCapability(capability: Capability): preHandlerHookHandler {
  return async (request) => {
    if (!request.session) throw new ApiError(401, 'UNAUTHORIZED', '需要有效会话');
    if (!capabilityMatrix[request.session.role].has(capability)) {
      throw new ApiError(403, 'FORBIDDEN', '当前角色无权执行此操作');
    }
  };
}
