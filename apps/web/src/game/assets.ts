import { tinySwordsTerrainTileset } from './terrainTileset';
import { tinySwordsNatureAssets } from './natureAssets';

const tinySwordsBase = '/game/tiny-swords/Terrain/Tileset';
const tinySwordsUiBase = '/game/tiny-swords/UI Elements';

export const tinySwordsAssets = {
  sea: `${tinySwordsBase}/Water Background color.png`,
  terrainTiles: tinySwordsTerrainTileset.image,
  waterFoam: `${tinySwordsBase}/Water Foam.png`,
  trees: tinySwordsNatureAssets.trees,
  sheep: tinySwordsNatureAssets.sheep,
  hud: {
    storeBanner: `${tinySwordsUiBase}/UI Banners from the store page/Banner/Banner.png`,
    storeBannerSlots: `${tinySwordsUiBase}/UI Banners from the store page/Banner/Slots.png`,
  },
} as const;
