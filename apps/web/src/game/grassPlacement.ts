export type GridCell = {
  x: number;
  y: number;
};

export type GrassShapeKey = 'one' | 'three-horizontal' | 'three-vertical' | 'nine';

export type GrassShape = {
  key: GrassShapeKey;
  width: number;
  height: number;
};

export type GridSize = {
  columns: number;
  rows: number;
};

export type GrassPatch = {
  id: string;
  shapeKey: GrassShapeKey;
  anchor: GridCell;
  cells: GridCell[];
};

export type GrassPlacementPreviewCellState = 'placeable' | 'blocked';

const grassTerrainFramesByOpenEdgeMask: Record<number, number> = {
  0: 10,
  1: 1,
  2: 11,
  3: 2,
  4: 19,
  5: 28,
  6: 20,
  7: 29,
  8: 9,
  9: 0,
  10: 12,
  11: 3,
  12: 18,
  13: 27,
  14: 21,
  15: 30,
};

export const grassShapes: Record<GrassShapeKey, GrassShape> = {
  one: { key: 'one', width: 1, height: 1 },
  'three-horizontal': { key: 'three-horizontal', width: 3, height: 1 },
  'three-vertical': { key: 'three-vertical', width: 1, height: 3 },
  nine: { key: 'nine', width: 3, height: 3 },
};

const hudSlotGrassShapes: Array<GrassShape | undefined> = [
  grassShapes.one,
  grassShapes['three-horizontal'],
  grassShapes['three-vertical'],
  grassShapes.nine,
  undefined,
];

export function getGrassShapeForHudSlot(slotIndex: number | undefined) {
  if (slotIndex === undefined) return undefined;

  return hudSlotGrassShapes[slotIndex];
}

export function getToggledGrassSlotIndex(
  currentSlotIndex: number | undefined,
  nextSlotIndex: number,
) {
  if (!getGrassShapeForHudSlot(nextSlotIndex)) return undefined;
  if (currentSlotIndex === nextSlotIndex) return undefined;

  return nextSlotIndex;
}

export function getGrassShapeCells(shape: GrassShape, anchor: GridCell) {
  return Array.from({ length: shape.height }, (_rowValue, row) =>
    Array.from({ length: shape.width }, (_columnValue, column) => ({
      x: anchor.x + column,
      y: anchor.y + row,
    })),
  ).flat();
}

export function getCenteredGrassShapeAnchor(shape: GrassShape, center: GridCell) {
  return {
    x: center.x - Math.floor(shape.width / 2),
    y: center.y - Math.floor(shape.height / 2),
  };
}

export function canPlaceGrassShape(args: {
  shape: GrassShape;
  anchor: GridCell;
  grid: GridSize;
  occupiedCells: GridCell[];
  availableCells?: GridCell[];
}) {
  const cells = getGrassShapeCells(args.shape, args.anchor);
  const occupied = new Set(args.occupiedCells.map((cell) => `${cell.x},${cell.y}`));
  const available = args.availableCells
    ? new Set(args.availableCells.map((cell) => `${cell.x},${cell.y}`))
    : undefined;

  return cells.every((cell) => (
    (available
      ? available.has(`${cell.x},${cell.y}`)
      : cell.x >= 0
        && cell.y >= 0
        && cell.x < args.grid.columns
        && cell.y < args.grid.rows)
    && !occupied.has(`${cell.x},${cell.y}`)
  ));
}

export function getGrassPlacementPreviewState(args: {
  shape: GrassShape;
  anchor: GridCell;
  grid: GridSize;
  occupiedCells: GridCell[];
  availableCells?: GridCell[];
}) {
  return canPlaceGrassShape(args) ? 'placeable' : 'blocked';
}

