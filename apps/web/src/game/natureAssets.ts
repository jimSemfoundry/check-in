const tinySwordsResourceBase = '/game/tiny-swords/Terrain/Resources';

export const tinySwordsNatureAssets = {
  trees: {
    tree1: `${tinySwordsResourceBase}/Wood/Trees/Tree1.png`,
    tree2: `${tinySwordsResourceBase}/Wood/Trees/Tree2.png`,
    tree3: `${tinySwordsResourceBase}/Wood/Trees/Tree3.png`,
    tree4: `${tinySwordsResourceBase}/Wood/Trees/Tree4.png`,
  },
  sheep: {
    idle: `${tinySwordsResourceBase}/Meat/Sheep/Sheep_Idle.png`,
    move: `${tinySwordsResourceBase}/Meat/Sheep/Sheep_Move.png`,
    grass: `${tinySwordsResourceBase}/Meat/Sheep/Sheep_Grass.png`,
  },
} as const;

export const treeAnimationConfig = {
  frameWidth: 192,
  trees: {
    tree1: { textureKey: 'tree-1', animationKey: 'tree-1-idle', frameHeight: 256, frames: 8, frameRate: 5 },
    tree2: { textureKey: 'tree-2', animationKey: 'tree-2-idle', frameHeight: 256, frames: 8, frameRate: 5 },
    tree3: { textureKey: 'tree-3', animationKey: 'tree-3-idle', frameHeight: 192, frames: 8, frameRate: 5 },
    tree4: { textureKey: 'tree-4', animationKey: 'tree-4-idle', frameHeight: 192, frames: 8, frameRate: 5 },
  },
} as const;

export const treePlacements = [
  { textureKey: 'tree-1', animationKey: 'tree-1-idle', x: -66, y: -86, scale: 0.34 },
  { textureKey: 'tree-2', animationKey: 'tree-2-idle', x: 66, y: -86, scale: 0.34 },
  { textureKey: 'tree-3', animationKey: 'tree-3-idle', x: -50, y: -28, scale: 0.38 },
  { textureKey: 'tree-4', animationKey: 'tree-4-idle', x: 54, y: -28, scale: 0.38 },
] as const;

export const sheepAnimationConfig = {
  frameSize: 128,
  animations: {
    idle: { key: 'sheep-idle', frames: 6, frameRate: 5 },
    move: { key: 'sheep-move', frames: 4, frameRate: 8 },
    grass: { key: 'sheep-grass', frames: 12, frameRate: 8 },
  },
} as const;

export const sheepMotionConfig = {
  bounds: {
    minX: -58,
    maxX: 58,
    minY: -82,
    maxY: -28,
  },
  start: { x: 0, y: -52 },
  idleMs: 1400,
  grassMs: 1700,
  movePixelsPerSecond: 42,
  scale: 0.44,
} as const;
