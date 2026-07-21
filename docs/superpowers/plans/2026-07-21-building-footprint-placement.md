# Building Footprint Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build clickable building footprint placement for the four existing bottom HUD options.

**Architecture:** Add a pure grid-placement module that owns footprint definitions, bounds checks, and occupancy checks. Keep Phaser scene code responsible for converting pointer coordinates into grass grid cells and rendering accepted placements.

**Tech Stack:** TypeScript, Vitest, Phaser 4, React/Vite.

## Global Constraints

- The bottom map options represent building footprint templates, not terrain expansion.
- Supported footprints are `1x1`, `3x1`, `1x3`, and `3x3`.
- The fifth HUD slot remains empty and must not create a placeable footprint.
- Clicking a grass cell uses that cell as the footprint's top-left anchor.
- Invalid placement must not create a placed footprint.
- Existing footprints block overlapping placements.
- Expand the grass platform to at least `6x6` so every footprint can be tested.
- Run `pnpm --filter web test` and `pnpm --filter web typecheck` before completion.

---

### Task 1: Pure Building Placement Model

**Files:**
- Create: `apps/web/src/game/buildingPlacement.ts`
- Test: `apps/web/src/test/building-placement.test.ts`

**Interfaces:**
- Produces: `type GridCell = { x: number; y: number }`
- Produces: `type FootprintKey = 'one' | 'three-horizontal' | 'three-vertical' | 'nine'`
- Produces: `type Footprint = { key: FootprintKey; width: number; height: number }`
- Produces: `type GridSize = { columns: number; rows: number }`
- Produces: `type PlacedBuilding = { id: string; footprintKey: FootprintKey; anchor: GridCell; cells: GridCell[] }`
- Produces: `buildingFootprints: Record<FootprintKey, Footprint>`
- Produces: `getFootprintForHudSlot(slotIndex: number): Footprint | undefined`
- Produces: `getFootprintCells(footprint: Footprint, anchor: GridCell): GridCell[]`
- Produces: `canPlaceFootprint(args: { footprint: Footprint; anchor: GridCell; grid: GridSize; occupiedCells: GridCell[] }): boolean`
- Produces: `placeBuilding(args: { id: string; footprint: Footprint; anchor: GridCell; grid: GridSize; buildings: PlacedBuilding[] }): PlacedBuilding[]`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/test/building-placement.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildingFootprints,
  canPlaceFootprint,
  getFootprintCells,
  getFootprintForHudSlot,
  placeBuilding,
} from '../game/buildingPlacement';

