import Phaser from 'phaser';
import { tinySwordsAssets } from './assets';
import { rockIslandScenePlan } from './rockIslandScenePlan';

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;
const TILE_SIZE = 64;
const SEA_COLOR = 0x4db6b5;

const platformWidth = rockIslandScenePlan.platform.widthTiles * TILE_SIZE;
const grassHeight = rockIslandScenePlan.platform.grassRows * TILE_SIZE;
const rockHeight = rockIslandScenePlan.platform.rockRows * TILE_SIZE;
const foamHeight = rockIslandScenePlan.foam.rows * TILE_SIZE;
const platformHeight = grassHeight + rockHeight + foamHeight;

export class FloatingIslandScene extends Phaser.Scene {
  private worldRoot?: Phaser.GameObjects.Container;

  constructor() {
    super('floating-island');
  }

  preload() {
    this.load.image('sea', tinySwordsAssets.sea);
    this.load.spritesheet('grass', tinySwordsAssets.islandTiles, {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    this.load.image('grass-center', tinySwordsAssets.islandCenter);
    this.load.spritesheet('rock-tiles', tinySwordsAssets.rockTiles, {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    this.load.spritesheet('water-foam', tinySwordsAssets.waterFoam, {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
  }

  create() {
    this.scale.on('resize', this.layout, this);
    this.cameras.main.setBackgroundColor(SEA_COLOR);
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
    this.createGrassCap(left, top);
    this.createRockBody(left, top + grassHeight);
    this.createBottomFoam(left, top + grassHeight + rockHeight);
  }

  private createGrassCap(left: number, top: number) {
    for (let y = 0; y < rockIslandScenePlan.platform.grassRows; y += 1) {
      for (let x = 0; x < rockIslandScenePlan.platform.widthTiles; x += 1) {
        const px = left + x * TILE_SIZE + TILE_SIZE / 2;
        const py = top + y * TILE_SIZE + TILE_SIZE / 2;
        if (y === 0 || x === 0 || x === rockIslandScenePlan.platform.widthTiles - 1) {
          this.addToWorld(this.add.image(px, py, 'grass', this.getGrassFrame(x, y)));
        } else {
          this.addToWorld(this.add.image(px, py, 'grass-center'));
        }
      }
    }
  }

  private getGrassFrame(x: number, y: number) {
    const maxX = rockIslandScenePlan.platform.widthTiles - 1;
    if (x === 0 && y === 0) return 0;
    if (x === maxX && y === 0) return 4;
    if (x === 0) return 20;
    if (x === maxX) return 23;
    if (y === 0) return 1 + (x % 3);
    return 21 + (x % 2);
  }

  private createRockBody(left: number, top: number) {
    for (let y = 0; y < rockIslandScenePlan.platform.rockRows; y += 1) {
      for (let x = 0; x < rockIslandScenePlan.platform.widthTiles; x += 1) {
        const px = left + x * TILE_SIZE + TILE_SIZE / 2;
        const py = top + y * TILE_SIZE + TILE_SIZE / 2;
        const frame = this.getRockFrame(x, y);
        const tile = this.add.image(px, py, 'rock-tiles', frame);
        tile.setTint(y === 0 ? 0xffffff : 0xd6f4f0);
        this.addToWorld(tile);
      }
    }
  }

  private getRockFrame(x: number, y: number) {
    const maxX = rockIslandScenePlan.platform.widthTiles - 1;
    if (x === 0) return y === 0 ? 12 : 20;
    if (x === maxX) return y === 0 ? 15 : 23;
    return y === 0 ? 13 + (x % 2) : 21 + (x % 2);
  }

  private createBottomFoam(left: number, top: number) {
    for (let x = 0; x < rockIslandScenePlan.platform.widthTiles; x += 1) {
      const px = left + x * TILE_SIZE + TILE_SIZE / 2;
      const py = top + TILE_SIZE / 2;
      const foam = this.add.image(px, py, 'water-foam', x % 4);
      foam.setAlpha(0.72);
      foam.setTint(0xdbfff7);
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
