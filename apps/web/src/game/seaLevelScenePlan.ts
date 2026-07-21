import { tinySwordsTerrainTileset } from './terrainTileset';

export const seaLevelScenePlan = {
  tileSize: tinySwordsTerrainTileset.tileSize,
  grid: {
    columns: 12,
    rows: 8,
  },
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
