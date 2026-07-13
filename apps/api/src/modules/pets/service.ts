import { randomUUID } from 'node:crypto';
import type { Pet } from '@soft-habit/contracts';
import { renamePetRequestSchema } from '@soft-habit/contracts';
import { and, asc, eq, gt, sql } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import {
  gameActionConfigs,
  petEvents,
  petLevelConfigs,
  pets,
  petSpecies,
  rewardLedger,
} from '../../db/schema/index.js';
import { ApiError } from '../../lib/errors.js';
import type { SessionRecord } from '../access/types.js';

export interface PetService {
  get(session: SessionRecord, now?: Date): Promise<Pet>;
  feed(session: SessionRecord, now?: Date): Promise<Pet>;
  play(session: SessionRecord, now?: Date): Promise<Pet>;
  rename(session: SessionRecord, name: string, now?: Date): Promise<Pet>;
}

export class DrizzlePetService implements PetService {
  constructor(private readonly db: Database) {}

  private async balance(workspaceId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<string>`coalesce(sum(${rewardLedger.amount}), 0)` })
      .from(rewardLedger)
      .where(eq(rewardLedger.workspaceId, workspaceId));
    return Number(row?.total ?? 0);
  }

  async get(session: SessionRecord, now = new Date()): Promise<Pet> {
    const [row] = await this.db
      .select({ pet: pets, species: petSpecies })
      .from(pets)
      .innerJoin(petSpecies, eq(petSpecies.id, pets.speciesId))
      .where(eq(pets.workspaceId, session.workspace.id))
      .limit(1);
    if (!row) throw new ApiError(404, 'PET_NOT_FOUND', '宠物不存在');
    const [nextLevel, feedConfig, playConfig, foodBalance] = await Promise.all([
      this.db
        .select()
        .from(petLevelConfigs)
        .where(
          and(
            eq(petLevelConfigs.speciesId, row.pet.speciesId),
            eq(petLevelConfigs.level, row.pet.level + 1),
          ),
        )
        .limit(1),
      this.db
        .select()
        .from(gameActionConfigs)
        .where(eq(gameActionConfigs.actionType, 'feed'))
        .limit(1),
      this.db
        .select()
        .from(gameActionConfigs)
        .where(eq(gameActionConfigs.actionType, 'play'))
        .limit(1),
      this.balance(session.workspace.id),
    ]);
    if (!feedConfig[0] || !playConfig[0]) {
      throw new ApiError(500, 'PET_CONFIG_MISSING', '宠物动作配置缺失');
    }
    const elapsed = row.pet.lastPlayedAt
      ? Math.max(0, Math.floor((now.getTime() - row.pet.lastPlayedAt.getTime()) / 1000))
      : playConfig[0].cooldownSeconds;
    const cooldownRemainingSeconds = Math.max(0, playConfig[0].cooldownSeconds - elapsed);
    return {
      id: row.pet.id,
      name: row.pet.name,
      species: {
        code: row.species.code,
        name: row.species.name,
        rarity: row.species.rarity,
        assetKey: row.species.assetKey,
      },
      level: row.pet.level,
      experience: row.pet.experience,
      nextLevelExperience: nextLevel[0]?.requiredExperience ?? null,
      intimacy: row.pet.intimacy,
      growthStage: row.pet.growthStage,
      foodBalance,
      actions: {
        feed: {
          available: foodBalance >= feedConfig[0].foodCost,
          reason: foodBalance >= feedConfig[0].foodCost ? null : '食物不足',
        },
        play: {
          available: cooldownRemainingSeconds === 0,
          reason: cooldownRemainingSeconds === 0 ? null : '冷却中',
          cooldownRemainingSeconds,
        },
      },
    };
  }

  async feed(session: SessionRecord, now = new Date()): Promise<Pet> {
    await this.db.transaction(async (tx) => {
      const [pet] = await tx
        .select()
        .from(pets)
        .where(eq(pets.workspaceId, session.workspace.id))
        .for('update')
        .limit(1);
      if (!pet) throw new ApiError(404, 'PET_NOT_FOUND', '宠物不存在');
      const [config] = await tx
        .select()
        .from(gameActionConfigs)
        .where(eq(gameActionConfigs.actionType, 'feed'))
        .limit(1);
      if (!config) throw new ApiError(500, 'PET_CONFIG_MISSING', '喂食配置缺失');

      const rewards = await tx
        .select()
        .from(rewardLedger)
        .where(
          and(
            eq(rewardLedger.workspaceId, session.workspace.id),
            gt(rewardLedger.amount, 0),
            gt(rewardLedger.remainingAmount, 0),
          ),
        )
        .orderBy(asc(rewardLedger.createdAt), asc(rewardLedger.id))
        .for('update');
      if (rewards.reduce((sum, reward) => sum + reward.remainingAmount, 0) < config.foodCost) {
        throw new ApiError(409, 'INSUFFICIENT_FOOD', '食物不足');
      }
      let remainingCost = config.foodCost;
      for (const reward of rewards) {
        if (remainingCost === 0) break;
        const consumed = Math.min(remainingCost, reward.remainingAmount);
        await tx
          .update(rewardLedger)
          .set({ remainingAmount: reward.remainingAmount - consumed })
          .where(eq(rewardLedger.id, reward.id));
        remainingCost -= consumed;
      }

      const experience = pet.experience + config.experienceGain;
      const levels = await tx
        .select()
        .from(petLevelConfigs)
        .where(eq(petLevelConfigs.speciesId, pet.speciesId))
        .orderBy(asc(petLevelConfigs.level));
      const reached = levels.filter(
        (level) => level.level > pet.level && level.requiredExperience <= experience,
      );
      const finalLevel = reached.at(-1);
      const level = finalLevel?.level ?? pet.level;
      const growthStage = finalLevel?.growthStage ?? pet.growthStage;
      const eventId = randomUUID();

      await tx
        .update(pets)
        .set({
          level,
          experience,
          intimacy: pet.intimacy + config.intimacyGain,
          growthStage,
          version: pet.version + 1,
          updatedAt: now,
        })
        .where(and(eq(pets.id, pet.id), eq(pets.workspaceId, session.workspace.id)));
      await tx.insert(rewardLedger).values({
        workspaceId: session.workspace.id,
        sourceType: 'feed',
        sourceId: eventId,
        amount: -config.foodCost,
        remainingAmount: 0,
        actorSessionId: session.id,
        createdAt: now,
      });
      await tx.insert(petEvents).values({
        id: eventId,
        petId: pet.id,
        eventType: 'feed',
        actorSessionId: session.id,
        payload: {
          foodCost: config.foodCost,
          experienceGain: config.experienceGain,
          intimacyGain: config.intimacyGain,
        },
        createdAt: now,
      });

      let previousStage = pet.growthStage;
      for (const reachedLevel of reached) {
        await tx.insert(petEvents).values({
          petId: pet.id,
          eventType: 'level_up',
          actorSessionId: session.id,
          payload: { fromLevel: reachedLevel.level - 1, toLevel: reachedLevel.level },
          createdAt: now,
        });
        if (reachedLevel.growthStage !== previousStage) {
          await tx.insert(petEvents).values({
            petId: pet.id,
            eventType: 'evolve',
            actorSessionId: session.id,
            payload: { fromStage: previousStage, toStage: reachedLevel.growthStage },
            createdAt: now,
          });
          previousStage = reachedLevel.growthStage;
        }
      }
    });
    return this.get(session, now);
  }

  async play(session: SessionRecord, now = new Date()): Promise<Pet> {
    await this.db.transaction(async (tx) => {
      const [pet] = await tx
        .select()
        .from(pets)
        .where(eq(pets.workspaceId, session.workspace.id))
        .for('update')
        .limit(1);
      if (!pet) throw new ApiError(404, 'PET_NOT_FOUND', '宠物不存在');
      const [config] = await tx
        .select()
        .from(gameActionConfigs)
        .where(eq(gameActionConfigs.actionType, 'play'))
        .limit(1);
      if (!config) throw new ApiError(500, 'PET_CONFIG_MISSING', '玩耍配置缺失');
      if (
        pet.lastPlayedAt &&
        now.getTime() - pet.lastPlayedAt.getTime() < config.cooldownSeconds * 1000
      ) {
        throw new ApiError(409, 'PET_PLAY_COOLDOWN', '玩耍仍在冷却中');
      }
      await tx
        .update(pets)
        .set({
          intimacy: pet.intimacy + config.intimacyGain,
          lastPlayedAt: now,
          version: pet.version + 1,
          updatedAt: now,
        })
        .where(and(eq(pets.id, pet.id), eq(pets.workspaceId, session.workspace.id)));
      await tx.insert(petEvents).values({
        petId: pet.id,
        eventType: 'play',
        actorSessionId: session.id,
        payload: { intimacyGain: config.intimacyGain, cooldownSeconds: config.cooldownSeconds },
        createdAt: now,
      });
    });
    return this.get(session, now);
  }

  async rename(session: SessionRecord, name: string, now = new Date()): Promise<Pet> {
    const validated = renamePetRequestSchema.parse({ name });
    await this.db.transaction(async (tx) => {
      const [pet] = await tx
        .select()
        .from(pets)
        .where(eq(pets.workspaceId, session.workspace.id))
        .for('update')
        .limit(1);
      if (!pet) throw new ApiError(404, 'PET_NOT_FOUND', '宠物不存在');
      await tx
        .update(pets)
        .set({ name: validated.name, version: pet.version + 1, updatedAt: now })
        .where(and(eq(pets.id, pet.id), eq(pets.workspaceId, session.workspace.id)));
      await tx.insert(petEvents).values({
        petId: pet.id,
        eventType: 'rename',
        actorSessionId: session.id,
        payload: { previousName: pet.name, name: validated.name },
        createdAt: now,
      });
    });
    return this.get(session, now);
  }
}
