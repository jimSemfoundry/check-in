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
  }

  create() {
    this.scale.on('resize', this.layout, this);
    this.cameras.main.setBackgroundColor(SEA_COLOR);
    createWaterFoamAnimation(this, 'water-foam', rockIslandScenePlan.foam);
    this.buildScene();
    this.layout();
  }

  private buildScene() {
    this.worldRoot?.destroy(true);
    this.worldRoot = this.add.container(0, 0);

    this.createSea();
    this.createRockIsland();
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
  }
}