export function getGrassPlacementPreviewCells(args: {
  shape: GrassShape;
  anchor: GridCell;
  grid: GridSize;
  occupiedCells: GridCell[];
  availableCells?: GridCell[];
}) {
  const occupied = new Set(args.occupiedCells.map((cell) => `${cell.x},${cell.y}`));
  const available = args.availableCells
    ? new Set(args.availableCells.map((cell) => `${cell.x},${cell.y}`))
    : undefined;

  return getGrassShapeCells(args.shape, args.anchor).map((cell) => {
    const isInsideGrid = available
      ? available.has(`${cell.x},${cell.y}`)
      : cell.x >= 0
        && cell.y >= 0
        && cell.x < args.grid.columns
        && cell.y < args.grid.rows;
    const state: GrassPlacementPreviewCellState = (
      isInsideGrid && !occupied.has(`${cell.x},${cell.y}`)
    ) ? 'placeable' : 'blocked';

    return { cell, state };
  });
}

export function getGrassCellOverlayFrame(args: {
  cell: GridCell;
  cells: GridCell[];
  tileSize: number;
  edgeInset: number;
}) {
  const cells = new Set(args.cells.map((cell) => `${cell.x},${cell.y}`));
  const hasTop = cells.has(`${args.cell.x},${args.cell.y - 1}`);
  const hasRight = cells.has(`${args.cell.x + 1},${args.cell.y}`);
  const hasBottom = cells.has(`${args.cell.x},${args.cell.y + 1}`);
  const hasLeft = cells.has(`${args.cell.x - 1},${args.cell.y}`);
  const leftInset = hasLeft ? 0 : args.edgeInset;
  const rightInset = hasRight ? 0 : args.edgeInset;
  const topInset = hasTop ? 0 : args.edgeInset;
  const bottomInset = hasBottom ? 0 : args.edgeInset;

  return {
    offsetX: (leftInset - rightInset) / 2,
    offsetY: (topInset - bottomInset) / 2,
    width: args.tileSize - leftInset - rightInset,
    height: args.tileSize - topInset - bottomInset,
  };
}

export function getGrassFoamCells(cells: GridCell[]) {
  const occupied = new Set(cells.map((cell) => `${cell.x},${cell.y}`));

  return cells.filter((cell) => (
    !occupied.has(`${cell.x},${cell.y - 1}`)
    || !occupied.has(`${cell.x + 1},${cell.y}`)
    || !occupied.has(`${cell.x},${cell.y + 1}`)
    || !occupied.has(`${cell.x - 1},${cell.y}`)
  ));
}

export function getNearestGrassExpansionCells(args: {
  occupiedCells: GridCell[];
  previewCells: GridCell[];
  grid: GridSize;
  distanceCells: number;
}) {
  if (args.occupiedCells.length === 0 || args.previewCells.length === 0) return [];

  const bounds = getCellsBounds(args.occupiedCells);
  const previewBounds = getCellsBounds(args.previewCells);
  const previewCenter = {
    x: (previewBounds.minX + previewBounds.maxX) / 2,
    y: (previewBounds.minY + previewBounds.maxY) / 2,
  };
  const sideDistances = [
    { side: 'left' as const, distance: Math.abs(previewCenter.x - bounds.minX) },
    { side: 'right' as const, distance: Math.abs(previewCenter.x - bounds.maxX) },
    { side: 'top' as const, distance: Math.abs(previewCenter.y - bounds.minY) },
    { side: 'bottom' as const, distance: Math.abs(previewCenter.y - bounds.maxY) },
  ];
  const nearestSide = sideDistances.reduce((nearest, side) => (
    side.distance < nearest.distance ? side : nearest
  )).side;

  if (nearestSide === 'left' || nearestSide === 'right') {
    const startX = nearestSide === 'left'
      ? bounds.minX - args.distanceCells
      : bounds.maxX + 1;
    const endX = nearestSide === 'left'
      ? bounds.minX - 1
      : bounds.maxX + args.distanceCells;

    return buildCellsInRange(startX, endX, bounds.minY, bounds.maxY);
  }

  const startY = nearestSide === 'top'
    ? bounds.minY - args.distanceCells
    : bounds.maxY + 1;
  const endY = nearestSide === 'top'
    ? bounds.minY - 1
    : bounds.maxY + args.distanceCells;

  return buildCellsInRange(bounds.minX, bounds.maxX, startY, endY);
}

