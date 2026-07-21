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
}) {
  const cells = getGrassShapeCells(args.shape, args.anchor);
  const occupied = new Set(args.occupiedCells.map((cell) => `${cell.x},${cell.y}`));

  return cells.every((cell) => (
    cell.x >= 0
    && cell.y >= 0
    && cell.x < args.grid.columns
    && cell.y < args.grid.rows
    && !occupied.has(`${cell.x},${cell.y}`)
  ));
}

export function placeGrassPatch(args: {
  id: string;
  shape: GrassShape;
  anchor: GridCell;
  grid: GridSize;
  patches: GrassPatch[];
}) {
  const occupiedCells = args.patches.flatMap((patch) => patch.cells);

  if (!canPlaceGrassShape({
    shape: args.shape,
    anchor: args.anchor,
    grid: args.grid,
    occupiedCells,
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

export function getGridCellFromWorldPoint(args: {
  point: { x: number; y: number };
  gridLeft: number;
  gridTop: number;
  tileSize: number;
  grid: GridSize;
}) {
  const x = Math.floor((args.point.x - args.gridLeft) / args.tileSize);
  const y = Math.floor((args.point.y - args.gridTop) / args.tileSize);

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
