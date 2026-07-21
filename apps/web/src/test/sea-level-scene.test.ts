import { describe, expect, it } from 'vitest';
import { seaLevelScenePlan } from '../game/seaLevelScenePlan';

describe('sea-level grass placement scene plan', () => {
  it('uses a centered sea-level placement grid without prebuilt island layers', () => {
    expect(seaLevelScenePlan).toEqual({
      tileSize: 64,
      grid: {
        columns: 12,
        rows: 8,
      },
      grassFrame: 24,
    });
  });
});
