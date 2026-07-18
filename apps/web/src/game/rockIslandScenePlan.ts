export const rockIslandScenePlan = {
  platform: {
    widthTiles: 3,
    grassRows: 2,
    rockRows: 1,
  },
  foam: {
    placement: 'below-rock',
    spriteTiles: 3,
    gridStepTiles: 1,
    animationFrames: 16,
    frameRate: 8,
    grid: {
      columns: 3,
      rows: 2,
      originGridX: -1,
      originGridY: -3,
    },
    startFrame: 0,
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
  decorations: [],
} as const;
