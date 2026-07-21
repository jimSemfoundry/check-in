import { describe, expect, it } from 'vitest';
import {
  grassShapes,
  canPlaceGrassShape,
  getCanvasPointFromPointerEvent,
  getCenteredGrassShapeAnchor,
  getGrassCellOverlayFrame,
  getGrassFoamCells,
  getGrassPlacementPreviewCells,
  getGrassShapeCells,
  getGrassShapeForHudSlot,
  getGridCellFromWorldPoint,
  getGrassTerrainFrame,
  getGrassPlacementPreviewState,
  getToggledGrassSlotIndex,
  placeGrassPatch,
} from '../game/grassPlacement';

describe('grass placement model', () => {
  it('maps the first four HUD slots to grass shape templates and leaves the fifth empty', () => {
    expect(getGrassShapeForHudSlot(0)).toEqual({ key: 'one', width: 1, height: 1 });
    expect(getGrassShapeForHudSlot(1)).toEqual({ key: 'three-horizontal', width: 3, height: 1 });
    expect(getGrassShapeForHudSlot(2)).toEqual({ key: 'three-vertical', width: 1, height: 3 });
    expect(getGrassShapeForHudSlot(3)).toEqual({ key: 'nine', width: 3, height: 3 });
    expect(getGrassShapeForHudSlot(4)).toBeUndefined();
  });

  it('toggles grass slot selection off when selecting the active slot again', () => {
    expect(getToggledGrassSlotIndex(undefined, 0)).toBe(0);
    expect(getToggledGrassSlotIndex(1, 0)).toBe(0);
    expect(getToggledGrassSlotIndex(0, 0)).toBeUndefined();
    expect(getToggledGrassSlotIndex(0, 4)).toBeUndefined();
  });

  it('derives occupied cells for each rectangular grass shape from the anchor', () => {
    expect(getGrassShapeCells(grassShapes.one, { x: 2, y: 1 })).toEqual([{ x: 2, y: 1 }]);
    expect(getGrassShapeCells(grassShapes['three-horizontal'], { x: 2, y: 1 })).toEqual([
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ]);
    expect(getGrassShapeCells(grassShapes['three-vertical'], { x: 2, y: 1 })).toEqual([
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ]);
    expect(getGrassShapeCells(grassShapes.nine, { x: 1, y: 2 })).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
    ]);
  });

  it('uses the hovered grid cell as the center of the selected grass shape', () => {
    expect(getCenteredGrassShapeAnchor(grassShapes.one, { x: 5, y: 4 })).toEqual({ x: 5, y: 4 });
    expect(getCenteredGrassShapeAnchor(grassShapes['three-horizontal'], { x: 5, y: 4 })).toEqual({ x: 4, y: 4 });
    expect(getCenteredGrassShapeAnchor(grassShapes['three-vertical'], { x: 5, y: 4 })).toEqual({ x: 5, y: 3 });
    expect(getCenteredGrassShapeAnchor(grassShapes.nine, { x: 5, y: 4 })).toEqual({ x: 4, y: 3 });
  });

  it('allows placement only when the full grass shape fits inside the grid', () => {
    const grid = { columns: 6, rows: 6 };

    expect(canPlaceGrassShape({
      shape: grassShapes.nine,
      anchor: { x: 3, y: 3 },
      grid,
      occupiedCells: [],
    })).toBe(true);
    expect(canPlaceGrassShape({
      shape: grassShapes.nine,
      anchor: { x: 4, y: 3 },
      grid,
      occupiedCells: [],
    })).toBe(false);
    expect(canPlaceGrassShape({
      shape: grassShapes.nine,
      anchor: { x: 3, y: 4 },
      grid,
      occupiedCells: [],
    })).toBe(false);
    expect(canPlaceGrassShape({
      shape: grassShapes.one,
      anchor: { x: -1, y: 0 },
      grid,
      occupiedCells: [],
    })).toBe(false);
    expect(canPlaceGrassShape({
      shape: grassShapes.one,
      anchor: { x: 0, y: -1 },
      grid,
      occupiedCells: [],
    })).toBe(false);
  });

  it('rejects placement when any grass shape cell overlaps occupied cells', () => {
    expect(canPlaceGrassShape({
      shape: grassShapes['three-horizontal'],
      anchor: { x: 1, y: 1 },
      grid: { columns: 6, rows: 6 },
      occupiedCells: [{ x: 2, y: 1 }],
    })).toBe(false);
  });

  it('marks the placement preview as blocked when the selected grass overlaps planted grass', () => {
    expect(getGrassPlacementPreviewState({
      shape: grassShapes['three-horizontal'],
      anchor: { x: 1, y: 1 },
      grid: { columns: 6, rows: 6 },
      occupiedCells: [{ x: 2, y: 1 }],
    })).toBe('blocked');

    expect(getGrassPlacementPreviewState({
      shape: grassShapes['three-horizontal'],
      anchor: { x: 1, y: 1 },
      grid: { columns: 6, rows: 6 },
      occupiedCells: [{ x: 4, y: 1 }],
    })).toBe('placeable');
  });

  it('marks only overlapping preview cells as blocked and leaves the rest placeable', () => {
    expect(getGrassPlacementPreviewCells({
      shape: grassShapes['three-horizontal'],
      anchor: { x: 1, y: 1 },
      grid: { columns: 6, rows: 6 },
      occupiedCells: [{ x: 2, y: 1 }],
    })).toEqual([
      { cell: { x: 1, y: 1 }, state: 'placeable' },
      { cell: { x: 2, y: 1 }, state: 'blocked' },
      { cell: { x: 3, y: 1 }, state: 'placeable' },
    ]);
  });

  it('insets placement overlays only on outer grass edges so waves remain visible', () => {
    const cells = getGrassShapeCells(grassShapes['three-horizontal'], { x: 1, y: 1 });

    expect(getGrassCellOverlayFrame({
      cell: { x: 1, y: 1 },
      cells,
      tileSize: 64,
      edgeInset: 8,
    })).toEqual({
      offsetX: 4,
      offsetY: 0,
      width: 56,
      height: 48,
    });
    expect(getGrassCellOverlayFrame({
      cell: { x: 2, y: 1 },
      cells,
      tileSize: 64,
      edgeInset: 8,
    })).toEqual({
      offsetX: 0,
      offsetY: 0,
      width: 64,
      height: 48,
    });
  });

  it('selects only outer grass cells for water foam sprites', () => {
    expect(getGrassFoamCells(getGrassShapeCells(grassShapes.nine, { x: 1, y: 1 }))).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 2 },
      { x: 3, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ]);
  });

  it('adds a grass patch record with occupied cells when grass placement is valid', () => {
    const patches = placeGrassPatch({
      id: 'grass-1',
      shape: grassShapes['three-vertical'],
      anchor: { x: 4, y: 2 },
      grid: { columns: 6, rows: 6 },
      patches: [],
    });

    expect(patches).toEqual([
      {
        id: 'grass-1',
        shapeKey: 'three-vertical',
        anchor: { x: 4, y: 2 },
        cells: [
          { x: 4, y: 2 },
          { x: 4, y: 3 },
          { x: 4, y: 4 },
        ],
      },
    ]);
  });

  it('returns the original grass patch list when placement is invalid', () => {
    const patches = [
      {
        id: 'existing',
        shapeKey: 'one' as const,
        anchor: { x: 0, y: 0 },
        cells: [{ x: 0, y: 0 }],
      },
    ];

    expect(placeGrassPatch({
      id: 'blocked',
      shape: grassShapes.nine,
      anchor: { x: 0, y: 0 },
      grid: { columns: 6, rows: 6 },
      patches,
    })).toBe(patches);
  });

  it('allows grass placement without adjacency to existing grass', () => {
    const patches = placeGrassPatch({
      id: 'first',
      shape: grassShapes.one,
      anchor: { x: 0, y: 0 },
      grid: { columns: 12, rows: 8 },
      patches: [],
    });

    expect(placeGrassPatch({
      id: 'far-away',
      shape: grassShapes.one,
      anchor: { x: 10, y: 7 },
      grid: { columns: 12, rows: 8 },
      patches,
    })).toHaveLength(2);
  });

  it('selects terrain frames from neighboring occupied grass cells', () => {
    const occupiedCells = getGrassShapeCells(grassShapes.nine, { x: 1, y: 1 });

    expect(getGrassTerrainFrame({ cell: { x: 1, y: 1 }, occupiedCells })).toBe(0);
    expect(getGrassTerrainFrame({ cell: { x: 2, y: 1 }, occupiedCells })).toBe(1);
    expect(getGrassTerrainFrame({ cell: { x: 3, y: 1 }, occupiedCells })).toBe(2);
    expect(getGrassTerrainFrame({ cell: { x: 1, y: 2 }, occupiedCells })).toBe(9);
    expect(getGrassTerrainFrame({ cell: { x: 2, y: 2 }, occupiedCells })).toBe(10);
    expect(getGrassTerrainFrame({ cell: { x: 3, y: 2 }, occupiedCells })).toBe(11);
    expect(getGrassTerrainFrame({ cell: { x: 1, y: 3 }, occupiedCells })).toBe(18);
    expect(getGrassTerrainFrame({ cell: { x: 2, y: 3 }, occupiedCells })).toBe(19);
    expect(getGrassTerrainFrame({ cell: { x: 3, y: 3 }, occupiedCells })).toBe(20);
  });

  it('uses strip and single-cell frames when grass is one tile wide or tall', () => {
    expect(getGrassTerrainFrame({
      cell: { x: 0, y: 0 },
      occupiedCells: [{ x: 0, y: 0 }],
    })).toBe(30);
    expect(getGrassTerrainFrame({
      cell: { x: 1, y: 0 },
      occupiedCells: getGrassShapeCells(grassShapes['three-horizontal'], { x: 0, y: 0 }),
    })).toBe(28);
    expect(getGrassTerrainFrame({
      cell: { x: 0, y: 1 },
      occupiedCells: getGrassShapeCells(grassShapes['three-vertical'], { x: 0, y: 0 }),
    })).toBe(12);
  });

  it('converts world points inside the grass grid to grid cells', () => {
    expect(getGridCellFromWorldPoint({
      point: { x: -191, y: -191 },
      gridLeft: -192,
      gridTop: -192,
      tileSize: 64,
      grid: { columns: 6, rows: 6 },
    })).toEqual({ x: 0, y: 0 });
    expect(getGridCellFromWorldPoint({
      point: { x: 191, y: 191 },
      gridLeft: -192,
      gridTop: -192,
      tileSize: 64,
      grid: { columns: 6, rows: 6 },
    })).toEqual({ x: 5, y: 5 });
    expect(getGridCellFromWorldPoint({
      point: { x: 192, y: 0 },
      gridLeft: -192,
      gridTop: -192,
      tileSize: 64,
      grid: { columns: 6, rows: 6 },
    })).toBeUndefined();
  });

  it('uses DOM event coordinates to derive canvas points instead of stale Phaser pointer coordinates', () => {
    expect(getCanvasPointFromPointerEvent({
      clientPoint: { x: 640, y: 300 },
      canvasRect: { left: 0, top: 0, width: 1280, height: 720 },
      canvasSize: { width: 1280, height: 720 },
    })).toEqual({ x: 640, y: 300 });

    expect(getCanvasPointFromPointerEvent({
      clientPoint: { x: 640, y: 300 },
      canvasRect: { left: 100, top: 200, width: 640, height: 360 },
      canvasSize: { width: 1280, height: 720 },
    })).toEqual({ x: 1080, y: 200 });
  });
});
