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
      [0, 1, 1, 2],
      [18, 19, 19, 20],
    ],
    rockRows: [
      [50, 51, 51, 52],
    ],
    shadowFrame: 4,
  },
  decorations: [],
} as const;
