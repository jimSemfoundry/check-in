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
      cellStates: {
        available: {
          fillColor: 0x2fca5d,
          fillAlpha: 0.18,
          strokeColor: 0x86f29c,
          strokeAlpha: 0.55,
        },
        occupied: {
          fillColor: 0xf2d34f,
          fillAlpha: 0.5,
          strokeColor: 0xffef8a,
          strokeAlpha: 0.9,
        },
      },
    });
  });
});
