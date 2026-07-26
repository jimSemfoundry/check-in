import type { GridCell, TerrainPiece } from './grassPlacement';

const grassFramesByOpenEdgeMask: Record<number, number> = {
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

export function getPrebuiltIslandTerrainPieces(args: {
  occupiedCells: GridCell[];
}): TerrainPiece[] {
  const occupiedCells = getUniqueCells(args.occupiedCells).sort(compareCells);
  const occupiedCellKeys = new Set(occupiedCells.map(getCellKey));
  const grassPieces = occupiedCells.map((cell) => ({
    cell,
    frame: grassFramesByOpenEdgeMask[getOpenEdgeMask(cell, occupiedCellKeys)],
    surface: 'grass' as const,
  }));
  const bottomEdgeCells = occupiedCells
    .filter((cell) => !occupiedCellKeys.has(getCellKey({ x: cell.x, y: cell.y + 1 })))
    .sort(compareCells);
  const frontCells = bottomEdgeCells.map((cell) => ({ x: cell.x, y: cell.y + 1 }));
  const wallCells = bottomEdgeCells.map((cell) => ({ x: cell.x, y: cell.y + 2 }));
  const bottomCells = bottomEdgeCells.map((cell) => ({ x: cell.x, y: cell.y + 3 }));

  return [
    ...getSegmentPieces(wallCells, 'wall'),
    ...getSegmentPieces(bottomCells, 'bottom'),
    ...grassPieces,
    ...getSegmentPieces(frontCells, 'front'),
  ];
}

function getSegmentPieces(cells: GridCell[], rowType: 'front' | 'wall' | 'bottom'): TerrainPiece[] {
  const pieces: TerrainPiece[] = [];
  let segment: GridCell[] = [];

  for (const cell of [...cells].sort(compareCells)) {
    const previousCell = segment[segment.length - 1];
    if (previousCell && (cell.y !== previousCell.y || cell.x !== previousCell.x + 1)) {
      pieces.push(...getContiguousSegmentPieces(segment, rowType));
      segment = [];
    }
    segment.push(cell);
  }

  return [...pieces, ...getContiguousSegmentPieces(segment, rowType)];
}

function getContiguousSegmentPieces(
  segment: GridCell[],
  rowType: 'front' | 'wall' | 'bottom',
): TerrainPiece[] {
  if (segment.length === 0) return [];

  return segment.map((cell, index) => ({
    cell,
    frame: getSegmentFrame(segment.length, index, rowType),
    surface: rowType === 'front' ? 'grass' as const : 'rock' as const,
  }));
}

function getSegmentFrame(segmentLength: number, index: number, rowType: 'front' | 'wall' | 'bottom') {
  if (rowType === 'front') {
    if (segmentLength === 1) return 35;
    if (index === 0) return 32;
    if (index === segmentLength - 1) return 34;
    return 33;
  }

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

function getOpenEdgeMask(cell: GridCell, occupiedCellKeys: Set<string>) {
  return (
    (occupiedCellKeys.has(getCellKey({ x: cell.x, y: cell.y - 1 })) ? 0 : 1)
    | (occupiedCellKeys.has(getCellKey({ x: cell.x + 1, y: cell.y })) ? 0 : 2)
    | (occupiedCellKeys.has(getCellKey({ x: cell.x, y: cell.y + 1 })) ? 0 : 4)
    | (occupiedCellKeys.has(getCellKey({ x: cell.x - 1, y: cell.y })) ? 0 : 8)
  );
}

function getUniqueCells(cells: GridCell[]) {
  const seen = new Set<string>();

  return cells.filter((cell) => {
    const key = getCellKey(cell);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compareCells(left: GridCell, right: GridCell) {
  return left.y - right.y || left.x - right.x;
}

function getCellKey(cell: GridCell) {
  return `${cell.x},${cell.y}`;
}
