import { errorResponseSchema } from '@soft-habit/contracts';
import type { ZodType } from 'zod';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(body);
    throw new ApiError(
      parsed.success ? parsed.data.error.code : 'INTERNAL_ERROR',
      parsed.success ? parsed.data.error.message : '请求失败，请稍后重试',
      response.status,
    );
  }
  return schema.parse(body);
}

export const errorMessages: Record<string, string> = {
  ACCESS_KEY_INVALID: '这个访问链接无效，请向分享者获取新链接。',
  ACCESS_KEY_EXPIRED: '这个访问链接已过期，请向分享者获取新链接。',
  ACCESS_KEY_REVOKED: '这个访问链接已被撤销，请向分享者获取新链接。',
  UNAUTHORIZED: '登录状态已失效，请重新通过邀请链接进入。',
  SESSION_EXPIRED: '登录状态已过期，请重新通过邀请链接进入。',
  FORBIDDEN: '你没有执行此操作的权限。',
  VALIDATION_ERROR: '提交的信息有误，请检查后重试。',
  HABIT_NOT_FOUND: '这个习惯已不存在，请刷新页面。',
  CHECKIN_ALREADY_EXISTS: '这个习惯今天已经完成。',
  CHECKIN_NOT_DUE: '这个习惯今天不需要打卡。',
  CHECKIN_DATE_NOT_TODAY: '只能修改今天的打卡。',
  CHECKIN_NOT_FOUND: '没有找到这条打卡记录。',
  CHECKIN_REWARD_ALREADY_SPENT: '奖励已经用于宠物，无法撤销这次打卡。',
  PET_NOT_FOUND: '还没有找到你的宠物。',
  PET_CONFIG_MISSING: '宠物配置暂时不可用。',
  INSUFFICIENT_FOOD: '食物不足，完成习惯可以获得食物。',
  PET_PLAY_COOLDOWN: '宠物正在休息，请稍后再玩。',
};

export function friendlyError(error: unknown) {
  return error instanceof ApiError
    ? (errorMessages[error.code] ?? error.message)
    : '网络开小差了，请稍后重试。';
}
