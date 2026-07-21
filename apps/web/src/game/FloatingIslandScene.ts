import Phaser from 'phaser';
import { tinySwordsAssets } from './assets';
import { gameHudLayout } from './hudLayout';
import {
  getCanvasPointFromPointerEvent,
  getGrassShapeForHudSlot,
  getGridCellFromWorldPoint,
  placeGrassPatch,
  type GrassPatch,
} from './grassPlacement';
import { seaLevelScenePlan } from './seaLevelScenePlan';

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;
const TILE_SIZE = seaLevelScenePlan.tileSize;
const SEA_COLOR = 0x4db6b5;

const placementWidth = seaLevelScenePlan.grid.columns * TILE_SIZE;
const placementHeight = seaLevelScenePlan.grid.rows * TILE_SIZE;

export class FloatingIslandScene extends Phaser.Scene {
  private worldRoot?: Phaser.GameObjects.Container;
  private availableCellRoot?: Phaser.GameObjects.Container;
  private grassRoot?: Phaser.GameObjects.Container;
  private occupiedCellRoot?: Phaser.GameObjects.Container;
  private hudRoot?: Phaser.GameObjects.Container;
  private hudBannerPieces: Phaser.GameObjects.Image[] = [];
  private hudSlotPieces: Phaser.GameObjects.Image[] = [];
  private hudSlotItems: Phaser.GameObjects.Image[] = [];
  private hudSlotCursor?: Phaser.GameObjects.Image;
  private selectedHudSlotIndex = 0;
  private grassPatches: GrassPatch[] = [];
  private nextGrassPatchId = 1;

  constructor() {
    super('floating-island');
  }

