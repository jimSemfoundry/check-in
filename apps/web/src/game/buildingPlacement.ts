export type GridCell = {
  x: number;
  y: number;
};

export type FootprintKey = 'one' | 'three-horizontal' | 'three-vertical' | 'nine';

export type Footprint = {
  key: FootprintKey;
  width: number;
  height: number;
};

export type GridSize = {
  columns: number;
  rows: number;
};

export type PlacedBuilding = {
  id: string;
  footprintKey: FootprintKey;
  anchor: GridCell;
  cells: GridCell[];
};

export const buildingFootprints: Record<FootprintKey, Footprint> = {
  one: { key: 'one', width: 1, height: 1 },
  'three-horizontal': { key: 'three-horizontal', width: 3, height: 1 },
  'three-vertical': { key: 'three-vertical', width: 1, height: 3 },
  nine: { key: 'nine', width: 3, height: 3 },
};

const hudSlotFootprints: Array<Footprint | undefined> = [
  buildingFootprints.one,
  buildingFootprints['three-horizontal'],
  buildingFootprints['three-vertical'],
  buildingFootprints.nine,
  undefined,
];

export function getFootprintForHudSlot(slotIndex: number) {
  return hudSlotFootprints[slotIndex];
}

export function getFootprintCells(footprint: Footprint, anchor: GridCell) {
  return Array.from({ length: footprint.height }, (_rowValue, row) =>
    Array.from({ length: footprint.width }, (_columnValue, column) => ({
      x: anchor.x + column,
      y: anchor.y + row,
    })),
  ).flat();
}

export function canPlaceFootprint(args: {
  footprint: Footprint;
  anchor: GridCell;
  grid: GridSize;
  occupiedCells: GridCell[];
}) {
  const cells = getFootprintCells(args.footprint, args.anchor);
  const occupied = new Set(args.occupiedCells.map((cell) => `${cell.x},${cell.y}`));

  return cells.every((cell) => (
    cell.x >= 0
    && cell.y >= 0
    && cell.x < args.grid.columns
    && cell.y < args.grid.rows
    && !occupied.has(`${cell.x},${cell.y}`)
  ));
}

export function placeBuilding(args: {
  id: string;
  footprint: Footprint;
  anchor: GridCell;
  grid: GridSize;
  buildings: PlacedBuilding[];
}) {
  const occupiedCells = args.buildings.flatMap((building) => building.cells);

  if (!canPlaceFootprint({
    footprint: args.footprint,
    anchor: args.anchor,
    grid: args.grid,
    occupiedCells,
  })) {
    return args.buildings;
  }

  return [
    ...args.buildings,
    {
      id: args.id,
      footprintKey: args.footprint.key,
      anchor: args.anchor,
      cells: getFootprintCells(args.footprint, args.anchor),
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
