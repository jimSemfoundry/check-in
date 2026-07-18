import { describe, expect, it } from 'vitest';
import { rockIslandScenePlan } from '../game/rockIslandScenePlan';

describe('compact rock island scene plan', () => {
  it('uses one small grass-and-rock platform with foam below the rock', () => {
    expect(rockIslandScenePlan.platform).toMatchObject({
      widthTiles: 4,
      grassRows: 2,
      rockRows: 1,
    });
    expect(rockIslandScenePlan.decorations).toEqual([]);
    expect(rockIslandScenePlan.foam).toMatchObject({
      placement: 'below-rock',
      spriteTiles: 3,
      gridStepTiles: 1,
      animationFrames: 16,
      frameRate: 8,
      patches: [
        { gridX: -1, gridY: -2, startFrame: 0 },
        { gridX: 0, gridY: -2, startFrame: 5 },
        { gridX: 1, gridY: -2, startFrame: 10 },
      ],
    });
    expect(rockIslandScenePlan.frames).toEqual({
      grassRows: [
        [5, 6, 6, 7],
        [23, 24, 24, 25],
      ],
      rockRows: [
        [50, 51, 51, 52],
      ],
      shadowFrame: 4,
    });
  });
});
