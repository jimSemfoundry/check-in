const tinySwordsTilesetBase = '/game/tiny-swords/Terrain/Tileset';

export const tinySwordsTerrainTileset = {
  image: `${tinySwordsTilesetBase}/Tilemap_color1.png`,
  tileSize: 64,
  platform: {
    widthTiles: 3,
    grassRows: 2,
    rockRows: 1,
    tileOverlapPixels: 1,
  },
  frames: {
    grassRows: [
      [5, 6, 7],
      [23, 24, 25],
    ],
    rockRows: [
      [50, 51, 52],
    ],
  },
} as const;
