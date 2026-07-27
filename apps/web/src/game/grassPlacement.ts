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

export type TerrainShadowPiece = {
  cell: GridCell;
  widthCells: number;
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

const secondLayerFrontGrassFrames = new Set([32, 33, 34, 35]);
const secondLayerTallMaterialShapeKeys = new Set<GrassShapeKey>(['three-vertical', 'nine']);
const SECOND_LAYER_LOWER_FACE_OVERLAP_PIXELS = 12;
const SECOND_LAYER_TOP_FACE_DROP_PIXELS = 52;
const SECOND_LAYER_SHADOW_SOURCE_SIZE_PIXELS = 192;
const SECOND_LAYER_SHADOW_VISIBLE_WIDTH_PIXELS = 79;
const SECOND_LAYER_SHADOW_VISIBLE_TOP_PIXELS = 56;
const SECOND_LAYER_SHADOW_EXTRA_LIFT_CELLS = 1;

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
  return getGrassPlacementPreviewCellsFromCells({
    cells: getGrassShapeCells(args.shape, args.anchor),
    grid: args.grid,
    occupiedCells: args.occupiedCells,
    availableCells: args.availableCells,
  });
}

export function getGrassPlacementPreviewCellsFromCells(args: {
  cells: GridCell[];
  grid: GridSize;
  occupiedCells: GridCell[];
  availableCells?: GridCell[];
}) {
  const occupied = new Set(args.occupiedCells.map((cell) => `${cell.x},${cell.y}`));
  const available = args.availableCells
    ? new Set(args.availableCells.map((cell) => `${cell.x},${cell.y}`))
    : undefined;

  return args.cells.map((cell) => {
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

export function getVisibleGrassFoamCells(args: {
  baseCells: GridCell[];
  coveredCells: GridCell[];
}) {
  const coveredCellKeys = new Set(args.coveredCells.map(getCellKey));

  return getGrassFoamCells(args.baseCells).filter((cell) => !coveredCellKeys.has(getCellKey(cell)));
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
  blockedCells?: GridCell[];
  availableCells?: GridCell[];
}) {
  const occupiedCells = [
    ...args.patches.flatMap((patch) => patch.cells),
    ...(args.blockedCells ?? []),
  ];

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
  const cells = getGrassShapeCells(args.shape, args.anchor);
  const placementCells = getSecondLayerPlacementCells({ shape: args.shape, anchor: args.anchor });
  const baseCellKeys = new Set(args.baseCells.map(getCellKey));
  const occupiedCellKeys = new Set(args.patches.flatMap(getSecondLayerPatchPlacementCells).map(getCellKey));
  const isInsideBaseGrass = hasSecondLayerBaseSupport(args.shape, placementCells, baseCellKeys);
  const newCells = cells.filter((_cell, index) => !occupiedCellKeys.has(getCellKey(placementCells[index])));

  if (!isInsideBaseGrass || newCells.length === 0) return args.patches;

  return [
    ...args.patches,
    {
      id: args.id,
      shapeKey: args.shape.key,
      anchor: args.anchor,
      cells: newCells,
    },
  ];
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
  return getRaisedTerrainPieces(getSecondLayerMergedCells(args.occupiedCells), 'wall-only');
}

export function getSecondLayerPatchTerrainPieces(args: {
  patches: GrassPatch[];
}) {
  return dedupeTerrainPieces(args.patches.flatMap((patch) => {
    if (patch.shapeKey === 'three-vertical') {
      return getFixedSecondLayerVerticalPieces(patch.anchor);
    }

    if (patch.shapeKey === 'nine') {
      return getFixedSecondLayerNinePieces(patch.anchor);
    }

    return getSecondLayerTerrainPieces({ occupiedCells: patch.cells });
  }));
}

export function getSecondLayerPlacementCells(args: {
  shape: GrassShape;
  anchor: GridCell;
}) {
  return getGrassShapeCells(args.shape, args.anchor);
}

export function getSecondLayerPlacementPreviewCells(args: {
  shape: GrassShape;
  anchor: GridCell;
  grid: GridSize;
  occupiedCells: GridCell[];
  availableCells?: GridCell[];
}) {
  const cells = getSecondLayerPlacementCells({ shape: args.shape, anchor: args.anchor });
  const occupied = new Set(args.occupiedCells.map(getCellKey));
  const available = args.availableCells
    ? new Set(args.availableCells.map(getCellKey))
    : undefined;

  return cells.map((cell) => {
    const isInsideGrid = available
      ? getSecondLayerBaseSupportCandidates(args.shape, cell).some((candidate) => (
        available.has(getCellKey(candidate))
      ))
      : cell.x >= 0
        && cell.y >= 0
        && cell.x < args.grid.columns
        && cell.y < args.grid.rows;
    const state: GrassPlacementPreviewCellState = (
      isInsideGrid && !occupied.has(getCellKey(cell))
    ) ? 'placeable' : 'blocked';

    return { cell, state };
  });
}

export function getSecondLayerPatchPlacementCells(patch: GrassPatch) {
  return patch.cells;
}

export function getSecondLayerPlacementOverlayOffsetY(shape: GrassShape) {
  return secondLayerTallMaterialShapeKeys.has(shape.key) ? SECOND_LAYER_TOP_FACE_DROP_PIXELS : 0;
}

export function getSecondLayerPatchPlacementOverlayOffsetY(patch: GrassPatch) {
  return getSecondLayerPlacementOverlayOffsetY(grassShapes[patch.shapeKey]);
}

function hasSecondLayerBaseSupport(
  shape: GrassShape,
  placementCells: GridCell[],
  baseCellKeys: Set<string>,
) {
  if (placementCells.every((cell) => baseCellKeys.has(getCellKey(cell)))) {
    return true;
  }

  if (!secondLayerTallMaterialShapeKeys.has(shape.key)) {
    return false;
  }

  return placementCells.every((cell) => baseCellKeys.has(getCellKey({ x: cell.x, y: cell.y + 1 })));
}

function getSecondLayerBaseSupportCandidates(shape: GrassShape, cell: GridCell) {
  return secondLayerTallMaterialShapeKeys.has(shape.key)
    ? [cell, { x: cell.x, y: cell.y + 1 }]
    : [cell];
}

export function getSecondLayerMaterialReferenceTerrainPieces() {
  return [
    ...getFixedSecondLayerNinePieces({ x: 0, y: 0 }),
    ...getFixedSecondLayerVerticalPieces({ x: 4, y: 0 }),
  ];
}

export function getSecondLayerTerrainPieceRenderOffsetY(piece: Pick<TerrainPiece, 'frame' | 'surface'>) {
  if (piece.surface === 'rock' || secondLayerFrontGrassFrames.has(piece.frame)) {
    return -SECOND_LAYER_LOWER_FACE_OVERLAP_PIXELS;
  }

  return piece.surface === 'grass' ? SECOND_LAYER_TOP_FACE_DROP_PIXELS : 0;
}

export function getSecondLayerTerrainPieceRenderHeight(
  _piece: Pick<TerrainPiece, 'frame' | 'surface'>,
  tileSize: number,
) {
  void _piece;
  return tileSize;
}

export function getSecondLayerMergedCells(occupiedCells: GridCell[]) {
  const uniqueCells = getUniqueCells(occupiedCells);
  const columns = new Map<number, GridCell[]>();
  const bridgeCells: GridCell[] = [];

  for (const cell of uniqueCells) {
    columns.set(cell.x, [...(columns.get(cell.x) ?? []), cell]);
  }

  for (const columnCells of columns.values()) {
    const sortedColumnCells = [...columnCells].sort(compareCells);

    for (let index = 0; index < sortedColumnCells.length - 1; index += 1) {
      const topCell = sortedColumnCells[index];
      const lowerCell = sortedColumnCells[index + 1];
      const gap = lowerCell.y - topCell.y;

      if (gap <= 1 || gap > 3) continue;

      for (let y = topCell.y + 1; y < lowerCell.y; y += 1) {
        bridgeCells.push({ x: topCell.x, y });
      }
    }
  }

  return getUniqueCells([...uniqueCells, ...bridgeCells]).sort(compareCells);
}

function getFixedSecondLayerVerticalPieces(anchor: GridCell): TerrainPiece[] {
  return [
    { cell: { x: anchor.x, y: anchor.y + 4 }, frame: 44, surface: 'rock' },
    { cell: { x: anchor.x, y: anchor.y + 3 }, frame: 35, surface: 'grass' },
    { cell: { x: anchor.x, y: anchor.y }, frame: 8, surface: 'grass' },
    { cell: { x: anchor.x, y: anchor.y + 1 }, frame: 17, surface: 'grass' },
    { cell: { x: anchor.x, y: anchor.y + 2 }, frame: 26, surface: 'grass' },
  ];
}

function getFixedSecondLayerNinePieces(anchor: GridCell): TerrainPiece[] {
  return [
    { cell: { x: anchor.x, y: anchor.y + 4 }, frame: 41, surface: 'rock' },
    { cell: { x: anchor.x + 1, y: anchor.y + 4 }, frame: 42, surface: 'rock' },
    { cell: { x: anchor.x + 2, y: anchor.y + 4 }, frame: 43, surface: 'rock' },
    { cell: { x: anchor.x, y: anchor.y + 3 }, frame: 32, surface: 'grass' },
    { cell: { x: anchor.x + 1, y: anchor.y + 3 }, frame: 33, surface: 'grass' },
    { cell: { x: anchor.x + 2, y: anchor.y + 3 }, frame: 34, surface: 'grass' },
    { cell: { x: anchor.x, y: anchor.y }, frame: 5, surface: 'grass' },
    { cell: { x: anchor.x + 1, y: anchor.y }, frame: 6, surface: 'grass' },
    { cell: { x: anchor.x + 2, y: anchor.y }, frame: 7, surface: 'grass' },
    { cell: { x: anchor.x, y: anchor.y + 1 }, frame: 14, surface: 'grass' },
    { cell: { x: anchor.x + 1, y: anchor.y + 1 }, frame: 15, surface: 'grass' },
    { cell: { x: anchor.x + 2, y: anchor.y + 1 }, frame: 16, surface: 'grass' },
    { cell: { x: anchor.x, y: anchor.y + 2 }, frame: 23, surface: 'grass' },
    { cell: { x: anchor.x + 1, y: anchor.y + 2 }, frame: 24, surface: 'grass' },
    { cell: { x: anchor.x + 2, y: anchor.y + 2 }, frame: 25, surface: 'grass' },
  ];
}

function dedupeTerrainPieces(pieces: TerrainPiece[]) {
  const seenPieceKeys = new Set<string>();

  return pieces.filter((piece) => {
    const key = `${piece.surface}:${piece.frame}:${piece.cell.x}:${piece.cell.y}`;
    if (seenPieceKeys.has(key)) return false;
    seenPieceKeys.add(key);
    return true;
  });
}

export function getSecondLayerShadowPieces(args: {
  occupiedCells: GridCell[];
}): TerrainShadowPiece[] {
  const rockSourceCells = getRaisedTerrainRockSourceCells(
    getSecondLayerMergedCells(args.occupiedCells),
    'wall-only',
  );
  const shadowCells = rockSourceCells
    .map((cell) => ({ x: cell.x, y: cell.y + 2 }))
    .sort(compareCells);

  return getSecondLayerShadowRowPieces(shadowCells);
}

export function getSecondLayerShadowRenderSize(piece: TerrainShadowPiece, tileSize: number) {
  const visibleWidth = piece.widthCells * tileSize;
  const width = Math.round(
    visibleWidth * (SECOND_LAYER_SHADOW_SOURCE_SIZE_PIXELS / SECOND_LAYER_SHADOW_VISIBLE_WIDTH_PIXELS),
  );

  return {
    width,
    height: visibleWidth,
  };
}

export function getSecondLayerShadowRenderOffsetY(piece: TerrainShadowPiece, tileSize: number) {
  const { height } = getSecondLayerShadowRenderSize(piece, tileSize);
  const visibleTopFromCenter = (
    SECOND_LAYER_SHADOW_VISIBLE_TOP_PIXELS / SECOND_LAYER_SHADOW_SOURCE_SIZE_PIXELS - 0.5
  ) * height;
  const rockBottomFromShadowCenter = -tileSize / 2 - SECOND_LAYER_LOWER_FACE_OVERLAP_PIXELS;

  return Math.round(
    rockBottomFromShadowCenter
    - visibleTopFromCenter
    - tileSize * SECOND_LAYER_SHADOW_EXTRA_LIFT_CELLS,
  );
}

export function getIslandTerrainPieces(args: {
  occupiedCells: GridCell[];
}) {
  return getRaisedTerrainPieces(args.occupiedCells, 'full-island');
}

type RockProfile = 'bottom-only' | 'wall-only' | 'covered-wall' | 'full-island';
type RockRowType = 'wall' | 'bottom';

function getRaisedTerrainPieces(terrainCells: GridCell[], rockProfile: RockProfile = 'bottom-only') {
  const occupiedCells = getUniqueCells(terrainCells);
  const occupiedCellKeys = new Set(occupiedCells.map(getCellKey));
  const bottomEdgeCells = getRaisedTerrainBottomEdgeCells(occupiedCells);
  const frontSourceCellKeys = new Set(
    bottomEdgeCells
      .filter((cell) => occupiedCellKeys.has(getCellKey({ x: cell.x, y: cell.y - 1 })))
      .map(getCellKey),
  );
  const grassPieces = [...occupiedCells]
    .sort(compareCells)
    .map((cell) => ({
      cell,
      frame: secondLayerGrassFramesByOpenEdgeMask[
        getRaisedTerrainGrassOpenEdgeMask(cell, occupiedCellKeys, frontSourceCellKeys, rockProfile)
      ],
      surface: 'grass' as const,
    }));
  const shouldGenerateFrontCells = rockProfile === 'wall-only'
    || rockProfile === 'covered-wall'
    || rockProfile === 'bottom-only';
  const generatedFrontCells = shouldGenerateFrontCells
    ? getRaisedTerrainGeneratedFrontCells(bottomEdgeCells, occupiedCellKeys)
    : [];
  const rockSourceCells = getRockSourceCells(bottomEdgeCells, generatedFrontCells, occupiedCellKeys, rockProfile);
  const frontPieces = grassPieces.filter((piece) => secondLayerFrontGrassFrames.has(piece.frame));
  const topPieces = grassPieces.filter((piece) => !secondLayerFrontGrassFrames.has(piece.frame));

  return [
    ...getSecondLayerRockPieces(rockSourceCells, rockProfile),
    ...(shouldGenerateFrontCells ? getSecondLayerFrontPieces(generatedFrontCells) : []),
    ...frontPieces,
    ...topPieces,
  ];
}

function getRaisedTerrainGrassOpenEdgeMask(
  cell: GridCell,
  occupiedCellKeys: Set<string>,
  frontSourceCellKeys: Set<string>,
  rockProfile: RockProfile,
) {
  const openEdgeMask = getOpenEdgeMaskFromOccupiedCellKeys(cell, occupiedCellKeys);

  if (rockProfile !== 'wall-only' || !frontSourceCellKeys.has(getCellKey(cell))) {
    return openEdgeMask;
  }

  return openEdgeMask & ~4;
}

function getRaisedTerrainRockSourceCells(terrainCells: GridCell[], rockProfile: RockProfile) {
  const occupiedCells = getUniqueCells(terrainCells);
  const occupiedCellKeys = new Set(occupiedCells.map(getCellKey));
  const bottomEdgeCells = getRaisedTerrainBottomEdgeCells(occupiedCells);
  const generatedFrontCells = getRaisedTerrainGeneratedFrontCells(bottomEdgeCells, occupiedCellKeys);

  return getRockSourceCells(bottomEdgeCells, generatedFrontCells, occupiedCellKeys, rockProfile);
}

function getRaisedTerrainBottomEdgeCells(occupiedCells: GridCell[]) {
  const occupiedCellKeys = new Set(occupiedCells.map(getCellKey));

  return [...occupiedCells]
    .filter((cell) => !occupiedCellKeys.has(getCellKey({ x: cell.x, y: cell.y + 1 })))
    .sort(compareCells);
}

function getRaisedTerrainGeneratedFrontCells(bottomEdgeCells: GridCell[], occupiedCellKeys: Set<string>) {
  return bottomEdgeCells
    .filter((cell) => occupiedCellKeys.has(getCellKey({ x: cell.x, y: cell.y - 1 })))
    .map((cell) => ({ x: cell.x, y: cell.y + 1 }))
    .sort(compareCells);
}

function getRockSourceCells(
  bottomEdgeCells: GridCell[],
  generatedFrontCells: GridCell[],
  occupiedCellKeys: Set<string>,
  rockProfile: RockProfile,
) {
  const directRockSourceCells = bottomEdgeCells
    .filter((cell) => !occupiedCellKeys.has(getCellKey({ x: cell.x, y: cell.y - 1 })));

  return (rockProfile === 'full-island'
    ? bottomEdgeCells
    : [...directRockSourceCells, ...generatedFrontCells]
  ).sort(compareCells);
}

function getUniqueCells(cells: GridCell[]) {
  const seenCellKeys = new Set<string>();

  return cells.filter((cell) => {
    const key = getCellKey(cell);
    if (seenCellKeys.has(key)) return false;
    seenCellKeys.add(key);
    return true;
  });
}

function getSecondLayerFrontPieces(frontCells: GridCell[]): TerrainPiece[] {
  const rows = new Map<number, GridCell[]>();

  for (const cell of frontCells) {
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

function getSecondLayerRockPieces(
  bottomEdgeCells: GridCell[],
  rockProfile: RockProfile,
): TerrainPiece[] {
  const rows = new Map<number, GridCell[]>();
  const rowTypes = new Map<number, RockRowType>();
  const addRockRowCell = (cell: GridCell, rowType: RockRowType) => {
    rows.set(cell.y, [...(rows.get(cell.y) ?? []), cell]);
    if (rowTypes.get(cell.y) !== 'wall') {
      rowTypes.set(cell.y, rowType);
    }
  };

  for (const cell of bottomEdgeCells) {
    const rockY = cell.y + 1;
    if (rockProfile === 'bottom-only') {
      addRockRowCell({ x: cell.x, y: rockY }, 'bottom');
    } else if (rockProfile === 'wall-only') {
      addRockRowCell({ x: cell.x, y: rockY }, 'wall');
    } else {
      addRockRowCell({ x: cell.x, y: rockY }, 'wall');
      addRockRowCell({ x: cell.x, y: rockY + 1 }, 'bottom');
    }
  }

  return [...rows.entries()]
    .sort(([leftY], [rightY]) => leftY - rightY)
    .flatMap((entry) => getSecondLayerRockRowPieces(
      entry[1].sort(compareCells),
      rowTypes.get(entry[0]) ?? 'bottom',
    ));
}

function getSecondLayerShadowRowPieces(rowCells: GridCell[]): TerrainShadowPiece[] {
  const pieces: TerrainShadowPiece[] = [];
  let segment: GridCell[] = [];

  for (const cell of rowCells) {
    const previousCell = segment[segment.length - 1];
    if (previousCell && (cell.y !== previousCell.y || cell.x !== previousCell.x + 1)) {
      pieces.push(getSecondLayerShadowSegmentPiece(segment));
      segment = [];
    }
    segment.push(cell);
  }

  if (segment.length > 0) pieces.push(getSecondLayerShadowSegmentPiece(segment));

  return pieces;
}

function getSecondLayerShadowSegmentPiece(segment: GridCell[]): TerrainShadowPiece {
  return {
    cell: {
      x: segment[0].x + (segment.length - 1) / 2,
      y: segment[0].y,
    },
    widthCells: segment.length,
  };
}

function getSecondLayerRockRowPieces(rowCells: GridCell[], rowType: RockRowType) {
  const pieces: TerrainPiece[] = [];
  let segment: GridCell[] = [];

  for (const cell of rowCells) {
    const previousCell = segment[segment.length - 1];
    if (previousCell && cell.x !== previousCell.x + 1) {
      pieces.push(...getSecondLayerRockSegmentPieces(segment, rowType));
      segment = [];
    }
    segment.push(cell);
  }

  return [...pieces, ...getSecondLayerRockSegmentPieces(segment, rowType)];
}

function getSecondLayerRockSegmentPieces(segment: GridCell[], rowType: RockRowType): TerrainPiece[] {
  if (segment.length === 0) return [];

  return segment.map((cell, index) => {
    const frame = getRockSegmentFrame(segment.length, index, rowType);

    return {
      cell,
      frame,
      surface: 'rock' as const,
    };
  });
}

function getRockSegmentFrame(segmentLength: number, index: number, rowType: RockRowType) {
  if (rowType === 'wall') {
    if (segmentLength === 1) return 44;
    if (index === 0) return 41;
    if (index === segmentLength - 1) return 43;
    return 42;
  }

  if (segmentLength === 1) return 53;
  if (index === 0) return 50;
  if (index === segmentLength - 1) return 52;
  return 51;
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
  return getOpenEdgeMaskFromOccupiedCellKeys(args.cell, occupied);
}

function getOpenEdgeMaskFromOccupiedCellKeys(cell: GridCell, occupiedCellKeys: Set<string>) {
  const top = !occupiedCellKeys.has(getCellKey({ x: cell.x, y: cell.y - 1 }));
  const right = !occupiedCellKeys.has(getCellKey({ x: cell.x + 1, y: cell.y }));
  const bottom = !occupiedCellKeys.has(getCellKey({ x: cell.x, y: cell.y + 1 }));
  const left = !occupiedCellKeys.has(getCellKey({ x: cell.x - 1, y: cell.y }));
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
