import { describe, expect, it } from 'vitest';
import { seaLevelScenePlan } from '../game/seaLevelScenePlan';

describe('sea-level grass placement scene plan', () => {
  it('uses a centered sea-level placement grid with one separate prebuilt island', () => {
    expect(seaLevelScenePlan).toEqual({
      tileSize: 64,
      grid: {
        columns: 12,
        rows: 8,
      },
      initialGrassPatches: [],
      initialIslandPatches: [
        {
          id: 'initial-island',
          shapeKey: 'nine',
          anchor: { x: 4, y: 1 },
          cells: [
            { x: 4, y: 1 },
            { x: 5, y: 1 },
            { x: 6, y: 1 },
            { x: 4, y: 2 },
            { x: 5, y: 2 },
            { x: 6, y: 2 },
            { x: 4, y: 3 },
            { x: 5, y: 3 },
            { x: 6, y: 3 },
          ],
        },
      ],
      grassTerrainFrames: {
        none: 10,
        top: 1,
        right: 11,
        bottom: 19,
        left: 9,
        topRight: 2,
        bottomRight: 20,
        bottomLeft: 18,
        topLeft: 0,
        topBottom: 28,
        leftRight: 12,
        topBottomRight: 29,
        bottomLeftRight: 21,
        topBottomLeft: 27,
        topLeftRight: 3,
        topBottomLeftRight: 30,
      },
      cellStates: {
        available: {
          fillColor: 0x2fca5d,
          fillAlpha: 0.18,
          inset: 7,
          strokeWidth: 2,
          strokeColor: 0x86f29c,
          strokeAlpha: 0.55,
        },
        occupied: {
          fillColor: 0xf2d34f,
          fillAlpha: 0.5,
          inset: 0,
          strokeWidth: 0,
          strokeColor: 0xffef8a,
          strokeAlpha: 0,
        },
      },
    });
  });
});
