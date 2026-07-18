import { tinySwordsTerrainTileset } from './terrainTileset';
import { tinySwordsNatureAssets } from './natureAssets';

const tinySwordsBase = '/game/tiny-swords/Terrain/Tileset';

export const tinySwordsAssets = {
  sea: `${tinySwordsBase}/Water Background color.png`,
  terrainTiles: tinySwordsTerrainTileset.image,
  waterFoam: `${tinySwordsBase}/Water Foam.png`,
  trees: tinySwordsNatureAssets.trees,
  sheep: tinySwordsNatureAssets.sheep,
} as const;
