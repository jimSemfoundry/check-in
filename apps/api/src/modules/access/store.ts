import { and, eq } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { anonymousSessions, workspaceAccessKeys, workspaces } from '../../db/schema/index.js';
import type { AccessKeyRecord, AuthStore, SessionRecord } from './types.js';

export class DrizzleAuthStore implements AuthStore {
  constructor(private readonly db: Database) {}

  async findAccessKey(keyHash: string): Promise<AccessKeyRecord | null> {
    const [row] = await this.db
      .select({ key: workspaceAccessKeys, workspace: workspaces })
      .from(workspaceAccessKeys)
      .innerJoin(workspaces, eq(workspaces.id, workspaceAccessKeys.workspaceId))
      .where(eq(workspaceAccessKeys.keyHash, keyHash))
      .limit(1);
    return row
      ? {
          id: row.key.id,
          workspace: row.workspace,
          role: row.key.role,
          keyHash: row.key.keyHash,
          expiresAt: row.key.expiresAt,
          revokedAt: row.key.revokedAt,
        }
      : null;
  }

  async createSession(input: {
    workspaceId: string;
    role: 'owner' | 'participant';
    tokenHash: string;
    expiresAt: Date;
  }): Promise<SessionRecord> {
    const [created] = await this.db.insert(anonymousSessions).values(input).returning();
    if (!created) throw new Error('Session insert returned no row');
    const session = await this.findSession(created.tokenHash);
    if (!session) throw new Error('Created session could not be loaded');
    return session;
  }

  async findSession(tokenHash: string): Promise<SessionRecord | null> {
    const [row] = await this.db
      .select({ session: anonymousSessions, workspace: workspaces })
      .from(anonymousSessions)
      .innerJoin(workspaces, eq(workspaces.id, anonymousSessions.workspaceId))
      .where(
        and(
          eq(anonymousSessions.tokenHash, tokenHash),
          eq(workspaces.id, anonymousSessions.workspaceId),
        ),
      )
      .limit(1);
    return row
      ? {
          id: row.session.id,
          workspace: row.workspace,
          role: row.session.role,
          tokenHash: row.session.tokenHash,
          expiresAt: row.session.expiresAt,
          revokedAt: row.session.revokedAt,
        }
      : null;
  }

  async touchSession(id: string, at: Date): Promise<void> {
    await this.db
      .update(anonymousSessions)
      .set({ lastSeenAt: at })
      .where(eq(anonymousSessions.id, id));
  }

  async revokeSession(id: string, at: Date): Promise<void> {
    await this.db
      .update(anonymousSessions)
      .set({ revokedAt: at })
      .where(eq(anonymousSessions.id, id));
  }
}