function getCellsBounds(cells: GridCell[]) {
  return {
    minX: Math.min(...cells.map((cell) => cell.x)),
    maxX: Math.max(...cells.map((cell) => cell.x)),
    minY: Math.min(...cells.map((cell) => cell.y)),
    maxY: Math.max(...cells.map((cell) => cell.y)),
  };
}

function buildCellsInRange(startX: number, endX: number, startY: number, endY: number) {
  if (startX > endX || startY > endY) return [];

  return Array.from({ length: endY - startY + 1 }, (_rowValue, row) =>
    Array.from({ length: endX - startX + 1 }, (_columnValue, column) => ({
      x: startX + column,
      y: startY + row,
    })),
  ).flat();
}

export function placeGrassPatch(args: {
  id: string;
  shape: GrassShape;
  anchor: GridCell;
  grid: GridSize;
  patches: GrassPatch[];
  availableCells?: GridCell[];
}) {
  const occupiedCells = args.patches.flatMap((patch) => patch.cells);

  if (!canPlaceGrassShape({
    shape: args.shape,
    anchor: args.anchor,
    grid: args.grid,
    occupiedCells,
    availableCells: args.availableCells,
  })) {
    return args.patches;
  }

  return [
    ...args.patches,
    {
      id: args.id,
      shapeKey: args.shape.key,
      anchor: args.anchor,
      cells: getGrassShapeCells(args.shape, args.anchor),
    },
  ];
}

export function getGrassTerrainFrame(args: {
  cell: GridCell;
  occupiedCells: GridCell[];
}) {
  const occupied = new Set(args.occupiedCells.map((cell) => `${cell.x},${cell.y}`));
  const top = !occupied.has(`${args.cell.x},${args.cell.y - 1}`);
  const right = !occupied.has(`${args.cell.x + 1},${args.cell.y}`);
  const bottom = !occupied.has(`${args.cell.x},${args.cell.y + 1}`);
  const left = !occupied.has(`${args.cell.x - 1},${args.cell.y}`);
  const openEdgeMask = (top ? 1 : 0)
    | (right ? 2 : 0)
    | (bottom ? 4 : 0)
    | (left ? 8 : 0);

  return grassTerrainFramesByOpenEdgeMask[openEdgeMask];
}

export function getGridCellFromWorldPoint(args: {
  point: { x: number; y: number };
  gridLeft: number;
  gridTop: number;
  tileSize: number;
  grid: GridSize;
  availableCells?: GridCell[];
}) {
  const x = Math.floor((args.point.x - args.gridLeft) / args.tileSize);
  const y = Math.floor((args.point.y - args.gridTop) / args.tileSize);

  if (args.availableCells) {
    const available = new Set(args.availableCells.map((cell) => `${cell.x},${cell.y}`));
    return available.has(`${x},${y}`) ? { x, y } : undefined;
  }

  if (x < 0 || y < 0 || x >= args.grid.columns || y >= args.grid.rows) {
    return undefined;
  }

  return { x, y };
}

export function getCanvasPointFromPointerEvent(args: {
  clientPoint: { x: number; y: number };
  canvasRect: { left: number; top: number; width: number; height: number };
  canvasSize: { width: number; height: number };
}) {
  if (args.canvasRect.width <= 0 || args.canvasRect.height <= 0) {
    return undefined;
  }

  return {
    x: ((args.clientPoint.x - args.canvasRect.left) / args.canvasRect.width) * args.canvasSize.width,
    y: ((args.clientPoint.y - args.canvasRect.top) / args.canvasRect.height) * args.canvasSize.height,
  };
}
