export const rockIslandScenePlan = {
  platform: {
    widthTiles: 4,
    grassRows: 2,
    rockRows: 1,
  },
  foam: {
    placement: 'below-rock',
    spriteTiles: 3,
    gridStepTiles: 1,
    animationFrames: 16,
    frameRate: 8,
    patches: [
      { gridX: -1, gridY: -2, startFrame: 0 },
      { gridX: 0, gridY: -2, startFrame: 5 },
      { gridX: 1, gridY: -2, startFrame: 10 },
    ],
  },
  frames: {
    grassRows: [
      [5, 6, 6, 7],
      [23, 24, 24, 25],
    ],
    rockRows: [
      [50, 51, 51, 52],
    ],
    shadowFrame: 4,
  },
  decorations: [],
} as const;
