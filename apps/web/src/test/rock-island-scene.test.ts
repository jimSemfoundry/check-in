import { describe, expect, it } from 'vitest';
import { rockIslandScenePlan } from '../game/rockIslandScenePlan';

describe('compact rock island scene plan', () => {
  it('uses one small grass-and-rock platform with foam below the rock', () => {
    expect(rockIslandScenePlan.platform).toMatchObject({
      widthTiles: 3,
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
      grid: {
        columns: 3,
        rows: 2,
        originGridX: -1,
        originGridY: -3,
      },
      startFrame: 0,
    });
    expect(rockIslandScenePlan.frames).toEqual({
      grassRows: [
        [5, 6, 7],
        [23, 24, 25],
      ],
      rockRows: [
        [50, 51, 52],
      ],
    });
  });
});