  preload() {
    this.load.image('sea', tinySwordsAssets.sea);
    this.load.spritesheet('terrain-tiles', tinySwordsAssets.terrainTiles, {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    this.load.image('hud-store-banner', tinySwordsAssets.hud.storeBanner);
    this.load.image('hud-store-banner-slots', tinySwordsAssets.hud.storeBannerSlots);
    this.load.image('hud-slot-cursor', tinySwordsAssets.hud.slotCursor);
  }

  create() {
    this.scale.on('resize', this.layout, this);
    this.cameras.main.setBackgroundColor(SEA_COLOR);
    this.buildScene();
    this.createHud();
    this.input.on('pointerdown', this.handleWorldPointerDown, this);
    this.layout();
  }

  private buildScene() {
    this.worldRoot?.destroy(true);
    this.worldRoot = this.add.container(0, 0);
    this.availableCellRoot = undefined;
    this.grassRoot = undefined;
    this.occupiedCellRoot = undefined;
    this.grassPatches = [];
    this.nextGrassPatchId = 1;

    this.createSea();
    this.createPlacementLayers();
  }

  private createHud() {
    this.hudRoot?.destroy(true);
    this.hudRoot = this.add.container(0, 0);
    this.hudRoot.setDepth(100);
    this.createHudFrames('hud-store-banner', gameHudLayout.bannerPieces);
    this.createHudFrames('hud-store-banner-slots', gameHudLayout.slotPieces);
    this.createHudTerrainItemFrames();

    this.hudBannerPieces = gameHudLayout.bannerPieces.map((piece) => {
      const bannerPiece = this.add.image(0, 0, 'hud-store-banner', piece.key);
      bannerPiece.setOrigin(0.5);
      return bannerPiece;
    });

    this.hudSlotPieces = gameHudLayout.getSlotTargets(this.scale.width || DESIGN_WIDTH).map((piece) => {
      const slotPiece = this.add.image(0, 0, 'hud-store-banner-slots', piece.key);
      slotPiece.setOrigin(0.5);
      slotPiece.setInteractive({ useHandCursor: true });
      slotPiece.on('pointerdown', (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        this.selectedHudSlotIndex = piece.slotIndex;
        this.layoutHud(this.scale.width || DESIGN_WIDTH, this.scale.height || DESIGN_HEIGHT);
      });
      return slotPiece;
    });

    this.hudSlotItems = gameHudLayout.slotItems.map((item) => {
      const slotItem = this.add.image(0, 0, 'terrain-tiles', item.key);
      slotItem.setOrigin(0.5);
      return slotItem;
    });

    this.hudSlotCursor = this.add.image(0, 0, 'hud-slot-cursor');
    this.hudSlotCursor.setOrigin(0.5);

    this.hudRoot.add([
      ...this.hudBannerPieces,
      ...this.hudSlotPieces,
      ...this.hudSlotItems,
      this.hudSlotCursor,
    ]);
  }

  private createHudFrames(
    textureKey: string,
    pieces: typeof gameHudLayout.bannerPieces | typeof gameHudLayout.slotPieces,
  ) {
    const texture = this.textures.get(textureKey);

    for (const piece of pieces) {
      if (texture.has(piece.key)) continue;

      texture.add(
        piece.key,
        0,
        piece.source.x,
        piece.source.y,
        piece.source.width,
        piece.source.height,
      );
    }
  }

  private createHudTerrainItemFrames() {
    const texture = this.textures.get('terrain-tiles');

    for (const item of gameHudLayout.slotItems) {
      if (texture.has(item.key)) continue;

      texture.add(
        item.key,
        0,
        item.source.x,
        item.source.y,
        item.source.width,
        item.source.height,
      );
    }
  }

  private createSea() {
    const sea = this.add.tileSprite(0, 0, DESIGN_WIDTH + 640, DESIGN_HEIGHT + 640, 'sea');
    sea.setOrigin(0.5);
    sea.setAlpha(0.94);
    this.addToWorld(sea);
  }

  private createPlacementLayers() {
    this.availableCellRoot = this.add.container(0, 0);
    this.grassRoot = this.add.container(0, 0);
    this.occupiedCellRoot = this.add.container(0, 0);
    this.addToWorld(this.availableCellRoot);
    this.addToWorld(this.grassRoot);
    this.addToWorld(this.occupiedCellRoot);
    this.renderAvailableCells();
  }

  private addToWorld<T extends Phaser.GameObjects.GameObject>(gameObject: T) {
    this.worldRoot?.add(gameObject);
    return gameObject;
  }

  private handleWorldPointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.worldRoot || !this.grassRoot || !this.occupiedCellRoot) return;

    const shape = getGrassShapeForHudSlot(this.selectedHudSlotIndex);
    if (!shape) return;

    const canvasPoint = this.getCanvasPoint(pointer);
    if (!canvasPoint) return;

    const gridLeft = -placementWidth / 2;
    const gridTop = -placementHeight / 2;
    const worldPoint = {
      x: (canvasPoint.x - this.worldRoot.x) / this.worldRoot.scaleX,
      y: (canvasPoint.y - this.worldRoot.y) / this.worldRoot.scaleY,
    };
    const anchor = getGridCellFromWorldPoint({
      point: worldPoint,
      gridLeft,
      gridTop,
      tileSize: TILE_SIZE,
      grid: seaLevelScenePlan.grid,
    });

    if (!anchor) return;

    const nextPatches = placeGrassPatch({
      id: `grass-${this.nextGrassPatchId}`,
      shape,
      anchor,
      grid: seaLevelScenePlan.grid,
      patches: this.grassPatches,
    });

    if (nextPatches === this.grassPatches) return;

    this.nextGrassPatchId += 1;
    this.grassPatches = nextPatches;
    this.renderGrassPatch(nextPatches[nextPatches.length - 1]);
  }

  private getCanvasPoint(pointer: Phaser.Input.Pointer) {
    const event = pointer.event;
    const clientPoint = this.getClientPoint(event);
    if (!clientPoint) return undefined;

    const rect = this.scale.canvas.getBoundingClientRect();

    return getCanvasPointFromPointerEvent({
      clientPoint,
      canvasRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
      canvasSize: {
        width: this.scale.canvas.width,
        height: this.scale.canvas.height,
      },
    });
  }

  private getClientPoint(event: MouseEvent | TouchEvent | WheelEvent | undefined) {
    if (!event) return undefined;

    if ('clientX' in event && 'clientY' in event) {
      return { x: event.clientX, y: event.clientY };
    }

    const touch = event.changedTouches[0] ?? event.touches[0];
    if (!touch) return undefined;

    return { x: touch.clientX, y: touch.clientY };
  }

