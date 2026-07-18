# Floating Island Map Design

## Purpose

Build the first visual milestone for the Tiny Swords game direction: a static square floating island map surrounded by sea, wave foam, and clouds.

This milestone is visual only. It proves that the Tiny Swords Free Pack can produce the desired floating-island scene before adding gameplay systems.

## Target Scene

The first screen should show:

- A full-screen sea background.
- A centered square grass island.
- Wave foam around all island edges.
- A visible island edge or cliff so the island feels raised above the sea.
- Several clouds around the island, mostly near screen edges.
- A few resource props on the island: one tree, a few rocks, and two or three sheep.

The result should feel close to the supplied reference image: compact, readable, playful, and suitable for mobile.

## Non-Goals

Do not implement these in the first milestone:

- Building placement.
- Resource gathering.
- Unit selection.
- Pathfinding.
- Combat.
- Day progression.
- Top resource UI.
- Bottom card toolbar.
- Tiled map editor integration.
- APK packaging.

Those systems come after the static scene proves the visual direction.

## Asset Pack

Use the Tiny Swords Free Pack files from the downloaded zip.

Relevant asset groups:

- Sea: `Terrain/Tileset/Water Background color.png`
- Island tiles: `Terrain/Tileset/Tilemap_color1.png` through `Tilemap_color5.png`
- Wave foam: `Terrain/Tileset/Water Foam.png`
- Shadow or depth edge: `Terrain/Tileset/Shadow.png`
- Clouds: `Terrain/Decorations/Clouds/*.png`
- Trees: `Terrain/Resources/Wood/Trees/*.png`
- Rocks: `Terrain/Decorations/Rocks/*.png`
- Sheep: `Terrain/Resources/Meat/Sheep/*.png`

Ignore these when importing:

- `__MACOSX/**`
- `.DS_Store`
- `._*`
- `.aseprite` files, unless a later asset pipeline explicitly supports Aseprite.

## Recommended Technical Approach

Use Phaser 3 inside the existing React/Vite app.

Recommended route:

- Add a `/game` route in `apps/web`.
- Mount a Phaser canvas from a React page.
- Keep this milestone as a self-contained static scene.

Recommended files for this milestone:

```text
apps/web/src/pages/GamePage.tsx
apps/web/src/game/FloatingIslandScene.ts
apps/web/src/game/createGame.ts
apps/web/src/game/assets.ts
apps/web/public/game/tiny-swords/
```

For the first milestone, generate the square island in code instead of using Tiled. This keeps the feedback loop short. Move to Tiled only after the visual language is approved.

## Canvas And Camera

Use a responsive canvas that fills the app viewport.

Suggested world setup:

- Design resolution: `1280x720`, scaled to fit.
- Background: sea fills the full canvas.
- Island tile size: `64x64`.
- Island grid: `12x12`.
- Island visual size: `768x768`.
- Desktop camera: center the full island.
- Mobile camera: scale or zoom so the full island remains visible with some sea margin.

The island should not touch the viewport edge. Leave sea visible on all sides.

## Layer Order

Render layers in this exact order:

```text
1. sea_background
2. distant_clouds
3. water_foam
4. island_shadow_or_cliff
5. island_ground
6. island_edge_detail
7. props
8. animals
```

### sea_background

Fill the canvas using the water background color or a repeated sea texture if the asset supports it.

The sea should read as a calm, wide background. Avoid noisy repetition.

### distant_clouds

Place clouds outside or near the island edges:

- One larger cloud cluster near upper right.
- One cloud cluster near lower left.
- One smaller cloud near lower center or left edge.

Clouds should never cover the island center. They are atmosphere, not obstacles.

### water_foam

Place foam tiles around all four sides of the island where ground touches sea.

For the first milestone, static foam is acceptable. If `Water Foam.png` contains animation frames, later animate it with staggered frame offsets.

### island_shadow_or_cliff

Use the shadow or cliff-like edge tiles to create height.

The island should feel like a square raised landmass, not a flat grass card. The bottom edge can show the most visible cliff depth because it faces the viewer.

### island_ground

Use one `Tilemap_color*.png` variant for the main grass fill. Start with one color only to reduce visual mismatch.

A `12x12` square is recommended. Keep the first layout simple and stable.

### island_edge_detail

Use edge tiles from the same tilemap color to frame the square island:

- Corners use corner tiles.
- Top and bottom use horizontal edge tiles.
- Left and right use vertical edge tiles.
- Center tiles fill the inner area.

If exact tile indexes are not known yet, create a small debug sheet view or inspect the tilemap guide image while mapping tile coordinates.

### props

Place a small number of props:

- One tree near the center, slightly offset.
- Two or three rocks near the tree.
- Optional bushes near an edge.

Props must not clutter the first scene. Their job is scale validation.

### animals

Place two or three sheep on the grass.

Use idle sheep sprites only. Movement is not part of this milestone.

## Visual Composition

Use a centered composition:

```text
screen center
  square island
    tree slightly below center
    rocks near tree
    sheep spaced apart
  sea margin around island
  clouds around outer screen edges
```

Avoid making the scene symmetrical. The island is square, but props and clouds should be slightly irregular.

## Implementation Notes

Asset import:

- Copy only required PNG files into `apps/web/public/game/tiny-swords/`.
- Keep folder names simple and URL-safe if possible.
- Preserve original files where practical, but avoid importing unused color variants for the first milestone.

Phaser setup:

- Load assets in `preload()`.
- Create background and map layers in `create()`.
- Use nearest-neighbor pixel rendering.
- Disable image smoothing.
- Keep scene state static.

Rendering quality:

- Pixel art should stay crisp.
- Do not apply CSS blur, CSS scaling filters, or canvas smoothing.
- Use integer positioning where possible.

Responsive behavior:

- The canvas should fit both desktop and mobile.
- The island should remain fully visible.
- The island can appear smaller on narrow screens, but should not be cropped.

## Acceptance Criteria

The milestone is complete when:

- Opening `/game` shows the static island scene.
- The sea fills the viewport.
- A square island is centered.
- Wave foam surrounds the island.
- The island reads as raised above the sea.
- Clouds appear around the scene without covering the island center.
- At least one tree, two rocks, and two sheep appear on the island.
- Pixel art renders crisply.
- The scene works on desktop and mobile viewport sizes.
- Existing app routes still work.
- `pnpm --filter web typecheck` passes.
- `pnpm --filter web build` passes.

## Suggested Execution Steps

1. Install Phaser in the web app:

   ```bash
   pnpm --filter web add phaser
   ```

2. Copy required Tiny Swords PNG assets into:

   ```text
   apps/web/public/game/tiny-swords/
   ```

3. Add the game route:

   ```text
   /game
   ```

4. Create the React host page:

   ```text
   apps/web/src/pages/GamePage.tsx
   ```

5. Create Phaser bootstrap code:

   ```text
   apps/web/src/game/createGame.ts
   apps/web/src/game/FloatingIslandScene.ts
   ```

6. Render the static layered scene.

7. Run:

   ```bash
   pnpm --filter web typecheck
   pnpm --filter web build
   ```

8. Start the dev server and inspect `/game`:

   ```bash
   pnpm --filter web dev
   ```

## Open Decisions After This Milestone

After the visual scene is approved, decide:

- Whether the game should remain in code-generated maps or move to Tiled.
- Whether the island should become irregular instead of square.
- Whether clouds are background atmosphere or gameplay objects.
- Whether the next milestone is UI overlay, resource gathering, or day progression.
