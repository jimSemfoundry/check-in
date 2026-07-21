# Building Footprint Placement Design

## Purpose

Add the first building placement interaction to the floating island game scene.

The bottom map options represent building footprint templates, not terrain expansion. Selecting one option chooses the footprint shape. Clicking a valid grass grid cell places a building footprint on the map if the shape fits and does not overlap an existing footprint.

## Scope

Implement the first version of placement for the four existing bottom HUD options:

- `1x1`: one grid cell.
- `3x1`: three horizontal grid cells.
- `1x3`: three vertical grid cells.
- `3x3`: nine grid cells.

The selected HUD slot remains selected after placement so the user can place multiple buildings of the same footprint.

## Non-Goals

This feature does not include:

- Drag-and-drop placement from the HUD.
- Rotating footprints.
- Moving or deleting placed buildings.
- Persisting placement to the backend.
- Resource costs, build timers, or unlock rules.
- Real building type selection beyond the four footprint templates.
- Pathfinding or unit/building collision beyond footprint occupancy.

## Map Model

Introduce an explicit placement grid for the grass area of the island. The placement grid should use the same tile size and world origin as the rendered grass cap so grid coordinates and rendered tiles align.

Because the current grass cap is only `3x2`, it cannot fit the vertical `1x3` or `3x3` templates. Expand the grass platform to a testable size, preferably at least `6x6`, while preserving the existing floating-island style and responsive layout. The rock body and foam should continue to derive from the platform dimensions.

## Footprint Data

Represent footprints as data, keyed by HUD slot:

```text
slot 0 -> 1x1
slot 1 -> 3x1
slot 2 -> 1x3
slot 3 -> 3x3
```

Each footprint exposes width, height, and a list of occupied cell offsets. Rectangular footprints can derive offsets from width and height.

The fifth HUD slot remains empty and should not trigger placement.

## Placement Flow

1. User clicks a non-empty HUD slot.
2. Scene stores the selected footprint key.
3. User clicks a grass cell on the island.
4. Scene treats that cell as the footprint's top-left anchor.
5. Scene computes all occupied cells.
6. Scene rejects placement if any occupied cell is outside the grass grid.
7. Scene rejects placement if any occupied cell is already occupied.
8. Scene creates a placed-building record and marks its occupied cells.
9. Scene renders a visible footprint overlay at the occupied cells.

For the first version, rejected placement can be silent or show a temporary red invalid preview. Silent rejection is acceptable if tests cover the behavior.

## Rendering

Render placed footprints above terrain and below animals/trees unless an existing object should visually appear in front due to y-sort. The initial representation can be a simple semi-transparent overlay or simple footprint marker. The key requirement is that occupied cells are visible and aligned to the grid.

Use different neutral styling for placed footprints and invalid previews if an invalid preview is added. Avoid changing the bottom HUD art for this feature beyond preserving the existing selected cursor.

## Interaction Boundaries

Only grass cells are placeable. Clicks on sea, foam, rock, HUD, or outside the grass grid must not place buildings.

HUD clicks must not leak through and place a building on the map.

## Testing

Add focused tests for pure placement logic:

- `1x1`, `3x1`, `1x3`, and `3x3` produce the expected occupied cells.
- Placement succeeds when all occupied cells are inside the grid and empty.
- Placement fails when the footprint would exceed the right, bottom, left, or top edge.
- Placement fails when any occupied cell overlaps an existing building.
- Empty HUD slot selection does not create a placeable footprint.

Add a scene or integration-level test only if existing test infrastructure can assert the Phaser interaction without brittle canvas checks. Otherwise, keep canvas behavior covered by pure grid logic plus existing game smoke tests.

## Acceptance Criteria

- The `/game` page still loads the floating island scene.
- The bottom HUD can select the four footprint options.
- Clicking grass places a visible footprint using the selected shape.
- Invalid placements do not create a footprint.
- Existing footprints block overlapping placements.
- `1x3` and `3x3` can be tested on the map because the grass grid is large enough.
- `pnpm --filter web test` passes.
- `pnpm --filter web typecheck` passes.