  private renderGrassPatch(patch: GrassPatch | undefined) {
    if (!patch || !this.grassRoot || !this.occupiedCellRoot) return;

    const gridLeft = -placementWidth / 2;
    const gridTop = -placementHeight / 2;

    for (const cell of patch.cells) {
      const tile = this.add.image(
        gridLeft + cell.x * TILE_SIZE + TILE_SIZE / 2,
        gridTop + cell.y * TILE_SIZE + TILE_SIZE / 2,
        'terrain-tiles',
        seaLevelScenePlan.grassFrame,
      );
      tile.setDisplaySize(TILE_SIZE + 1, TILE_SIZE + 1);
      this.grassRoot.add(tile);
      this.occupiedCellRoot.add(this.createCellStateRectangle(cell, gridLeft, gridTop, 'occupied'));
    }
  }

  private renderAvailableCells() {
    if (!this.availableCellRoot) return;

    const gridLeft = -placementWidth / 2;
    const gridTop = -placementHeight / 2;

    for (let y = 0; y < seaLevelScenePlan.grid.rows; y += 1) {
      for (let x = 0; x < seaLevelScenePlan.grid.columns; x += 1) {
        this.availableCellRoot.add(this.createCellStateRectangle({ x, y }, gridLeft, gridTop, 'available'));
      }
    }
  }

  private createCellStateRectangle(
    cell: { x: number; y: number },
    gridLeft: number,
    gridTop: number,
    state: keyof typeof seaLevelScenePlan.cellStates,
  ) {
    const style = seaLevelScenePlan.cellStates[state];
    const rect = this.add.rectangle(
      gridLeft + cell.x * TILE_SIZE + TILE_SIZE / 2,
      gridTop + cell.y * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE - 7,
      TILE_SIZE - 7,
      style.fillColor,
      style.fillAlpha,
    );
    rect.setStrokeStyle(2, style.strokeColor, style.strokeAlpha);
    return rect;
  }

  private layout() {
    if (!this.worldRoot) return;

    const width = this.scale.width || DESIGN_WIDTH;
    const height = this.scale.height || DESIGN_HEIGHT;
    const margin = Math.min(width, height) < 620 ? 34 : 80;
    const zoom = Math.min(
      width / (placementWidth + margin * 2),
      height / (placementHeight + margin * 2),
      1.35,
    );

    this.worldRoot.setPosition(width / 2, height / 2);
    this.worldRoot.setScale(zoom);
    this.layoutHud(width, height);
  }

  private layoutHud(width: number, height: number) {
    if (!this.hudRoot) return;

    const hudTransform = gameHudLayout.getHudTransform(width, height);
    const bannerPieces = gameHudLayout.getBannerPieceTargets(width);
    const slotPieces = gameHudLayout.getSlotTargets(width);
    const slotItems = gameHudLayout.getSlotItemTargets(width);
    const slotCursor = gameHudLayout.getSlotCursorTarget(width, this.selectedHudSlotIndex);

    for (const [index, piece] of bannerPieces.entries()) {
      const bannerPiece = this.hudBannerPieces[index];
      if (!bannerPiece) continue;

      bannerPiece.setPosition(piece.target.x, piece.target.y);
      bannerPiece.setDisplaySize(piece.target.width, piece.target.height);
    }

    for (const [index, piece] of slotPieces.entries()) {
      const slotPiece = this.hudSlotPieces[index];
      if (!slotPiece) continue;

      slotPiece.setPosition(piece.target.x, piece.target.y);
      slotPiece.setDisplaySize(piece.target.width, piece.target.height);
    }

    for (const [index, item] of slotItems.entries()) {
      const slotItem = this.hudSlotItems[index];
      if (!slotItem) continue;

      slotItem.setPosition(item.target.x, item.target.y);
      slotItem.setDisplaySize(item.target.width, item.target.height);
    }

    this.hudSlotCursor?.setPosition(slotCursor.x, slotCursor.y);
    this.hudSlotCursor?.setDisplaySize(slotCursor.width, slotCursor.height);

    this.hudRoot.setScale(hudTransform.scale);
    this.hudRoot.setPosition(hudTransform.x, hudTransform.y);
  }
}
