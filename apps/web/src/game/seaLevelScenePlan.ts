import { tinySwordsTerrainTileset } from './terrainTileset';

export const seaLevelScenePlan = {
  tileSize: tinySwordsTerrainTileset.tileSize,
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
} as const;
