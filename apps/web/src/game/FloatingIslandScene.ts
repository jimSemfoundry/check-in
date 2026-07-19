import Phaser from 'phaser';
import { tinySwordsAssets } from './assets';
import { rockIslandScenePlan } from './rockIslandScenePlan';
import {
  createWaterFoamAnimation,
  createWaterFoamSprites,
  getWaterFoamBottomTiles,
  getWaterFoamFrameSize,
} from './waterFoam';
import { tinySwordsTerrainTileset } from './terrainTileset';
import {
  sheepAnimationConfig,
  sheepMotionConfig,
  treeAnimationConfig,
  treePlacements,
} from './natureAssets';
import { createSheepRouteTarget, getSheepMoveDurationMs } from './sheepMotion';
import { gameHudLayout } from './hudLayout';

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;
const TILE_SIZE = tinySwordsTerrainTileset.tileSize;
const SEA_COLOR = 0x4db6b5;

const platformWidth = rockIslandScenePlan.platform.widthTiles * TILE_SIZE;
const grassHeight = rockIslandScenePlan.platform.grassRows * TILE_SIZE;
const rockHeight = rockIslandScenePlan.platform.rockRows * TILE_SIZE;
const foamFrameSize = getWaterFoamFrameSize(rockIslandScenePlan.foam, TILE_SIZE);
const foamBelowTiles = getWaterFoamBottomTiles(rockIslandScenePlan.foam);
const foamHeight = foamBelowTiles * TILE_SIZE;
const platformHeight = grassHeight + rockHeight + foamHeight;

export class FloatingIslandScene extends Phaser.Scene {
  private worldRoot?: Phaser.GameObjects.Container;
  private hudRoot?: Phaser.GameObjects.Container;
  private sheep?: Phaser.GameObjects.Sprite;

  constructor() {
    super('floating-island');
  }

