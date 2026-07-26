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

export type TerrainLayerKey = 'base' | 'second';

export type TerrainTool = {
  layer: TerrainLayerKey;
  shape: GrassShape;
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
export type TerrainPieceSurface = 'grass' | 'rock';

export type TerrainPiece = {
  cell: GridCell;
  frame: number;
  surface: TerrainPieceSurface;
};

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

const secondLayerGrassFramesByOpenEdgeMask: Record<number, number> = {
  0: 15,
  1: 6,
  2: 16,
  3: 7,
  4: 24,
  5: 33,
  6: 25,
  7: 34,
  8: 14,
  9: 5,
  10: 17,
  11: 8,
  12: 23,
  13: 32,
  14: 26,
  15: 35,
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
];
const HUD_TERRAIN_SLOT_COUNT = 8;

export function getGrassShapeForHudSlot(slotIndex: number | undefined) {
  if (slotIndex === undefined) return undefined;

  return hudSlotGrassShapes[slotIndex];
}

export function getTerrainToolForHudSlot(slotIndex: number | undefined): TerrainTool | undefined {
  if (slotIndex === undefined || slotIndex < 0 || slotIndex >= HUD_TERRAIN_SLOT_COUNT) {
    return undefined;
  }

  const shapeIndex = slotIndex % hudSlotGrassShapes.length;
  const shape = hudSlotGrassShapes[shapeIndex];
  if (!shape) return undefined;

  return {
    layer: slotIndex < hudSlotGrassShapes.length ? 'base' : 'second',
    shape,
  };
}

export function getToggledGrassSlotIndex(
  currentSlotIndex: number | undefined,
  nextSlotIndex: number,
) {
  if (nextSlotIndex < 0 || nextSlotIndex >= HUD_TERRAIN_SLOT_COUNT) return undefined;
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

export function getGrassMapCells(args: {
  grid: GridSize;
  occupiedCells: GridCell[];
  marginCells?: number;
}) {
  const baseCells = buildCellsInRange(0, args.grid.columns - 1, 0, args.grid.rows - 1);
  const margin = args.marginCells ?? 0;
  const occupiedMarginCells = args.occupiedCells.flatMap((cell) => (
    buildCellsInRange(
      cell.x - margin,
      cell.x + margin,
      cell.y - margin,
      cell.y + margin,
    )
  ));
  const bounds = getCellsBounds([...baseCells, ...args.occupiedCells, ...occupiedMarginCells]);

  return buildCellsInRange(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
}

export function getNearestGrassExpansionCells(args: {
  occupiedCells: GridCell[];
  mapCells: GridCell[];
  previewCells: GridCell[];
  grid: GridSize;
  distanceCells: number;
}) {
  if (args.occupiedCells.length === 0 || args.previewCells.length === 0) return [];

  const bounds = getCellsBounds(args.occupiedCells);
  const mapBounds = getCellsBounds(args.mapCells);
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

    return buildCellsInRange(startX, endX, mapBounds.minY, mapBounds.maxY);
  }

  const startY = nearestSide === 'top'
    ? bounds.minY - args.distanceCells
    : bounds.maxY + 1;
  const endY = nearestSide === 'top'
    ? bounds.minY - 1
    : bounds.maxY + args.distanceCells;

  return buildCellsInRange(mapBounds.minX, mapBounds.maxX, startY, endY);
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

export function placeSecondLayerPatch(args: {
  id: string;
  shape: GrassShape;
  anchor: GridCell;
  grid: GridSize;
  patches: GrassPatch[];
  baseCells: GridCell[];
}) {
  return placeGrassPatch({
    id: args.id,
    shape: args.shape,
    anchor: args.anchor,
    grid: args.grid,
    patches: args.patches,
    availableCells: args.baseCells,
  });
}

export function getGrassTerrainFrame(args: {
  cell: GridCell;
  occupiedCells: GridCell[];
}) {
  return grassTerrainFramesByOpenEdgeMask[getOpenEdgeMask(args)];
}

export function getSecondLayerTerrainPieces(args: {
  occupiedCells: GridCell[];
}) {
  const occupiedCellKeys = new Set(args.occupiedCells.map(getCellKey));
  const bottomEdgeCells = [...args.occupiedCells]
    .filter((cell) => !occupiedCellKeys.has(getCellKey({ x: cell.x, y: cell.y + 1 })))
    .sort(compareCells);
  const firstPassHeightCells = getSecondLayerHeightCells({
    bottomEdgeCells,
    topConnectionCellKeys: occupiedCellKeys,
  });
  const generatedHeightCellKeys = new Set([
    ...firstPassHeightCells.frontEdgeCells,
    ...firstPassHeightCells.rockCells,
  ].map(getCellKey));
  const topConnectionCellKeys = new Set([
    ...occupiedCellKeys,
    ...generatedHeightCellKeys,
  ]);
  const { frontEdgeCells, rockCells } = getSecondLayerHeightCells({
    bottomEdgeCells,
    topConnectionCellKeys,
  });
  const grassPieces = [...args.occupiedCells]
    .sort(compareCells)
    .map((cell) => ({
      cell,
      frame: secondLayerGrassFramesByOpenEdgeMask[getOpenEdgeMask({
        cell,
        occupiedCells: args.occupiedCells,
      })],
      surface: 'grass' as const,
    }));

  return [
    ...getSecondLayerRockPieces(rockCells),
    ...grassPieces,
    ...getSecondLayerFrontPieces(frontEdgeCells),
  ];
}

function getSecondLayerHeightCells(args: {
  bottomEdgeCells: GridCell[];
  topConnectionCellKeys: Set<string>;
}) {
  const frontEdgeCells: GridCell[] = [];
  const rockCells: GridCell[] = [];

  for (const cell of args.bottomEdgeCells) {
    const hasTopConnection = args.topConnectionCellKeys.has(getCellKey({ x: cell.x, y: cell.y - 1 }));

    if (hasTopConnection) {
      frontEdgeCells.push({ x: cell.x, y: cell.y + 1 });
      rockCells.push({ x: cell.x, y: cell.y + 2 });
    } else {
      rockCells.push({ x: cell.x, y: cell.y + 1 });
    }
  }

  return { frontEdgeCells, rockCells };
}

function getSecondLayerFrontPieces(frontEdgeCells: GridCell[]): TerrainPiece[] {
  const rows = new Map<number, GridCell[]>();

  for (const cell of frontEdgeCells) {
    rows.set(cell.y, [...(rows.get(cell.y) ?? []), cell]);
  }

  return [...rows.entries()]
    .sort(([leftY], [rightY]) => leftY - rightY)
    .flatMap((entry) => getSecondLayerFrontRowPieces(entry[1].sort(compareCells)));
}

function getSecondLayerFrontRowPieces(rowCells: GridCell[]): TerrainPiece[] {
  const pieces: TerrainPiece[] = [];
  let segment: GridCell[] = [];

  for (const cell of rowCells) {
    const previousCell = segment[segment.length - 1];
    if (previousCell && cell.x !== previousCell.x + 1) {
      pieces.push(...getSecondLayerFrontSegmentPieces(segment));
      segment = [];
    }
    segment.push(cell);
  }

  return [...pieces, ...getSecondLayerFrontSegmentPieces(segment)];
}

function getSecondLayerFrontSegmentPieces(segment: GridCell[]): TerrainPiece[] {
  if (segment.length === 0) return [];

  return segment.map((cell, index) => {
    const frame = segment.length === 1
      ? 35
      : index === 0
        ? 32
        : index === segment.length - 1
          ? 34
          : 33;

    return {
      cell,
      frame,
      surface: 'grass' as const,
    };
  });
}

function getSecondLayerRockPieces(rockCells: GridCell[]): TerrainPiece[] {
  const rows = new Map<number, GridCell[]>();

  for (const cell of rockCells) {
    rows.set(cell.y, [...(rows.get(cell.y) ?? []), cell]);
  }

  return [...rows.entries()]
    .sort(([leftY], [rightY]) => leftY - rightY)
    .flatMap((entry) => getSecondLayerRockRowPieces(entry[1].sort(compareCells)));
}

function getSecondLayerRockRowPieces(rowCells: GridCell[]): TerrainPiece[] {
  const pieces: TerrainPiece[] = [];
  let segment: GridCell[] = [];

  for (const cell of rowCells) {
    const previousCell = segment[segment.length - 1];
    if (previousCell && cell.x !== previousCell.x + 1) {
      pieces.push(...getSecondLayerRockSegmentPieces(segment));
      segment = [];
    }
    segment.push(cell);
  }

  return [...pieces, ...getSecondLayerRockSegmentPieces(segment)];
}

function getSecondLayerRockSegmentPieces(segment: GridCell[]): TerrainPiece[] {
  if (segment.length === 0) return [];

  return segment.map((cell, index) => {
    const frame = segment.length === 1
      ? 44
      : index === 0
        ? 41
        : index === segment.length - 1
          ? 43
          : 42;

    return {
      cell,
      frame,
      surface: 'rock' as const,
    };
  });
}

function compareCells(left: GridCell, right: GridCell) {
  return left.y - right.y || left.x - right.x;
}

function getCellKey(cell: GridCell) {
  return `${cell.x},${cell.y}`;
}

function getOpenEdgeMask(args: {
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

  return openEdgeMask;
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
