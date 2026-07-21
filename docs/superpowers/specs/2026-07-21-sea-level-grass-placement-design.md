# Sea-Level Grass Placement Design

## Purpose

Change the `/game` scene from building on the existing floating island to placing grass terrain directly on the sea plane.

The bottom HUD options represent grass placement shapes. Selecting a shape and clicking the sea grid creates grass tiles in that shape. The old floating-island content can be removed from the scene, but previous development documents must remain in the repository.

## Scope

Implement sea-level grass placement for the four existing bottom HUD options:

- `1x1`: one grass tile.
- `3x1`: three horizontal grass tiles.
- `1x3`: three vertical grass tiles.
- `3x3`: nine grass tiles.

The selected HUD slot remains active after placement for repeated building.

## Non-Goals

This feature does not include:

- Requiring new grass to be adjacent to existing grass.
- Building placement on top of grass.
- Trees, sheep, rocks, cliffs, or foam in the active scene.
- Deleting or moving placed grass.
- Persisting grass placement to the backend.
- Terrain costs, timers, or unlock rules.
- Removing historical design documents.

## Scene Model

The active scene should keep:

- Full-screen sea background.
- Bottom HUD with the existing four terrain-shape options.
- A centered sea-level placement grid.
- Rendered grass tiles for accepted placements.

The active scene should remove:

- The prebuilt floating island grass cap.
- Rock body / cliff rows.
- Bottom foam.
- Trees and sheep.

## Placement Grid

Create an explicit sea-level placement grid, independent from the old floating-island platform. A first version can use a fixed grid such as `12x8` tiles with the existing `64px` tile size.

The grid is logically centered in the world. It does not need visible grid lines; grass appears only where the user places it.

Clicking outside the placement grid does nothing.

## Grass Placement Rules

Each HUD option maps to one grass footprint:

```text
slot 0 -> 1x1
slot 1 -> 3x1
slot 2 -> 1x3
slot 3 -> 3x3
slot 4 -> empty
```

Placement rules:

1. User selects a non-empty HUD slot.
2. User clicks a cell on the sea-level grid.
3. The clicked cell is the top-left anchor of the selected shape.
4. Placement succeeds if every target cell is inside the grid and empty.
5. Placement fails if any target cell is outside the grid.
6. Placement fails if any target cell overlaps any previously placed grass tile.
7. Placement does not require adjacency to existing grass.
8. Successful placement renders grass tiles for all target cells.

## Rendering

Use the existing Tiny Swords terrain tileset for grass rendering. The first version can use a simple grass center tile for every placed cell. Edge-aware tile selection can come later.

Placed grass should sit directly on the sea background with no rock body, cliff, or foam under it.

The bottom HUD art can remain unchanged.

## Testing

Add focused tests for the pure placement logic:

- The four HUD slots map to `1x1`, `3x1`, `1x3`, and `3x3`.
- The fifth slot is empty.
- Placement succeeds anywhere inside the sea grid when cells are empty.
- Placement does not require adjacency.
- Placement fails on overlap.
- Placement fails at grid boundaries when the full shape does not fit.
- Pointer/canvas coordinate conversion still maps clicks to grid cells.

Update scene-plan tests so they describe the sea-level grid and no longer require a prebuilt island, cliff, foam, trees, or sheep in the active scene.

## Acceptance Criteria

- Opening `/game` shows sea and the bottom HUD.
- The old floating island, cliff, foam, trees, and sheep are gone from the active scene.
- Selecting each of the first four HUD options and clicking the sea places the matching grass shape.
- Grass shapes can be placed without adjacency.
- Grass shapes cannot overlap.
- Invalid placements do not create grass.
- Previous design docs remain in `docs/superpowers`.
- `pnpm --filter web test` passes.
- `pnpm --filter web typecheck` passes.