  preload() {
    this.load.image('sea', tinySwordsAssets.sea);
    this.load.spritesheet('terrain-tiles', tinySwordsAssets.terrainTiles, {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    this.load.spritesheet('water-foam', tinySwordsAssets.waterFoam, {
      frameWidth: foamFrameSize,
      frameHeight: foamFrameSize,
    });
    this.loadTreeSpritesheets();
    this.loadSheepSpritesheets();
    this.load.image('hud-store-banner', tinySwordsAssets.hud.storeBanner);
    this.load.image('hud-wood-table-slots', tinySwordsAssets.hud.woodTableSlots);
  }

  create() {
    this.scale.on('resize', this.layout, this);
    this.cameras.main.setBackgroundColor(SEA_COLOR);
    createWaterFoamAnimation(this, 'water-foam', rockIslandScenePlan.foam);
    this.createNatureAnimations();
    this.createSheepAnimations();
    this.buildScene();
    this.createHud();
    this.layout();
  }

  private buildScene() {
    this.worldRoot?.destroy(true);
    this.worldRoot = this.add.container(0, 0);

    this.createSea();
    this.createRockIsland();
  }

  private createHud() {
    this.hudRoot?.destroy(true);
    this.hudRoot = this.add.container(0, 0);
    this.hudRoot.setDepth(100);
    this.createHudBannerFrames();

    const bannerPieces = gameHudLayout.bannerPieces.map((piece) => {
      const bannerPiece = this.add.image(piece.target.x, piece.target.y, 'hud-store-banner', piece.key);
      bannerPiece.setDisplaySize(piece.target.width, piece.target.height);
      bannerPiece.setOrigin(0.5);
      return bannerPiece;
    });

    this.hudRoot.add(bannerPieces);
  }

  private createHudBannerFrames() {
    const bannerTexture = this.textures.get('hud-store-banner');

    for (const piece of gameHudLayout.bannerPieces) {
      if (bannerTexture.has(piece.key)) continue;

      bannerTexture.add(
        piece.key,
        0,
        piece.source.x,
        piece.source.y,
        piece.source.width,
        piece.source.height,
      );
    }
  }

  private createSea() {
    const sea = this.add.tileSprite(0, 0, DESIGN_WIDTH + 640, DESIGN_HEIGHT + 640, 'sea');
    sea.setOrigin(0.5);
    sea.setAlpha(0.94);
    this.worldRoot?.add(sea);
  }

  private createRockIsland() {
    const left = -platformWidth / 2;
    const top = -platformHeight / 2;
    this.createBottomFoam(left, top + grassHeight + rockHeight);
    this.createRockBody(left, top + grassHeight);
    this.createGrassCap(left, top);
    this.createNature();
  }

  private createGrassCap(left: number, top: number) {
    for (let y = 0; y < rockIslandScenePlan.platform.grassRows; y += 1) {
      for (let x = 0; x < rockIslandScenePlan.platform.widthTiles; x += 1) {
        const px = left + x * TILE_SIZE + TILE_SIZE / 2;
        const py = top + y * TILE_SIZE + TILE_SIZE / 2;
        const frame = rockIslandScenePlan.frames.grassRows[y]?.[x] ?? 0;
        this.addToWorld(this.createTerrainTile(px, py, frame));
      }
    }
  }

  private createRockBody(left: number, top: number) {
    for (let y = 0; y < rockIslandScenePlan.platform.rockRows; y += 1) {
      for (let x = 0; x < rockIslandScenePlan.platform.widthTiles; x += 1) {
        const px = left + x * TILE_SIZE + TILE_SIZE / 2;
        const py = top + y * TILE_SIZE + TILE_SIZE / 2;
        const frame = rockIslandScenePlan.frames.rockRows[y]?.[x] ?? 41;
        this.addToWorld(this.createTerrainTile(px, py, frame));
      }
    }
  }

  private createTerrainTile(x: number, y: number, frame: number) {
    const tile = this.add.image(x, y, 'terrain-tiles', frame);
    const overlap = rockIslandScenePlan.platform.tileOverlapPixels;
    tile.setDisplaySize(TILE_SIZE + overlap, TILE_SIZE + overlap);
    return tile;
  }

  private createBottomFoam(left: number, top: number) {
    const foamSprites = createWaterFoamSprites(this, {
      left,
      top,
      tileSize: TILE_SIZE,
      textureKey: 'water-foam',
      foam: rockIslandScenePlan.foam,
    });

    for (const foam of foamSprites) {
      this.addToWorld(foam);
    }
  }

  private loadTreeSpritesheets() {
    this.load.spritesheet('tree-1', tinySwordsAssets.trees.tree1, {
      frameWidth: treeAnimationConfig.frameWidth,
      frameHeight: treeAnimationConfig.trees.tree1.frameHeight,
    });
    this.load.spritesheet('tree-2', tinySwordsAssets.trees.tree2, {
      frameWidth: treeAnimationConfig.frameWidth,
      frameHeight: treeAnimationConfig.trees.tree2.frameHeight,
    });
    this.load.spritesheet('tree-3', tinySwordsAssets.trees.tree3, {
      frameWidth: treeAnimationConfig.frameWidth,
      frameHeight: treeAnimationConfig.trees.tree3.frameHeight,
    });
    this.load.spritesheet('tree-4', tinySwordsAssets.trees.tree4, {
      frameWidth: treeAnimationConfig.frameWidth,
      frameHeight: treeAnimationConfig.trees.tree4.frameHeight,
    });
  }

  private loadSheepSpritesheets() {
    this.load.spritesheet('sheep-idle-texture', tinySwordsAssets.sheep.idle, {
      frameWidth: sheepAnimationConfig.frameSize,
      frameHeight: sheepAnimationConfig.frameSize,
    });
    this.load.spritesheet('sheep-move-texture', tinySwordsAssets.sheep.move, {
      frameWidth: sheepAnimationConfig.frameSize,
      frameHeight: sheepAnimationConfig.frameSize,
    });
    this.load.spritesheet('sheep-grass-texture', tinySwordsAssets.sheep.grass, {
      frameWidth: sheepAnimationConfig.frameSize,
      frameHeight: sheepAnimationConfig.frameSize,
    });
  }

  private createNatureAnimations() {
    for (const config of Object.values(treeAnimationConfig.trees)) {
      if (this.anims.exists(config.animationKey)) continue;

      this.anims.create({
        key: config.animationKey,
        frames: this.anims.generateFrameNumbers(config.textureKey, {
          start: 0,
          end: config.frames - 1,
        }),
        frameRate: config.frameRate,
        repeat: -1,
      });
    }
  }

  private createSheepAnimations() {
    this.createSheepAnimation(
      sheepAnimationConfig.animations.idle.key,
      'sheep-idle-texture',
      sheepAnimationConfig.animations.idle.frames,
      sheepAnimationConfig.animations.idle.frameRate,
      -1,
    );
    this.createSheepAnimation(
      sheepAnimationConfig.animations.move.key,
      'sheep-move-texture',
      sheepAnimationConfig.animations.move.frames,
      sheepAnimationConfig.animations.move.frameRate,
      -1,
    );
    this.createSheepAnimation(
      sheepAnimationConfig.animations.grass.key,
      'sheep-grass-texture',
      sheepAnimationConfig.animations.grass.frames,
      sheepAnimationConfig.animations.grass.frameRate,
      0,
    );
  }

  private createSheepAnimation(
    animationKey: string,
    textureKey: string,
    frames: number,
    frameRate: number,
    repeat: number,
  ) {
    if (this.anims.exists(animationKey)) return;

    this.anims.create({
      key: animationKey,
      frames: this.anims.generateFrameNumbers(textureKey, {
        start: 0,
        end: frames - 1,
      }),
      frameRate,
      repeat,
    });
  }

  private createNature() {
    const natureObjects: Phaser.GameObjects.Sprite[] = [];

    for (const placement of treePlacements) {
      const tree = this.add.sprite(placement.x, placement.y, placement.textureKey, 0);
      tree.setOrigin(0.5, 0.82);
      tree.setScale(placement.scale);
      tree.play(placement.animationKey);
      natureObjects.push(tree);
    }

    const sheep = this.add.sprite(
      sheepMotionConfig.start.x,
      sheepMotionConfig.start.y,
      'sheep-idle-texture',
      0,
    );
    sheep.setOrigin(0.5, 0.74);
    sheep.setScale(sheepMotionConfig.scale);
    sheep.play(sheepAnimationConfig.animations.idle.key);
    this.sheep = sheep;
    natureObjects.push(sheep);

    for (const gameObject of natureObjects.sort((a, b) => a.y - b.y)) {
      this.addToWorld(gameObject);
    }

    this.queueSheepMove();
  }

  private queueSheepMove() {
    if (!this.sheep) return;

    this.time.delayedCall(sheepMotionConfig.idleMs, () => {
      this.moveSheepToNextTarget();
    });
  }

  private moveSheepToNextTarget() {
    if (!this.sheep) return;

    const target = createSheepRouteTarget(Math.random, sheepMotionConfig.bounds);
    const duration = getSheepMoveDurationMs(this.sheep, target, sheepMotionConfig.movePixelsPerSecond);

    this.sheep.setFlipX(target.x < this.sheep.x);
    this.sheep.play(sheepAnimationConfig.animations.move.key, true);

    this.tweens.add({
      targets: this.sheep,
      x: target.x,
      y: target.y,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.playSheepGrass();
      },
    });
  }

  private playSheepGrass() {
    if (!this.sheep) return;

    this.sheep.play(sheepAnimationConfig.animations.grass.key, true);
    this.time.delayedCall(sheepMotionConfig.grassMs, () => {
      if (!this.sheep) return;

      this.sheep.play(sheepAnimationConfig.animations.idle.key, true);
      this.queueSheepMove();
    });
  }

  private addToWorld<T extends Phaser.GameObjects.GameObject>(gameObject: T) {
    this.worldRoot?.add(gameObject);
    return gameObject;
  }

  private layout() {
    if (!this.worldRoot) return;

    const width = this.scale.width || DESIGN_WIDTH;
    const height = this.scale.height || DESIGN_HEIGHT;
    const margin = Math.min(width, height) < 620 ? 34 : 80;
    const zoom = Math.min(
      width / (platformWidth + margin * 2),
      height / (platformHeight + margin * 2),
      1.75,
    );

    this.worldRoot.setPosition(width / 2, height / 2);
    this.worldRoot.setScale(zoom);
    this.layoutHud(width, height);
  }

  private layoutHud(width: number, height: number) {
    if (!this.hudRoot) return;

    const hudTransform = gameHudLayout.getHudTransform(width, height);
    this.hudRoot.setScale(hudTransform.scale);
    this.hudRoot.setPosition(hudTransform.x, hudTransform.y);
  }
}
