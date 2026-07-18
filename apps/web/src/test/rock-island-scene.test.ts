import { describe, expect, it } from 'vitest';
import { rockIslandScenePlan } from '../game/rockIslandScenePlan';

describe('compact rock island scene plan', () => {
  it('uses one small grass-and-rock platform with foam below the rock', () => {
    expect(rockIslandScenePlan.platform).toMatchObject({
      widthTiles: 4,
      grassRows: 2,
      rockRows: 2,
    });
    expect(rockIslandScenePlan.decorations).toEqual([]);
    expect(rockIslandScenePlan.foam).toMatchObject({
      placement: 'below-rock',
      rows: 1,
    });
    expect(rockIslandScenePlan.frames).toEqual({
      grassRows: [
        [0, 1, 1, 2],
        [18, 19, 19, 20],
      ],
      rockRows: [
        [41, 42, 42, 43],
        [50, 51, 51, 52],
      ],
      foamFrames: [96, 97, 97, 98],
      shadowFrame: 4,
    });
  });
});
