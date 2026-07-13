import type { ZodIssue } from 'zod';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'ACCESS_KEY_INVALID'
  | 'ACCESS_KEY_EXPIRED'
  | 'ACCESS_KEY_REVOKED'
  | 'SESSION_EXPIRED'
  | 'INTERNAL_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'HABIT_NOT_FOUND'
  | 'CHECKIN_ALREADY_EXISTS'
  | 'CHECKIN_NOT_DUE'
  | 'CHECKIN_DATE_NOT_TODAY'
  | 'CHECKIN_NOT_FOUND'
  | 'CHECKIN_REWARD_ALREADY_SPENT'
  | 'PET_NOT_FOUND'
  | 'PET_CONFIG_MISSING'
  | 'INSUFFICIENT_FOOD'
  | 'PET_PLAY_COOLDOWN';

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: ZodIssue[],
  ) {
    super(message);
  }
}
