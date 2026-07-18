# Floating Island Trees And Sheep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four Tiny Swords trees and one animated randomly moving sheep to `/game`.

**Architecture:** Keep data and behavior outside the Phaser scene where practical. `natureAssets.ts` provides paths, frame dimensions, animation keys, placements, and movement bounds; `sheepMotion.ts` provides pure helpers; `FloatingIslandScene.ts` handles Phaser loading/rendering/timers.

**Tech Stack:** React, Phaser 4, TypeScript, Vitest, Playwright.

## Global Constraints

- Keep the current compact 3-tile island and `Tilemap_color1.png` terrain.
- Keep current `2x3` Water Foam animation and no `Shadow.png`.
- Sheep movement targets must remain inside the visible 3x2 grass surface.
- Use TDD: write failing unit tests before production code.

---

### Task 1: Resource And Motion Configuration

**Files:**
- Create: `apps/web/src/game/natureAssets.ts`
- Create: `apps/web/src/game/sheepMotion.ts`
- Create: `apps/web/src/test/nature-assets.test.ts`
- Create: `apps/web/src/test/sheep-motion.test.ts`
- Modify: `apps/web/src/game/assets.ts`
- Modify: `docs/ai-usage-log.md`

**Interfaces:**
- Produces: `tinySwordsNatureAssets`, `treePlacements`, `sheepAnimationConfig`, `sheepMotionConfig`
- Produces: `createSheepRouteTarget(random: () => number, bounds: SheepMovementBounds): { x: number; y: number }`
- Consumes: public PNG files under `apps/web/public/game/tiny-swords/Terrain/Resources`

- [x] **Step 1: Write failing tests**

Add tests that expect tree/sheep paths, animation frame sizes/counts, tree placements, and deterministic random route bounds.

- [x] **Step 2: Run tests to verify failure**

Run: `pnpm --filter web test src/test/nature-assets.test.ts src/test/sheep-motion.test.ts src/test/game-assets.test.ts`

Expected: fails because `natureAssets.ts`, `sheepMotion.ts`, and new manifest fields do not exist.

- [x] **Step 3: Implement minimal config/helpers**

Create `natureAssets.ts`, `sheepMotion.ts`, and extend `tinySwordsAssets` with `trees` and `sheep`.

- [x] **Step 4: Run target tests**

Run: `pnpm --filter web test src/test/nature-assets.test.ts src/test/sheep-motion.test.ts src/test/game-assets.test.ts`

Expected: all target tests pass.

### Task 2: Phaser Scene Rendering And Animation

**Files:**
- Modify: `apps/web/src/game/FloatingIslandScene.ts`
- Modify: `docs/game-desktop.png`
- Modify: `docs/game-mobile.png`
- Modify: `docs/ai-usage-log.md`

**Interfaces:**
- Consumes: `tinySwordsNatureAssets`, `treePlacements`, `sheepAnimationConfig`, `sheepMotionConfig`, `createSheepRouteTarget`
- Produces: tree sprites, sheep animations, and a sheep behavior loop in the Phaser scene

- [x] **Step 1: Load tree and sheep spritesheets**

Load tree spritesheets using `frameWidth: 192`, `frameHeight: 256` for Tree1/Tree2 and `frameHeight: 192` for Tree3/Tree4. Load sheep spritesheets using `frameWidth: 128`, `frameHeight: 128`.

- [x] **Step 2: Create animations**

Create tree idle animations and sheep idle/move/grass animations. Guard animation creation with `scene.anims.exists`.

- [x] **Step 3: Render trees and sheep**

Draw grass/rock/foam as today, then place trees and the sheep on top of grass. Use depth/y ordering so lower objects appear in front.

- [x] **Step 4: Add sheep route loop**

Use Phaser delayed calls and tweens to cycle `idle -> move -> grass -> idle`, choosing each movement target with `createSheepRouteTarget`.

- [x] **Step 5: Verify browser behavior**

Run local Vite, open `/game` with Playwright, check tree/sheep PNG requests, no console/request errors, full-screen canvas, and water animation frame diff.

### Task 3: Full Verification And Delivery

**Files:**
- Modify: `docs/ai-usage-log.md`

**Interfaces:**
- Consumes: completed Tasks 1 and 2
- Produces: pushed `main` deployment with verified `/game`

- [x] **Step 1: Run full verification**

Run: `pnpm --filter web test`, `pnpm --filter web lint`, `pnpm --filter web typecheck`, and `pnpm --filter web build`.

- [x] **Step 2: Commit and push**

Commit all code, tests, docs, and screenshots; push `origin main`.

- [x] **Step 3: Verify production**

Wait for Cloudflare bundle update, then verify `https://jimapp.ccwu.cc/game` requests tree/sheep assets, no old shadow asset, no errors, canvas renders, and animations move.
