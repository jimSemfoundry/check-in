import { describe, expect, it } from 'vitest';
import {
  sheepAnimationConfig,
  sheepMotionConfig,
  tinySwordsNatureAssets,
  treeAnimationConfig,
  treePlacements,
} from '../game/natureAssets';

describe('tiny swords nature assets', () => {
  it('encapsulates tree and sheep resource paths', () => {
    expect(tinySwordsNatureAssets).toEqual({
      trees: {
        tree1: '/game/tiny-swords/Terrain/Resources/Wood/Trees/Tree1.png',
        tree2: '/game/tiny-swords/Terrain/Resources/Wood/Trees/Tree2.png',
        tree3: '/game/tiny-swords/Terrain/Resources/Wood/Trees/Tree3.png',
        tree4: '/game/tiny-swords/Terrain/Resources/Wood/Trees/Tree4.png',
      },
      sheep: {
        idle: '/game/tiny-swords/Terrain/Resources/Meat/Sheep/Sheep_Idle.png',
        move: '/game/tiny-swords/Terrain/Resources/Meat/Sheep/Sheep_Move.png',
        grass: '/game/tiny-swords/Terrain/Resources/Meat/Sheep/Sheep_Grass.png',
      },
    });
  });

  it('defines frame metadata for tree and sheep animations', () => {
    expect(sheepAnimationConfig).toEqual({
      frameSize: 128,
      animations: {
        idle: { key: 'sheep-idle', frames: 6, frameRate: 5 },
        move: { key: 'sheep-move', frames: 4, frameRate: 8 },
        grass: { key: 'sheep-grass', frames: 12, frameRate: 8 },
      },
    });

    expect(treePlacements).toHaveLength(4);
    expect(treeAnimationConfig).toMatchObject({
      frameWidth: 192,
      trees: {
        tree1: { frameHeight: 256, frames: 8 },
        tree2: { frameHeight: 256, frames: 8 },
        tree3: { frameHeight: 192, frames: 8 },
        tree4: { frameHeight: 192, frames: 8 },
      },
    });
    expect(treePlacements.map((tree) => tree.textureKey)).toEqual(['tree-1', 'tree-2', 'tree-3', 'tree-4']);
    expect(treePlacements.every((tree) => tree.scale > 0 && tree.scale < 1)).toBe(true);
  });

  it('keeps sheep route points inside the visible grass surface', () => {
    expect(sheepMotionConfig.bounds).toEqual({
      minX: -58,
      maxX: 58,
      minY: -82,
      maxY: -28,
    });
    expect(sheepMotionConfig).toMatchObject({
      idleMs: 1400,
      grassMs: 1700,
      movePixelsPerSecond: 42,
    });
  });
});
