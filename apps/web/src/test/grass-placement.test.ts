import { describe, expect, it } from 'vitest';
import {
  grassShapes,
  canPlaceGrassShape,
  getCanvasPointFromPointerEvent,
  getCenteredGrassShapeAnchor,
  getGrassCellOverlayFrame,
  getGrassFoamCells,
  getGrassMapCells,
  getGrassPlacementPreviewCells,
  getGrassShapeCells,
  getGrassShapeForHudSlot,
  getIslandTerrainPieces,
  getSecondLayerTerrainPieces,
  getTerrainToolForHudSlot,
  getGridCellFromWorldPoint,
  getGrassTerrainFrame,
  getGrassPlacementPreviewState,
  getToggledGrassSlotIndex,
  placeGrassPatch,
  placeSecondLayerPatch,
} from '../game/grassPlacement';

describe('grass placement model', () => {
  it('maps the first four HUD slots to grass shape templates and leaves the fifth empty', () => {
    expect(getGrassShapeForHudSlot(0)).toEqual({ key: 'one', width: 1, height: 1 });
    expect(getGrassShapeForHudSlot(1)).toEqual({ key: 'three-horizontal', width: 3, height: 1 });
    expect(getGrassShapeForHudSlot(2)).toEqual({ key: 'three-vertical', width: 1, height: 3 });
    expect(getGrassShapeForHudSlot(3)).toEqual({ key: 'nine', width: 3, height: 3 });
    expect(getGrassShapeForHudSlot(4)).toBeUndefined();
  });

  it('maps the eight HUD slots to base and second layer terrain tools', () => {
    expect(getTerrainToolForHudSlot(0)).toEqual({ layer: 'base', shape: grassShapes.one });
    expect(getTerrainToolForHudSlot(1)).toEqual({ layer: 'base', shape: grassShapes['three-horizontal'] });
    expect(getTerrainToolForHudSlot(2)).toEqual({ layer: 'base', shape: grassShapes['three-vertical'] });
    expect(getTerrainToolForHudSlot(3)).toEqual({ layer: 'base', shape: grassShapes.nine });
    expect(getTerrainToolForHudSlot(4)).toEqual({ layer: 'second', shape: grassShapes.one });
    expect(getTerrainToolForHudSlot(5)).toEqual({ layer: 'second', shape: grassShapes['three-horizontal'] });
    expect(getTerrainToolForHudSlot(6)).toEqual({ layer: 'second', shape: grassShapes['three-vertical'] });
    expect(getTerrainToolForHudSlot(7)).toEqual({ layer: 'second', shape: grassShapes.nine });
    expect(getTerrainToolForHudSlot(8)).toBeUndefined();
  });

  it('toggles visible terrain slot selection off when selecting the active slot again', () => {
    expect(getToggledGrassSlotIndex(undefined, 0)).toBe(0);
    expect(getToggledGrassSlotIndex(1, 0)).toBe(0);
    expect(getToggledGrassSlotIndex(0, 0)).toBeUndefined();
    expect(getToggledGrassSlotIndex(0, 4)).toBe(4);
    expect(getToggledGrassSlotIndex(4, 4)).toBeUndefined();
    expect(getToggledGrassSlotIndex(4, 7)).toBe(7);
    expect(getToggledGrassSlotIndex(7, 8)).toBeUndefined();
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

  it('keeps a four cell full-row and full-column map margin around planted grass', () => {
    const occupiedCells = getGrassShapeCells(grassShapes.nine, { x: 0, y: 2 });

    expect(getGrassMapCells({
      grid: { columns: 12, rows: 8 },
      occupiedCells,
      marginCells: 4,
    })).toEqual(buildTestCells(-4, 11, -2, 8));
  });

  it('expands the base map rectangle with the same margin after planting outside the original grid', () => {
    expect(getGrassMapCells({
      grid: { columns: 3, rows: 2 },
      occupiedCells: [{ x: -1, y: 0 }],
      marginCells: 4,
    })).toEqual(buildTestCells(-5, 3, -4, 4));
  });

  it('uses dynamic available cells to accept points and placement outside the original grid', () => {
    const availableCells = [{ x: -1, y: 0 }];

    expect(getGridCellFromWorldPoint({
      point: { x: -1, y: 1 },
      gridLeft: 0,
      gridTop: 0,
      tileSize: 64,
      grid: { columns: 2, rows: 2 },
      availableCells,
    })).toEqual({ x: -1, y: 0 });
    expect(canPlaceGrassShape({
      shape: grassShapes.one,
      anchor: { x: -1, y: 0 },
      grid: { columns: 2, rows: 2 },
      occupiedCells: [],
      availableCells,
    })).toBe(true);
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

  it('places second-layer patches only on existing base grass', () => {
    const baseCells = getGrassShapeCells(grassShapes.nine, { x: 1, y: 1 });
    const patches = placeSecondLayerPatch({
      id: 'second-1',
      shape: grassShapes['three-horizontal'],
      anchor: { x: 1, y: 2 },
      grid: { columns: 6, rows: 6 },
      patches: [],
      baseCells,
    });

    expect(patches).toEqual([
      {
        id: 'second-1',
        shapeKey: 'three-horizontal',
        anchor: { x: 1, y: 2 },
        cells: [
          { x: 1, y: 2 },
          { x: 2, y: 2 },
          { x: 3, y: 2 },
        ],
      },
    ]);
    expect(placeSecondLayerPatch({
      id: 'off-base',
      shape: grassShapes['three-horizontal'],
      anchor: { x: 0, y: 0 },
      grid: { columns: 6, rows: 6 },
      patches,
      baseCells,
    })).toBe(patches);
  });

  it('lets a second-layer brush overlap existing second-layer cells and adds only new cells', () => {
    const baseCells = buildTestCells(1, 3, 1, 4);
    const patches = placeSecondLayerPatch({
      id: 'second-1',
      shape: grassShapes['three-vertical'],
      anchor: { x: 2, y: 1 },
      grid: { columns: 6, rows: 6 },
      patches: [],
      baseCells,
    });

    expect(placeSecondLayerPatch({
      id: 'second-2',
      shape: grassShapes['three-vertical'],
      anchor: { x: 2, y: 2 },
      grid: { columns: 6, rows: 6 },
      patches,
      baseCells,
    })).toEqual([
      {
        id: 'second-1',
        shapeKey: 'three-vertical',
        anchor: { x: 2, y: 1 },
        cells: [
          { x: 2, y: 1 },
          { x: 2, y: 2 },
          { x: 2, y: 3 },
        ],
      },
      {
        id: 'second-2',
        shapeKey: 'three-vertical',
        anchor: { x: 2, y: 2 },
        cells: [
          { x: 2, y: 4 },
        ],
      },
    ]);
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

  it('renders first-layer 3x3 islands with rocks attached below the grass body', () => {
    expect(getIslandTerrainPieces({
      occupiedCells: getGrassShapeCells(grassShapes.nine, { x: 4, y: 2 }),
    })).toEqual([
      { cell: { x: 4, y: 5 }, frame: 41, surface: 'rock' },
      { cell: { x: 5, y: 5 }, frame: 42, surface: 'rock' },
      { cell: { x: 6, y: 5 }, frame: 43, surface: 'rock' },
      { cell: { x: 4, y: 6 }, frame: 50, surface: 'rock' },
      { cell: { x: 5, y: 6 }, frame: 51, surface: 'rock' },
      { cell: { x: 6, y: 6 }, frame: 52, surface: 'rock' },
      { cell: { x: 4, y: 2 }, frame: 5, surface: 'grass' },
      { cell: { x: 5, y: 2 }, frame: 6, surface: 'grass' },
      { cell: { x: 6, y: 2 }, frame: 7, surface: 'grass' },
      { cell: { x: 4, y: 3 }, frame: 14, surface: 'grass' },
      { cell: { x: 5, y: 3 }, frame: 15, surface: 'grass' },
      { cell: { x: 6, y: 3 }, frame: 16, surface: 'grass' },
      { cell: { x: 4, y: 4 }, frame: 23, surface: 'grass' },
      { cell: { x: 5, y: 4 }, frame: 24, surface: 'grass' },
      { cell: { x: 6, y: 4 }, frame: 25, surface: 'grass' },
    ]);
  });

  it('renders second-layer 1x1 as the finished single grass tile with narrow rock height', () => {
    expect(getSecondLayerTerrainPieces({
      occupiedCells: [{ x: 2, y: 3 }],
    })).toEqual([
      { cell: { x: 2, y: 4 }, frame: 53, surface: 'rock' },
      { cell: { x: 2, y: 3 }, frame: 35, surface: 'grass' },
    ]);
  });

  it('renders second-layer horizontal 1x3 as the finished front strip with wide rock height', () => {
    expect(getSecondLayerTerrainPieces({
      occupiedCells: getGrassShapeCells(grassShapes['three-horizontal'], { x: 2, y: 3 }),
    })).toEqual([
      { cell: { x: 2, y: 4 }, frame: 50, surface: 'rock' },
      { cell: { x: 3, y: 4 }, frame: 51, surface: 'rock' },
      { cell: { x: 4, y: 4 }, frame: 52, surface: 'rock' },
      { cell: { x: 2, y: 3 }, frame: 32, surface: 'grass' },
      { cell: { x: 3, y: 3 }, frame: 33, surface: 'grass' },
      { cell: { x: 4, y: 3 }, frame: 34, surface: 'grass' },
    ]);
  });

  it('renders second-layer vertical 1x3 as the tall strip, front tile, and narrow rock height', () => {
    expect(getSecondLayerTerrainPieces({
      occupiedCells: getGrassShapeCells(grassShapes['three-vertical'], { x: 2, y: 3 }),
    })).toEqual([
      { cell: { x: 2, y: 7 }, frame: 53, surface: 'rock' },
      { cell: { x: 2, y: 3 }, frame: 8, surface: 'grass' },
      { cell: { x: 2, y: 4 }, frame: 17, surface: 'grass' },
      { cell: { x: 2, y: 5 }, frame: 26, surface: 'grass' },
      { cell: { x: 2, y: 6 }, frame: 35, surface: 'grass' },
    ]);
  });

  it('renders second-layer 3x3 as the large block, front strip, and wide rock height', () => {
    expect(getSecondLayerTerrainPieces({
      occupiedCells: getGrassShapeCells(grassShapes.nine, { x: 2, y: 3 }),
    })).toEqual([
      { cell: { x: 2, y: 7 }, frame: 50, surface: 'rock' },
      { cell: { x: 3, y: 7 }, frame: 51, surface: 'rock' },
      { cell: { x: 4, y: 7 }, frame: 52, surface: 'rock' },
      { cell: { x: 2, y: 3 }, frame: 5, surface: 'grass' },
      { cell: { x: 3, y: 3 }, frame: 6, surface: 'grass' },
      { cell: { x: 4, y: 3 }, frame: 7, surface: 'grass' },
      { cell: { x: 2, y: 4 }, frame: 14, surface: 'grass' },
      { cell: { x: 3, y: 4 }, frame: 15, surface: 'grass' },
      { cell: { x: 4, y: 4 }, frame: 16, surface: 'grass' },
      { cell: { x: 2, y: 5 }, frame: 23, surface: 'grass' },
      { cell: { x: 3, y: 5 }, frame: 24, surface: 'grass' },
      { cell: { x: 4, y: 5 }, frame: 25, surface: 'grass' },
      { cell: { x: 2, y: 6 }, frame: 32, surface: 'grass' },
      { cell: { x: 3, y: 6 }, frame: 33, surface: 'grass' },
      { cell: { x: 4, y: 6 }, frame: 34, surface: 'grass' },
    ]);
  });

  it('draws generated front faces after connected top surfaces so stacked pieces merge at the seam', () => {
    const pieces = getSecondLayerTerrainPieces({
      occupiedCells: getGrassShapeCells(grassShapes.nine, { x: 2, y: 3 }),
    });
    const frontIndex = pieces.findIndex((piece) => piece.frame === 32);
    const bottomTopIndex = pieces.findIndex((piece) => (
      piece.cell.x === 2 && piece.cell.y === 5 && piece.frame === 23
    ));

    expect(frontIndex).toBeGreaterThan(-1);
    expect(bottomTopIndex).toBeGreaterThan(-1);
    expect(frontIndex).toBeGreaterThan(bottomTopIndex);
  });

  it('merges stacked second-layer 3x3 and horizontal 1x3 before choosing outer edges', () => {
    expect(getSecondLayerTerrainPieces({
      occupiedCells: [
        ...getGrassShapeCells(grassShapes.nine, { x: 2, y: 3 }),
        ...getGrassShapeCells(grassShapes['three-horizontal'], { x: 2, y: 6 }),
      ],
    })).toEqual([
      { cell: { x: 2, y: 8 }, frame: 50, surface: 'rock' },
      { cell: { x: 3, y: 8 }, frame: 51, surface: 'rock' },
      { cell: { x: 4, y: 8 }, frame: 52, surface: 'rock' },
      { cell: { x: 2, y: 3 }, frame: 5, surface: 'grass' },
      { cell: { x: 3, y: 3 }, frame: 6, surface: 'grass' },
      { cell: { x: 4, y: 3 }, frame: 7, surface: 'grass' },
      { cell: { x: 2, y: 4 }, frame: 14, surface: 'grass' },
      { cell: { x: 3, y: 4 }, frame: 15, surface: 'grass' },
      { cell: { x: 4, y: 4 }, frame: 16, surface: 'grass' },
      { cell: { x: 2, y: 5 }, frame: 14, surface: 'grass' },
      { cell: { x: 3, y: 5 }, frame: 15, surface: 'grass' },
      { cell: { x: 4, y: 5 }, frame: 16, surface: 'grass' },
      { cell: { x: 2, y: 6 }, frame: 23, surface: 'grass' },
      { cell: { x: 3, y: 6 }, frame: 24, surface: 'grass' },
      { cell: { x: 4, y: 6 }, frame: 25, surface: 'grass' },
      { cell: { x: 2, y: 7 }, frame: 32, surface: 'grass' },
      { cell: { x: 3, y: 7 }, frame: 33, surface: 'grass' },
      { cell: { x: 4, y: 7 }, frame: 34, surface: 'grass' },
    ]);
  });

  it('merges stacked second-layer vertical 1x3 and 1x1 before choosing outer edges', () => {
    expect(getSecondLayerTerrainPieces({
      occupiedCells: [
        ...getGrassShapeCells(grassShapes['three-vertical'], { x: 2, y: 3 }),
        { x: 2, y: 6 },
      ],
    })).toEqual([
      { cell: { x: 2, y: 8 }, frame: 53, surface: 'rock' },
      { cell: { x: 2, y: 3 }, frame: 8, surface: 'grass' },
      { cell: { x: 2, y: 4 }, frame: 17, surface: 'grass' },
      { cell: { x: 2, y: 5 }, frame: 17, surface: 'grass' },
      { cell: { x: 2, y: 6 }, frame: 26, surface: 'grass' },
      { cell: { x: 2, y: 7 }, frame: 35, surface: 'grass' },
    ]);
  });

  it('deduplicates overlapping second-layer brush cells before choosing merged frames', () => {
    expect(getSecondLayerTerrainPieces({
      occupiedCells: [
        ...getGrassShapeCells(grassShapes['three-vertical'], { x: 2, y: 3 }),
        ...getGrassShapeCells(grassShapes['three-vertical'], { x: 2, y: 4 }),
      ],
    })).toEqual([
      { cell: { x: 2, y: 8 }, frame: 53, surface: 'rock' },
      { cell: { x: 2, y: 3 }, frame: 8, surface: 'grass' },
      { cell: { x: 2, y: 4 }, frame: 17, surface: 'grass' },
      { cell: { x: 2, y: 5 }, frame: 17, surface: 'grass' },
      { cell: { x: 2, y: 6 }, frame: 26, surface: 'grass' },
      { cell: { x: 2, y: 7 }, frame: 35, surface: 'grass' },
    ]);
  });

  it('connects adjacent second-layer cells across separate placements before choosing frames', () => {
    expect(getSecondLayerTerrainPieces({
      occupiedCells: [
        { x: 2, y: 3 },
        { x: 3, y: 3 },
      ],
    })).toEqual([
      { cell: { x: 2, y: 4 }, frame: 50, surface: 'rock' },
      { cell: { x: 3, y: 4 }, frame: 52, surface: 'rock' },
      { cell: { x: 2, y: 3 }, frame: 32, surface: 'grass' },
      { cell: { x: 3, y: 3 }, frame: 34, surface: 'grass' },
    ]);
  });

  it('keeps separate second-layer placements independent across generated rock height', () => {
    const pieces = getSecondLayerTerrainPieces({
      occupiedCells: [
        ...getGrassShapeCells(grassShapes['three-horizontal'], { x: 2, y: 1 }),
        ...getGrassShapeCells(grassShapes.nine, { x: 2, y: 3 }),
      ],
    });

    expect(pieces).toEqual(expect.arrayContaining([
      { cell: { x: 2, y: 2 }, frame: 50, surface: 'rock' },
      { cell: { x: 3, y: 2 }, frame: 51, surface: 'rock' },
      { cell: { x: 4, y: 2 }, frame: 52, surface: 'rock' },
      { cell: { x: 2, y: 3 }, frame: 5, surface: 'grass' },
      { cell: { x: 3, y: 3 }, frame: 6, surface: 'grass' },
      { cell: { x: 4, y: 3 }, frame: 7, surface: 'grass' },
      { cell: { x: 2, y: 7 }, frame: 50, surface: 'rock' },
      { cell: { x: 3, y: 7 }, frame: 51, surface: 'rock' },
      { cell: { x: 4, y: 7 }, frame: 52, surface: 'rock' },
    ]));
  });

  it('keeps second-layer vertical strip edges independent from base grass beside it', () => {
    const placement = {
      occupiedCells: getGrassShapeCells(grassShapes['three-vertical'], { x: 2, y: 3 }),
      baseCells: [
        ...getGrassShapeCells(grassShapes['three-vertical'], { x: 2, y: 3 }),
        ...getGrassShapeCells(grassShapes['three-vertical'], { x: 3, y: 3 }),
      ],
    } as Parameters<typeof getSecondLayerTerrainPieces>[0] & { baseCells: Array<{ x: number; y: number }> };

    expect(getSecondLayerTerrainPieces(placement)).toEqual([
      { cell: { x: 2, y: 7 }, frame: 53, surface: 'rock' },
      { cell: { x: 2, y: 3 }, frame: 8, surface: 'grass' },
      { cell: { x: 2, y: 4 }, frame: 17, surface: 'grass' },
      { cell: { x: 2, y: 5 }, frame: 26, surface: 'grass' },
      { cell: { x: 2, y: 6 }, frame: 35, surface: 'grass' },
    ]);
  });

  it('keeps second-layer 3x3 edges independent from base grass beside it', () => {
    const placement = {
      occupiedCells: getGrassShapeCells(grassShapes.nine, { x: 2, y: 3 }),
      baseCells: [
        ...getGrassShapeCells(grassShapes.nine, { x: 2, y: 3 }),
        ...getGrassShapeCells(grassShapes['three-vertical'], { x: 5, y: 3 }),
      ],
    } as Parameters<typeof getSecondLayerTerrainPieces>[0] & { baseCells: Array<{ x: number; y: number }> };
    const pieces = getSecondLayerTerrainPieces(placement);

    expect(pieces).toEqual(expect.arrayContaining([
      { cell: { x: 4, y: 3 }, frame: 7, surface: 'grass' },
      { cell: { x: 4, y: 4 }, frame: 16, surface: 'grass' },
      { cell: { x: 4, y: 5 }, frame: 25, surface: 'grass' },
      { cell: { x: 4, y: 6 }, frame: 34, surface: 'grass' },
    ]));
  });

  it('renders generated front and rock only below the lower edge of a tall second-layer column', () => {
    expect(getSecondLayerTerrainPieces({
      occupiedCells: [
        { x: 2, y: 3 },
        { x: 2, y: 4 },
      ],
    })).toEqual([
      { cell: { x: 2, y: 6 }, frame: 53, surface: 'rock' },
      { cell: { x: 2, y: 3 }, frame: 8, surface: 'grass' },
      { cell: { x: 2, y: 4 }, frame: 26, surface: 'grass' },
      { cell: { x: 2, y: 5 }, frame: 35, surface: 'grass' },
    ]);
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

function buildTestCells(startX: number, endX: number, startY: number, endY: number) {
  return Array.from({ length: endY - startY + 1 }, (_rowValue, row) =>
    Array.from({ length: endX - startX + 1 }, (_columnValue, column) => ({
      x: startX + column,
      y: startY + row,
    })),
  ).flat();
}
