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
      grassShapeFrames: {
        one: {
          key: 'grass-shape-one',
          source: { x: 192, y: 192, width: 64, height: 64 },
        },
        'three-horizontal': {
          key: 'grass-shape-three-horizontal',
          source: { x: 0, y: 192, width: 192, height: 64 },
        },
        'three-vertical': {
          key: 'grass-shape-three-vertical',
          source: { x: 192, y: 0, width: 64, height: 192 },
        },
        nine: {
          key: 'grass-shape-nine',
          source: { x: 0, y: 0, width: 192, height: 192 },
        },
      },
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
