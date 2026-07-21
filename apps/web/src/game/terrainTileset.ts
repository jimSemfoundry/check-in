const tinySwordsTilesetBase = '/game/tiny-swords/Terrain/Tileset';

export const tinySwordsTerrainTileset = {
  image: `${tinySwordsTilesetBase}/Tilemap_color1.png`,
  tileSize: 64,
  platform: {
    widthTiles: 6,
    grassRows: 6,
    rockRows: 1,
    tileOverlapPixels: 1,
  },
  frames: {
    grassRows: [
      [5, 6, 6, 6, 6, 7],
      [23, 24, 24, 24, 24, 25],
      [23, 24, 24, 24, 24, 25],
      [23, 24, 24, 24, 24, 25],
      [23, 24, 24, 24, 24, 25],
      [41, 42, 42, 42, 42, 43],
    ],
    rockRows: [
      [50, 51, 51, 51, 51, 52],
    ],
  },
} as const;
