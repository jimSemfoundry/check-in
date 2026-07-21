import { tinySwordsTerrainTileset } from './terrainTileset';

export const rockIslandScenePlan = {
  platform: tinySwordsTerrainTileset.platform,
  foam: {
    placement: 'below-rock',
    spriteTiles: 3,
    gridStepTiles: 1,
    animationFrames: 16,
    frameRate: 8,
    grid: {
      columns: 6,
      rows: 2,
      originGridX: -1,
      originGridY: -3,
    },
    startFrame: 0,
  },
  frames: tinySwordsTerrainTileset.frames,
  decorations: [],
} as const;
