import type { Role } from '@soft-habit/contracts';

export interface WorkspaceIdentity {
  id: string;
  name: string;
  slug: string;
  timezone: string;
}

export interface AccessKeyRecord {
  id: string;
  workspace: WorkspaceIdentity;
  role: Role;
  keyHash: string;
  expiresAt: Date | null;
  revokedAt: Date | null;
}

export interface SessionRecord {
  id: string;
  workspace: WorkspaceIdentity;
  role: Role;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface AuthStore {
  findAccessKey(keyHash: string): Promise<AccessKeyRecord | null>;
  createSession(input: {
    workspaceId: string;
    role: Role;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<SessionRecord>;
  findSession(tokenHash: string): Promise<SessionRecord | null>;
  touchSession(id: string, at: Date): Promise<void>;
  revokeSession(id: string, at: Date): Promise<void>;
}
