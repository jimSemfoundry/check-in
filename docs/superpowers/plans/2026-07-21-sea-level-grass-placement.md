# Sea-Level Grass Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the active floating-island build target with sea-level grass placement.

**Architecture:** Rename the pure placement model from building semantics to grass semantics and keep it independent of Phaser. Add a sea-level scene plan for grid dimensions and render tiles, then simplify `FloatingIslandScene` so it renders sea, HUD, and placed grass tiles only.

**Tech Stack:** TypeScript, Vitest, Phaser 4, React/Vite.

## Global Constraints

- Previous development documents must remain in `docs/superpowers`.
- Active scene removes floating island grass cap, rock cliff, foam, trees, and sheep.
- Bottom HUD slots map to `1x1`, `3x1`, `1x3`, `3x3`, with the fifth slot empty.
- Grass can be placed anywhere inside the sea-level grid without adjacency.
- Grass placements cannot overlap.
- Invalid placement must not create grass.
- Run `pnpm --filter web test` and `pnpm --filter web typecheck` before completion.

---

### Task 1: Rename Placement Model To Grass Semantics

**Files:**
- Create: `apps/web/src/game/grassPlacement.ts`
- Delete: `apps/web/src/game/buildingPlacement.ts`
- Rename test: `apps/web/src/test/building-placement.test.ts` to `apps/web/src/test/grass-placement.test.ts`

**Interfaces:**
- Produces: `type GridCell = { x: number; y: number }`
- Produces: `type GrassShapeKey = 'one' | 'three-horizontal' | 'three-vertical' | 'nine'`
- Produces: `type GrassShape = { key: GrassShapeKey; width: number; height: number }`
- Produces: `type GridSize = { columns: number; rows: number }`
- Produces: `type GrassPatch = { id: string; shapeKey: GrassShapeKey; anchor: GridCell; cells: GridCell[] }`
- Produces: `grassShapes: Record<GrassShapeKey, GrassShape>`
- Produces: `getGrassShapeForHudSlot(slotIndex: number): GrassShape | undefined`
- Produces: `getGrassShapeCells(shape: GrassShape, anchor: GridCell): GridCell[]`
- Produces: `canPlaceGrassShape(args: { shape: GrassShape; anchor: GridCell; grid: GridSize; occupiedCells: GridCell[] }): boolean`
- Produces: `placeGrassPatch(args: { id: string; shape: GrassShape; anchor: GridCell; grid: GridSize; patches: GrassPatch[] }): GrassPatch[]`
- Produces: `getGridCellFromWorldPoint(args): GridCell | undefined`
- Produces: `getCanvasPointFromPointerEvent(args): { x: number; y: number } | undefined`

- [ ] **Step 1: Write the failing test**

Rename the test file and update imports/names so it imports from `../game/grassPlacement` and uses grass terminology. Add this adjacency case:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- grass-placement`

Expected: FAIL because `../game/grassPlacement` does not exist.

- [ ] **Step 3: Write minimal implementation**

Move the current placement implementation into `apps/web/src/game/grassPlacement.ts`, replacing building names with grass names. Delete `apps/web/src/game/buildingPlacement.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test -- grass-placement`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/web/src/game/grassPlacement.ts apps/web/src/test/grass-placement.test.ts apps/web/src/game/buildingPlacement.ts apps/web/src/test/building-placement.test.ts
git commit -m "refactor: rename placement model for grass"
```

### Task 2: Add Sea-Level Scene Plan

**Files:**
- Create: `apps/web/src/game/seaLevelScenePlan.ts`
- Delete: `apps/web/src/game/rockIslandScenePlan.ts`
- Rename test: `apps/web/src/test/rock-island-scene.test.ts` to `apps/web/src/test/sea-level-scene.test.ts`

**Interfaces:**
- Produces: `seaLevelScenePlan.grid = { columns: 12, rows: 8 }`
- Produces: `seaLevelScenePlan.grassFrame = 24`
- Produces: `seaLevelScenePlan.tileSize = tinySwordsTerrainTileset.tileSize`

- [ ] **Step 1: Write the failing test**

