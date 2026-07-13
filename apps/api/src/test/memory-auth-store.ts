import { randomUUID } from 'node:crypto';
import type { Role } from '@soft-habit/contracts';
import type {
  AccessKeyRecord,
  AuthStore,
  SessionRecord,
  WorkspaceIdentity,
} from '../modules/access/types.js';

export const testWorkspace: WorkspaceIdentity = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Test Workspace',
  slug: 'test-workspace',
  timezone: 'Asia/Bangkok',
};

export class MemoryAuthStore implements AuthStore {
  readonly accessKeys: AccessKeyRecord[] = [];
  readonly sessions: SessionRecord[] = [];

  addAccessKey(keyHash: string, role: Role, overrides: Partial<AccessKeyRecord> = {}) {
    this.accessKeys.push({
      id: randomUUID(),
      workspace: testWorkspace,
      role,
      keyHash,
      expiresAt: null,
      revokedAt: null,
      ...overrides,
    });
  }

  async findAccessKey(keyHash: string) {
    return this.accessKeys.find((key) => key.keyHash === keyHash) ?? null;
  }

  async createSession(input: {
    workspaceId: string;
    role: Role;
    tokenHash: string;
    expiresAt: Date;
  }) {
    const session: SessionRecord = {
      id: randomUUID(),
      workspace: testWorkspace,
      role: input.role,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
    };
    this.sessions.push(session);
    return session;
  }

  async findSession(tokenHash: string) {
    return this.sessions.find((session) => session.tokenHash === tokenHash) ?? null;
  }

  async touchSession(_id: string, _at: Date) {}

  async revokeSession(id: string, at: Date) {
    const session = this.sessions.find((candidate) => candidate.id === id);
    if (session) session.revokedAt = at;
  }
}
