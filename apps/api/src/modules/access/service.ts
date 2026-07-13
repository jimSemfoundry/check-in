import type { Role } from '@soft-habit/contracts';
import type { AppConfig } from '../../config/env.js';
import { generateSecret, hashSecret, safeHashEqual } from '../../lib/crypto.js';
import { ApiError } from '../../lib/errors.js';
import type { AuthStore, SessionRecord } from './types.js';

export class AccessService {
  constructor(
    private readonly store: AuthStore,
    private readonly config: Pick<AppConfig, 'ACCESS_KEY_PEPPER' | 'SESSION_TTL_DAYS'>,
  ) {}

  async exchange(
    accessKey: string,
    now = new Date(),
  ): Promise<{ token: string; session: SessionRecord }> {
    const keyHash = hashSecret(accessKey, this.config.ACCESS_KEY_PEPPER);
    const key = await this.store.findAccessKey(keyHash);
    const storedHash = key?.keyHash ?? hashSecret('', this.config.ACCESS_KEY_PEPPER);
    const hashMatches = safeHashEqual(keyHash, storedHash);
    if (!key || !hashMatches) {
      throw new ApiError(401, 'ACCESS_KEY_INVALID', '访问密钥无效');
    }
    if (key.revokedAt) throw new ApiError(401, 'ACCESS_KEY_REVOKED', '访问密钥已撤销');
    if (key.expiresAt && key.expiresAt <= now) {
      throw new ApiError(401, 'ACCESS_KEY_EXPIRED', '访问密钥已过期');
    }
    const token = generateSecret();
    const expiresAt = new Date(now.getTime() + this.config.SESSION_TTL_DAYS * 86_400_000);
    const session = await this.store.createSession({
      workspaceId: key.workspace.id,
      role: key.role,
      tokenHash: hashSecret(token, this.config.ACCESS_KEY_PEPPER),
      expiresAt,
    });
    return { token, session };
  }

  async authenticate(token: string, now = new Date()): Promise<SessionRecord | null> {
    const session = await this.store.findSession(hashSecret(token, this.config.ACCESS_KEY_PEPPER));
    if (!session || session.revokedAt || session.expiresAt <= now) return null;
    await this.store.touchSession(session.id, now);
    return session;
  }

  revoke(sessionId: string, now = new Date()): Promise<void> {
    return this.store.revokeSession(sessionId, now);
  }
}

export function createAccessKey(role: Role): { role: Role; plaintext: string } {
  return { role, plaintext: generateSecret() };
}
