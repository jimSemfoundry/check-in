import { describe, expect, it } from 'vitest';
import { buildWaterFoamPatches } from '../game/waterFoam';

describe('water foam layout', () => {
  it('builds a reusable synchronized 2 by 3 foam patch grid', () => {
    expect(
      buildWaterFoamPatches({
        columns: 3,
        rows: 2,
        originGridX: -1,
        originGridY: -2,
        startFrame: 0,
      }),
    ).toEqual([
      { gridX: -1, gridY: -2, startFrame: 0 },
      { gridX: 0, gridY: -2, startFrame: 0 },
      { gridX: 1, gridY: -2, startFrame: 0 },
      { gridX: -1, gridY: -1, startFrame: 0 },
      { gridX: 0, gridY: -1, startFrame: 0 },
      { gridX: 1, gridY: -1, startFrame: 0 },
    ]);
  });
});
