import { tinySwordsTerrainTileset } from './terrainTileset';

export const seaLevelScenePlan = {
  tileSize: tinySwordsTerrainTileset.tileSize,
  grid: {
    columns: 12,
    rows: 8,
  },
  grassFrame: 24,
} as const;
