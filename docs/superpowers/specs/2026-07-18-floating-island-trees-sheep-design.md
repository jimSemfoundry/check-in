# Floating Island Trees And Sheep Design

## Goal

Add Tiny Swords tree resources and one animated sheep to `/game` while preserving the current compact 3-tile floating island, bottom water foam, and `Tilemap_color1.png` terrain.

## Scope

- Load `Tree1.png`, `Tree2.png`, `Tree3.png`, and `Tree4.png` from `Terrain/Resources/Wood/Trees`.
- Load `Sheep_Idle.png`, `Sheep_Move.png`, and `Sheep_Grass.png` from `Terrain/Resources/Meat/Sheep`.
- Render four trees on the grass surface without covering the island edges too heavily.
- Render one sheep on the grass surface.
- Sheep behavior cycles through idle, random movement, grass-eating, then another random movement.
- Sheep random route must stay inside the 3x2 grass platform.
- Keep current Water Foam behavior and no `Shadow.png` loading.

## Architecture

- `natureAssets.ts` owns resource paths, sprite frame dimensions, animation keys, tree placement, and sheep movement bounds.
- `sheepMotion.ts` owns pure random-route and state-timing helpers so movement rules can be tested without Phaser.
- `FloatingIslandScene.ts` only loads assets, creates animations, places trees, and drives the sheep state machine with Phaser tweens/time events.

## Validation

- Unit tests cover tree/sheep resource configuration.
- Unit tests cover sheep movement targets staying inside configured grass bounds.
- Browser verification confirms `/game` requests tree and sheep PNGs, renders a canvas, has no console/request errors, and keeps water animation active.
