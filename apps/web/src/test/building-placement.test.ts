import { describe, expect, it } from 'vitest';
import {
  buildingFootprints,
  canPlaceFootprint,
  getCanvasPointFromPointerEvent,
  getFootprintCells,
  getFootprintForHudSlot,
  getGridCellFromWorldPoint,
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

  it('uses DOM event coordinates to derive canvas points instead of stale Phaser pointer coordinates', () => {
    expect(getCanvasPointFromPointerEvent({
      clientPoint: { x: 640, y: 300 },
      canvasRect: { left: 0, top: 0, width: 1280, height: 720 },
      canvasSize: { width: 1280, height: 720 },
    })).toEqual({ x: 640, y: 300 });

    expect(getCanvasPointFromPointerEvent({
      clientPoint: { x: 640, y: 300 },
      canvasRect: { left: 100, top: 200, width: 640, height: 360 },
      canvasSize: { width: 1280, height: 720 },
    })).toEqual({ x: 1080, y: 200 });
  });
});
