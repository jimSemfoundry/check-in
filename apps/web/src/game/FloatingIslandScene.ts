import Phaser from 'phaser';
import { tinySwordsAssets } from './assets';

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;
const TILE_SIZE = 64;
const ISLAND_TILES = 12;
const ISLAND_SIZE = TILE_SIZE * ISLAND_TILES;
const SEA_COLOR = 0x4db6b5;

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
    this.load.spritesheet('foam-shadow', tinySwordsAssets.foam, {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    this.load.image('clouds', tinySwordsAssets.clouds[0]);
    this.load.image('tree', tinySwordsAssets.trees[0]);
    this.load.spritesheet('rocks', tinySwordsAssets.rocks[0], {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    this.load.image('sheep', tinySwordsAssets.sheep[0]);
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
    this.createClouds();
    this.createFoam();
    this.createCliff();
    this.createIslandGround();
    this.createProps();
  }

  private createSea() {
    const sea = this.add.tileSprite(0, 0, DESIGN_WIDTH + 640, DESIGN_HEIGHT + 640, 'sea');
    sea.setOrigin(0.5);
    sea.setAlpha(0.92);
    this.worldRoot?.add(sea);
  }

  private createClouds() {
    const clouds = [
      { x: 288, y: -518, scale: 1.85, alpha: 0.5 },
      { x: -286, y: 520, scale: 2.1, alpha: 0.46 },
      { x: -346, y: -444, scale: 1.15, alpha: 0.4 },
      { x: 310, y: 478, scale: 1.05, alpha: 0.38 },
    ];

    for (const cloud of clouds) {
      const sprite = this.add.image(cloud.x, cloud.y, 'clouds');
      sprite.setScale(cloud.scale);
      sprite.setAlpha(cloud.alpha);
      sprite.setTint(0xd6f3ee);
      this.worldRoot?.add(sprite);
    }
  }

  private createFoam() {
    const half = ISLAND_SIZE / 2;
    const foamFrame = 29;
    for (let i = 0; i < ISLAND_TILES; i += 1) {
      const offset = -half + i * TILE_SIZE + TILE_SIZE / 2;
      this.addFoamTile(offset, -half - 18, 0, foamFrame);
      this.addFoamTile(offset, half + 18, 180, foamFrame);
      this.addFoamTile(-half - 18, offset, -90, foamFrame);
      this.addFoamTile(half + 18, offset, 90, foamFrame);
    }
  }

  private addFoamTile(x: number, y: number, angle: number, frame: number) {
    const foam = this.add.image(x, y, 'foam-shadow', frame);
    foam.setAngle(angle);
    foam.setAlpha(0.52);
    foam.setTint(0xd7fff4);
    foam.setScale(0.72);
    this.addToWorld(foam);
  }

  private createCliff() {
    const half = ISLAND_SIZE / 2;
    const depth = this.add.rectangle(0, 56, ISLAND_SIZE + 14, ISLAND_SIZE + 78, 0x246a67, 0.34);
    depth.setOrigin(0.5);
    this.addToWorld(depth);

    for (let i = 0; i < ISLAND_TILES; i += 1) {
      const x = -half + i * TILE_SIZE + TILE_SIZE / 2;
      const cliff = this.add.image(x, half + 28, 'foam-shadow', 21 + (i % 2));
      cliff.setTint(0x2f7c76);
      cliff.setAlpha(0.96);
      this.addToWorld(cliff);
    }
  }

  private createIslandGround() {
    const half = ISLAND_SIZE / 2;
    for (let y = 0; y < ISLAND_TILES; y += 1) {
      for (let x = 0; x < ISLAND_TILES; x += 1) {
        const px = -half + x * TILE_SIZE + TILE_SIZE / 2;
        const py = -half + y * TILE_SIZE + TILE_SIZE / 2;
        if (x > 0 && x < ISLAND_TILES - 1 && y > 0 && y < ISLAND_TILES - 1) {
          this.addToWorld(this.add.image(px, py, 'grass-center'));
          continue;
        }
        const frame = this.getGroundFrame(x, y);
        this.addToWorld(this.add.image(px, py, 'grass', frame));
      }
    }
  }

  private getGroundFrame(x: number, y: number) {
    if (x === 0 && y === 0) return 0;
    if (x === ISLAND_TILES - 1 && y === 0) return 4;
    if (x === 0 && y === ISLAND_TILES - 1) return 20;
    if (x === ISLAND_TILES - 1 && y === ISLAND_TILES - 1) return 23;
    if (y === 0) return 1 + (x % 3);
    if (y === ISLAND_TILES - 1) return 21 + (x % 2);
    if (x === 0) return y % 2 === 0 ? 10 : 20;
    if (x === ISLAND_TILES - 1) return y % 2 === 0 ? 13 : 23;
    return 11;
  }

  private createProps() {
    const tree = this.add.image(-42, 74, 'tree');
    tree.setScale(0.82);
    this.addToWorld(tree);

    const rocks = [
      { x: 104, y: 108, frame: 0, scale: 1.0 },
      { x: 168, y: 42, frame: 2, scale: 0.92 },
      { x: 94, y: -42, frame: 4, scale: 0.84 },
    ];
    for (const rock of rocks) {
      const sprite = this.add.image(rock.x, rock.y, 'rocks', rock.frame);
      sprite.setScale(rock.scale);
      this.addToWorld(sprite);
    }

    const sheep = [
      { x: -214, y: -74, flip: false },
      { x: 214, y: -154, flip: true },
      { x: -156, y: 192, flip: true },
    ];
    for (const animal of sheep) {
      const sprite = this.add.image(animal.x, animal.y, 'sheep');
      sprite.setScale(1.06);
      sprite.setFlipX(animal.flip);
      this.addToWorld(sprite);
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
    const margin = Math.min(width, height) < 620 ? 48 : 82;
    const zoom = Math.min(
      width / (ISLAND_SIZE + margin * 2),
      height / (ISLAND_SIZE + margin * 2),
      1,
    );

    this.worldRoot.setPosition(width / 2, height / 2);
    this.worldRoot.setScale(zoom);
  }
}
