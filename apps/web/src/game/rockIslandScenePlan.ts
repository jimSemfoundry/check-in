export const rockIslandScenePlan = {
  platform: {
    widthTiles: 4,
    grassRows: 2,
    rockRows: 2,
  },
  foam: {
    placement: 'below-rock',
    rows: 1,
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
    foamFrames: [96, 97, 97, 98],
    shadowFrame: 4,
  },
  decorations: [],
} as const;
