import { describe, expect, it } from 'vitest';
import { grassShapes, getGrassShapeCells } from '../game/grassPlacement';
import { getPrebuiltIslandTerrainPieces } from '../game/prebuiltIsland';

describe('prebuilt first-layer island', () => {
  it('merges the grass body, grass face, rock wall, and rock bottom as one new island', () => {
    expect(getPrebuiltIslandTerrainPieces({
      occupiedCells: getGrassShapeCells(grassShapes.nine, { x: 4, y: 2 }),
    })).toEqual([
      { cell: { x: 4, y: 6 }, frame: 41, surface: 'rock' },
      { cell: { x: 5, y: 6 }, frame: 42, surface: 'rock' },
      { cell: { x: 6, y: 6 }, frame: 43, surface: 'rock' },
      { cell: { x: 4, y: 7 }, frame: 50, surface: 'rock' },
      { cell: { x: 5, y: 7 }, frame: 51, surface: 'rock' },
      { cell: { x: 6, y: 7 }, frame: 52, surface: 'rock' },
      { cell: { x: 4, y: 2 }, frame: 5, surface: 'grass' },
      { cell: { x: 5, y: 2 }, frame: 6, surface: 'grass' },
      { cell: { x: 6, y: 2 }, frame: 7, surface: 'grass' },
      { cell: { x: 4, y: 3 }, frame: 14, surface: 'grass' },
      { cell: { x: 5, y: 3 }, frame: 15, surface: 'grass' },
      { cell: { x: 6, y: 3 }, frame: 16, surface: 'grass' },
      { cell: { x: 4, y: 4 }, frame: 23, surface: 'grass' },
      { cell: { x: 5, y: 4 }, frame: 24, surface: 'grass' },
      { cell: { x: 6, y: 4 }, frame: 25, surface: 'grass' },
      { cell: { x: 4, y: 5 }, frame: 32, surface: 'grass' },
      { cell: { x: 5, y: 5 }, frame: 33, surface: 'grass' },
      { cell: { x: 6, y: 5 }, frame: 34, surface: 'grass' },
    ]);
  });
});