describe('building placement model', () => {
  it('maps the first four HUD slots to footprint templates and leaves the fifth empty', () => {
    expect(getFootprintForHudSlot(0)).toEqual({ key: 'one', width: 1, height: 1 });
    expect(getFootprintForHudSlot(1)).toEqual({ key: 'three-horizontal', width: 3, height: 1 });
    expect(getFootprintForHudSlot(2)).toEqual({ key: 'three-vertical', width: 1, height: 3 });
    expect(getFootprintForHudSlot(3)).toEqual({ key: 'nine', width: 3, height: 3 });
    expect(getFootprintForHudSlot(4)).toBeUndefined();
  });

  it('derives occupied cells for each rectangular footprint from the anchor', () => {
    expect(getFootprintCells(buildingFootprints.one, { x: 2, y: 1 })).toEqual([{ x: 2, y: 1 }]);
    expect(getFootprintCells(buildingFootprints['three-horizontal'], { x: 2, y: 1 })).toEqual([
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ]);
    expect(getFootprintCells(buildingFootprints['three-vertical'], { x: 2, y: 1 })).toEqual([
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ]);
    expect(getFootprintCells(buildingFootprints.nine, { x: 1, y: 2 })).toEqual([
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

  it('allows placement only when the full footprint fits inside the grid', () => {
    const grid = { columns: 6, rows: 6 };

    expect(canPlaceFootprint({
      footprint: buildingFootprints.nine,
      anchor: { x: 3, y: 3 },
      grid,
      occupiedCells: [],
    })).toBe(true);
    expect(canPlaceFootprint({
      footprint: buildingFootprints.nine,
      anchor: { x: 4, y: 3 },
      grid,
      occupiedCells: [],
    })).toBe(false);
    expect(canPlaceFootprint({
      footprint: buildingFootprints.nine,
      anchor: { x: 3, y: 4 },
      grid,
      occupiedCells: [],
    })).toBe(false);
    expect(canPlaceFootprint({
      footprint: buildingFootprints.one,
      anchor: { x: -1, y: 0 },
      grid,
      occupiedCells: [],
    })).toBe(false);
    expect(canPlaceFootprint({
      footprint: buildingFootprints.one,
      anchor: { x: 0, y: -1 },
      grid,
      occupiedCells: [],
    })).toBe(false);
  });

  it('rejects placement when any footprint cell overlaps occupied cells', () => {
    expect(canPlaceFootprint({
      footprint: buildingFootprints['three-horizontal'],
      anchor: { x: 1, y: 1 },
      grid: { columns: 6, rows: 6 },
      occupiedCells: [{ x: 2, y: 1 }],
    })).toBe(false);
  });

  it('adds a building record with occupied cells when placement is valid', () => {
    const buildings = placeBuilding({
      id: 'building-1',
      footprint: buildingFootprints['three-vertical'],
      anchor: { x: 4, y: 2 },
      grid: { columns: 6, rows: 6 },
      buildings: [],
    });

    expect(buildings).toEqual([
      {
        id: 'building-1',
        footprintKey: 'three-vertical',
        anchor: { x: 4, y: 2 },
        cells: [
          { x: 4, y: 2 },
          { x: 4, y: 3 },
          { x: 4, y: 4 },
        ],
      },
    ]);
  });

  it('returns the original building list when placement is invalid', () => {
    const buildings = [
      {
        id: 'existing',
        footprintKey: 'one' as const,
        anchor: { x: 0, y: 0 },
        cells: [{ x: 0, y: 0 }],
      },
    ];

    expect(placeBuilding({
      id: 'blocked',
      footprint: buildingFootprints.nine,
      anchor: { x: 0, y: 0 },
      grid: { columns: 6, rows: 6 },
      buildings,
    })).toBe(buildings);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- building-placement`

Expected: FAIL because `../game/buildingPlacement` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/src/game/buildingPlacement.ts`:

```ts
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
  return Array.from({ length: footprint.height }, (_, row) =>
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test -- building-placement`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/web/src/game/buildingPlacement.ts apps/web/src/test/building-placement.test.ts
git commit -m "feat: add building footprint placement model"
```

### Task 2: Expand The Island Grid

**Files:**
- Modify: `apps/web/src/game/terrainTileset.ts`
- Test: `apps/web/src/test/rock-island-scene.test.ts`

**Interfaces:**
- Consumes: `rockIslandScenePlan.platform.widthTiles`
- Consumes: `rockIslandScenePlan.platform.grassRows`
- Produces: a `6x6` grass grid and matching `6`-tile rock row.

- [ ] **Step 1: Write the failing test**

Update `apps/web/src/test/rock-island-scene.test.ts` to expect:

```ts
expect(rockIslandScenePlan.platform).toMatchObject({
  widthTiles: 6,
  grassRows: 6,
  rockRows: 1,
  tileOverlapPixels: 1,
});
expect(rockIslandScenePlan.frames.grassRows).toHaveLength(6);
expect(rockIslandScenePlan.frames.grassRows.every((row) => row.length === 6)).toBe(true);
expect(rockIslandScenePlan.frames.rockRows).toEqual([
  [50, 51, 51, 51, 51, 52],
]);
```

Keep the foam expectations updated to `columns: 6`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- rock-island-scene`

Expected: FAIL because the current platform is `3x2`.

- [ ] **Step 3: Write minimal implementation**

Update `apps/web/src/game/terrainTileset.ts` so `platform.widthTiles` is `6`, `platform.grassRows` is `6`, and `frames.grassRows` is:

```ts
[
  [5, 6, 6, 6, 6, 7],
  [23, 24, 24, 24, 24, 25],
  [23, 24, 24, 24, 24, 25],
  [23, 24, 24, 24, 24, 25],
  [23, 24, 24, 24, 24, 25],
  [41, 42, 42, 42, 42, 43],
]
```

Set `frames.rockRows` to:

```ts
[
  [50, 51, 51, 51, 51, 52],
]
```

Update `apps/web/src/game/rockIslandScenePlan.ts` foam grid `columns` to `6`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test -- rock-island-scene`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/web/src/game/terrainTileset.ts apps/web/src/game/rockIslandScenePlan.ts apps/web/src/test/rock-island-scene.test.ts
git commit -m "feat: expand floating island placement grid"
```

### Task 3: Connect Placement To The Phaser Scene

**Files:**
- Modify: `apps/web/src/game/FloatingIslandScene.ts`
- Test: `apps/web/src/test/building-placement.test.ts`

**Interfaces:**
- Consumes: `getFootprintForHudSlot(slotIndex: number): Footprint | undefined`
- Consumes: `placeBuilding(args): PlacedBuilding[]`
- Produces: clicking grass creates visible footprint markers.

- [ ] **Step 1: Write the failing test**

Add this pure coordinate test to `apps/web/src/test/building-placement.test.ts` if scene conversion is extracted:

```ts
import { getGridCellFromWorldPoint } from '../game/buildingPlacement';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- building-placement`

Expected: FAIL because `getGridCellFromWorldPoint` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add `getGridCellFromWorldPoint` to `apps/web/src/game/buildingPlacement.ts`:

```ts
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
```

Then update `FloatingIslandScene`:

- Store `placedBuildings: PlacedBuilding[] = []`.
- Store `buildingMarkers: Phaser.GameObjects.Rectangle[] = []`.
- In `create()`, register a scene-level `pointerdown` handler.
- In HUD pointer handlers, call `event.stopPropagation()` when available.
- Convert pointer screen coordinates to world coordinates by reversing `worldRoot` position and scale.
- Convert world coordinates to a grass grid cell using `getGridCellFromWorldPoint`.
- Look up the selected footprint with `getFootprintForHudSlot`.
- Call `placeBuilding`.
- If the returned array reference changed, replace `placedBuildings` and render markers for the new building's cells.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter web test -- building-placement`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/web/src/game/FloatingIslandScene.ts apps/web/src/game/buildingPlacement.ts apps/web/src/test/building-placement.test.ts
git commit -m "feat: place selected building footprints on island"
```

### Task 4: Final Verification

**Files:**
- Read: `docs/superpowers/specs/2026-07-21-building-footprint-placement-design.md`
- Read: `docs/superpowers/plans/2026-07-21-building-footprint-placement.md`

- [ ] **Step 1: Run web tests**

Run: `pnpm --filter web test`

Expected: PASS.

- [ ] **Step 2: Run web typecheck**

Run: `pnpm --filter web typecheck`

Expected: PASS.

- [ ] **Step 3: Inspect git status**

Run: `git status --short`

Expected: only intended files changed, or no changes after commits.

- [ ] **Step 4: Report result**

Report changed files, commit hashes, verification commands, and any known limitations.