Create/update `apps/web/src/test/sea-level-scene.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { seaLevelScenePlan } from '../game/seaLevelScenePlan';

describe('sea-level grass placement scene plan', () => {
  it('uses a centered sea-level placement grid without prebuilt island layers', () => {
    expect(seaLevelScenePlan).toEqual({
      tileSize: 64,
      grid: {
        columns: 12,
        rows: 8,
      },
      grassFrame: 24,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- sea-level-scene`

Expected: FAIL because `../game/seaLevelScenePlan` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/src/game/seaLevelScenePlan.ts`:

```ts
import { tinySwordsTerrainTileset } from './terrainTileset';

export const seaLevelScenePlan = {
  tileSize: tinySwordsTerrainTileset.tileSize,
  grid: {
    columns: 12,
    rows: 8,
  },
  grassFrame: 24,
} as const;
```

Delete `apps/web/src/game/rockIslandScenePlan.ts` and its old test.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test -- sea-level-scene`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/web/src/game/seaLevelScenePlan.ts apps/web/src/test/sea-level-scene.test.ts apps/web/src/game/rockIslandScenePlan.ts apps/web/src/test/rock-island-scene.test.ts
git commit -m "feat: add sea-level grass scene plan"
```

### Task 3: Simplify Phaser Scene To Sea And Grass

**Files:**
- Modify: `apps/web/src/game/FloatingIslandScene.ts`
- Test: `apps/web/src/test/GamePage.test.tsx`

**Interfaces:**
- Consumes: `seaLevelScenePlan`
- Consumes: `getGrassShapeForHudSlot`
- Consumes: `placeGrassPatch`
- Produces: active `/game` scene renders sea, HUD, and placed grass tiles only.

- [ ] **Step 1: Write the failing test**

Add focused assertions to existing tests only if they can inspect DOM/canvas setup without brittle pixels. Otherwise, rely on pure tests plus full build/typecheck.

- [ ] **Step 2: Run tests to capture current failures**

Run: `pnpm --filter web test`

Expected: FAIL because `FloatingIslandScene.ts` still imports deleted `rockIslandScenePlan` and `buildingPlacement`.

- [ ] **Step 3: Write implementation**

Update `FloatingIslandScene.ts`:

- Remove imports and methods for foam, rock body, grass cap, tree animations, sheep animations, tree/sheep creation, and sheep motion.
- Keep loading `sea`, `terrain-tiles`, and HUD assets.
- Create `grassRoot` container inside `worldRoot`.
- Use `seaLevelScenePlan.grid` for click bounds.
- Compute grid left/top from `-(columns * TILE_SIZE) / 2` and `-(rows * TILE_SIZE) / 2`.
- On click, convert canvas point to world point, then to sea grid cell.
- Use `getGrassShapeForHudSlot` and `placeGrassPatch`.
- Render each accepted grass cell as a terrain tile using `seaLevelScenePlan.grassFrame`.
- Keep HUD click selection and stop propagation behavior.
- Layout zoom should fit `seaLevelScenePlan.grid.columns * TILE_SIZE` by `seaLevelScenePlan.grid.rows * TILE_SIZE` plus margins.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter web test`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/web/src/game/FloatingIslandScene.ts apps/web/src/test/GamePage.test.tsx
git commit -m "feat: build grass directly on sea"
```

### Task 4: Final Verification And Push

**Files:**
- Read: `docs/superpowers/specs/2026-07-21-sea-level-grass-placement-design.md`
- Read: `docs/superpowers/plans/2026-07-21-sea-level-grass-placement.md`

- [ ] **Step 1: Run web tests**

Run: `pnpm --filter web test`

Expected: PASS.

- [ ] **Step 2: Run web typecheck**

Run: `pnpm --filter web typecheck`

Expected: PASS.

- [ ] **Step 3: Manually verify in browser**

Use Playwright or the local dev server to open `/game`, click the sea, and confirm grass appears on the sea with no old island content.

- [ ] **Step 4: Commit any remaining changes**

Run `git status --short`. If there are intended uncommitted changes, commit them with a focused message.

- [ ] **Step 5: Push main**

Run: `git push origin main`

Expected: remote `main` updates successfully.
