export const rockIslandScenePlan = {
  platform: {
    widthTiles: 4,
    grassRows: 2,
    rockRows: 2,
  },
  foam: {
    placement: 'below-rock',
    spriteTiles: 3,
    gridStepTiles: 1,
    patches: [
      { gridX: -1, gridY: -1, frame: 0 },
      { gridX: 0, gridY: -1, frame: 4 },
      { gridX: 1, gridY: -1, frame: 8 },
    ],
  },
  frames: {
    grassRows: [
      [0, 1, 1, 2],
      [18, 19, 19, 20],
    ],
    rockRows: [
      [41, 42, 42, 43],
      [50, 51, 51, 52],
    ],
    shadowFrame: 4,
  },
  decorations: [],
} as const;
