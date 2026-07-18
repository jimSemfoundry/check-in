import Phaser from 'phaser';

export const WATER_FOAM_ANIMATION_KEY = 'water-foam-break';

export type WaterFoamGrid = {
  columns: number;
  rows: number;
  originGridX: number;
  originGridY: number;
  startFrame: number;
};

export type WaterFoamPatch = {
  gridX: number;
  gridY: number;
  startFrame: number;
};

export type WaterFoamPlan = {
  spriteTiles: number;
  gridStepTiles: number;
  animationFrames: number;
  frameRate: number;
  grid: Omit<WaterFoamGrid, 'startFrame'>;
  startFrame: number;
};

export function buildWaterFoamPatches(grid: WaterFoamGrid): WaterFoamPatch[] {
  return Array.from({ length: grid.rows }, (_, row) =>
    Array.from({ length: grid.columns }, (_, column) => ({
      gridX: grid.originGridX + column,
      gridY: grid.originGridY + row,
      startFrame: grid.startFrame,
    })),
  ).flat();
}

export function getWaterFoamFrameSize(foam: Pick<WaterFoamPlan, 'spriteTiles'>, tileSize: number) {
  return foam.spriteTiles * tileSize;
}

export function getWaterFoamBottomTiles(foam: WaterFoamPlan) {
  return Math.max(
    ...buildWaterFoamPatches({ ...foam.grid, startFrame: foam.startFrame }).map(
      (patch) => patch.gridY + foam.spriteTiles,
    ),
  );
}

export function createWaterFoamAnimation(
  scene: Phaser.Scene,
  textureKey: string,
  foam: Pick<WaterFoamPlan, 'animationFrames' | 'frameRate'>,
) {
  if (scene.anims.exists(WATER_FOAM_ANIMATION_KEY)) return;

  scene.anims.create({
    key: WATER_FOAM_ANIMATION_KEY,
    frames: scene.anims.generateFrameNumbers(textureKey, {
      start: 0,
      end: foam.animationFrames - 1,
    }),
    frameRate: foam.frameRate,
    repeat: -1,
  });
}

export function createWaterFoamSprites(
  scene: Phaser.Scene,
  options: {
    left: number;
    top: number;
    tileSize: number;
    textureKey: string;
    foam: WaterFoamPlan;
  },
) {
  const patches = buildWaterFoamPatches({ ...options.foam.grid, startFrame: options.foam.startFrame });

  return patches.map((patch) => {
    const px = options.left + patch.gridX * options.foam.gridStepTiles * options.tileSize;
    const py = options.top + patch.gridY * options.foam.gridStepTiles * options.tileSize;
    const sprite = scene.add.sprite(px, py, options.textureKey, patch.startFrame);
    sprite.setOrigin(0, 0);
    sprite.setAlpha(0.86);
    sprite.play({
      key: WATER_FOAM_ANIMATION_KEY,
      startFrame: patch.startFrame,
    });
    return sprite;
  });
}
