import { tinySwordsTerrainTileset } from './terrainTileset';

const tinySwordsBase = '/game/tiny-swords/Terrain/Tileset';

export const tinySwordsAssets = {
  sea: `${tinySwordsBase}/Water Background color.png`,
  terrainTiles: tinySwordsTerrainTileset.image,
  waterFoam: `${tinySwordsBase}/Water Foam.png`,
} as const;
