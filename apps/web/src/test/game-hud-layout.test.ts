import { describe, expect, it } from 'vitest';
import { gameHudLayout } from '../game/hudLayout';

describe('game HUD layout', () => {
  it('uses the numbered Banner atlas pieces', () => {
    expect(gameHudLayout.bannerPieces.map((piece) => piece.id)).toEqual([
      0, 2, 8, 1, 3, 4, 5, 6, 7, 9, 10,
    ]);
    expect(gameHudLayout.bannerPieces.map((piece) => piece.source)).toEqual([
      { x: 320, y: 128, width: 64, height: 64 },
      { x: 256, y: 0, width: 64, height: 64 },
      { x: 256, y: 256, width: 64, height: 64 },
      { x: 4, y: 0, width: 60, height: 64 },
      { x: 384, y: 0, width: 64, height: 64 },
      { x: 640, y: 0, width: 44, height: 64 },
      { x: 4, y: 128, width: 60, height: 64 },
      { x: 640, y: 128, width: 44, height: 64 },
      { x: 4, y: 256, width: 188, height: 92 },
      { x: 384, y: 256, width: 64, height: 64 },
      { x: 512, y: 256, width: 172, height: 98 },
    ]);
  });

  it('uses pieces 2, 0, and 8 as the only stretchable row fillers', () => {
    expect(gameHudLayout.bannerPieces.filter((piece) => piece.stretch).map((piece) => piece.id)).toEqual([
      0, 2, 8,
    ]);
  });

  it('uses the Slots atlas as nine fixed slot pieces', () => {
    expect(gameHudLayout.slotPieces.map((piece) => piece.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(gameHudLayout.slotPieces.map((piece) => piece.source)).toEqual([
      { x: 43, y: 8, width: 21, height: 56 },
      { x: 128, y: 8, width: 64, height: 56 },
      { x: 256, y: 8, width: 24, height: 56 },
      { x: 43, y: 128, width: 21, height: 64 },
      { x: 128, y: 128, width: 64, height: 64 },
      { x: 256, y: 128, width: 24, height: 64 },
      { x: 43, y: 256, width: 21, height: 47 },
      { x: 128, y: 256, width: 64, height: 47 },
      { x: 256, y: 256, width: 24, height: 47 },
    ]);
    expect(gameHudLayout.slotPieces.some((piece) => piece.stretch)).toBe(false);
  });

  it('computes an adaptive banner width from the viewport', () => {
    expect(gameHudLayout.getBannerWidth(1280)).toBe(408);
    expect(gameHudLayout.getBannerWidth(390)).toBe(342);
    expect(gameHudLayout.getBannerWidth(320)).toBe(272);
  });

  it('combines numbered pieces into left, fill, and right groups', () => {
    const desktop = gameHudLayout.getBannerPieceTargets(1280);
    expect(desktop.map((piece) => piece.id)).toEqual([0, 2, 8, 1, 3, 4, 5, 6, 7, 9, 10]);
    expect(desktop.map((piece) => piece.target.x)).toEqual([
      4, -12, -12, -189, 166, 193, -189, 193, -157, 102, 161,
    ]);
    expect(desktop.map((piece) => piece.target.y)).toEqual([
      -24, -56, 8, -56, -56, -56, -24, -24, 15, 8, 16.5,
    ]);
    expect(desktop.find((piece) => piece.id === 2)?.target.width).toBe(324);
    expect(desktop.find((piece) => piece.id === 0)?.target.width).toBe(356);
    expect(desktop.find((piece) => piece.id === 8)?.target.width).toBe(196);
    expect(desktop.find((piece) => piece.id === 0)?.target.height).toBe(32);

    const narrow = gameHudLayout.getBannerPieceTargets(320);
    expect(narrow.find((piece) => piece.id === 1)?.target.x).toBe(-121);
    expect(narrow.find((piece) => piece.id === 2)?.target.x).toBe(-12);
    expect(narrow.find((piece) => piece.id === 3)?.target.x).toBe(98);
    expect(narrow.find((piece) => piece.id === 4)?.target.x).toBe(125);
    expect(narrow.find((piece) => piece.id === 2)?.target.width).toBe(188);
    expect(narrow.find((piece) => piece.id === 0)?.target.width).toBe(220);
    expect(narrow.find((piece) => piece.id === 8)?.target.width).toBe(60);
  });

  it('lays out five composed slots centered inside the banner body', () => {
    const desktop = gameHudLayout.getSlotTargets(1280);
    expect(desktop).toHaveLength(45);
    expect([...new Set(desktop.map((piece) => piece.slotIndex))]).toEqual([0, 1, 2, 3, 4]);
    expect(desktop.filter((piece) => piece.slotIndex === 0).map((piece) => piece.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(desktop.filter((piece) => piece.id === 5).map((piece) => piece.target.x)).toEqual([
      -132, -66, 0, 66, 132,
    ]);
    expect(desktop.filter((piece) => piece.id === 5).map((piece) => piece.target.y)).toEqual([
      -24, -24, -24, -24, -24,
    ]);
    expect(desktop.map((piece) => piece.target.width)).toContain(19.33);
    expect(desktop.map((piece) => piece.target.height)).toContain(19.33);

    const mobile = gameHudLayout.getSlotTargets(320);
    expect(mobile.filter((piece) => piece.id === 5).map((piece) => piece.target.x)).toEqual([
      -92, -46, 0, 46, 92,
    ]);
    expect(mobile.map((piece) => piece.target.width)).toContain(12);
    expect(mobile.map((piece) => piece.target.height)).toContain(12);
  });

  it('places a cursor over the selected slot', () => {
    expect(gameHudLayout.getSlotCursorTarget(1280, 0)).toEqual({
      x: -132,
      y: -24,
      width: 66,
      height: 66,
    });
    expect(gameHudLayout.getSlotCursorTarget(1280, 2)).toEqual({
      x: 0,
      y: -24,
      width: 66,
      height: 66,
    });
    expect(gameHudLayout.getSlotCursorTarget(1280, 4)).toEqual({
      x: 132,
      y: -24,
      width: 66,
      height: 66,
    });
    expect(gameHudLayout.getSlotCursorTarget(320, 4)).toEqual({
      x: 92,
      y: -24,
      width: 46,
      height: 46,
    });
  });

  it('places the numbered terrain tiles into the first four slots', () => {
    expect(gameHudLayout.slotItems.map((item) => item.key)).toEqual([
      'hud-terrain-1',
      'hud-terrain-2',
      'hud-terrain-3',
      'hud-terrain-4',
    ]);
    expect(gameHudLayout.slotItems.map((item) => item.source)).toEqual([
      { x: 192, y: 192, width: 64, height: 64 },
      { x: 0, y: 192, width: 192, height: 64 },
      { x: 192, y: 0, width: 64, height: 192 },
      { x: 0, y: 0, width: 192, height: 192 },
    ]);
    expect(gameHudLayout.getSlotItemTargets(1280)).toEqual([
      { slotIndex: 0, key: 'hud-terrain-1', source: { x: 192, y: 192, width: 64, height: 64 }, displayScale: 0.62, target: { x: -132, y: -24, width: 35, height: 35 } },
      { slotIndex: 1, key: 'hud-terrain-2', source: { x: 0, y: 192, width: 192, height: 64 }, displayScale: 0.72, target: { x: -66, y: -24, width: 41, height: 13 } },
      { slotIndex: 2, key: 'hud-terrain-3', source: { x: 192, y: 0, width: 64, height: 192 }, displayScale: 0.72, target: { x: 0, y: -24, width: 13, height: 41 } },
      { slotIndex: 3, key: 'hud-terrain-4', source: { x: 0, y: 0, width: 192, height: 192 }, displayScale: 0.72, target: { x: 66, y: -24, width: 41, height: 41 } },
    ]);
    expect(gameHudLayout.getSlotItemTargets(320)).toEqual([
      { slotIndex: 0, key: 'hud-terrain-1', source: { x: 192, y: 192, width: 64, height: 64 }, displayScale: 0.62, target: { x: -92, y: -24, width: 22, height: 22 } },
      { slotIndex: 1, key: 'hud-terrain-2', source: { x: 0, y: 192, width: 192, height: 64 }, displayScale: 0.72, target: { x: -46, y: -24, width: 25, height: 8 } },
      { slotIndex: 2, key: 'hud-terrain-3', source: { x: 192, y: 0, width: 64, height: 192 }, displayScale: 0.72, target: { x: 0, y: -24, width: 8, height: 25 } },
      { slotIndex: 3, key: 'hud-terrain-4', source: { x: 0, y: 0, width: 192, height: 192 }, displayScale: 0.72, target: { x: 46, y: -24, width: 25, height: 25 } },
    ]);
  });

  it('anchors the composed banner bottom to the viewport bottom center', () => {
    expect(gameHudLayout.getHudTransform(1280, 720)).toEqual({
      x: 640,
      y: 661,
      scale: 1,
    });
    expect(gameHudLayout.getHudTransform(320, 568)).toEqual({
      x: 160,
      y: 509,
      scale: 1,
    });
  });

  it('finds the selected slot from canvas coordinates', () => {
    expect(gameHudLayout.getSlotIndexAtPoint(1280, 720, { x: 508, y: 637 })).toBe(0);
    expect(gameHudLayout.getSlotIndexAtPoint(1280, 720, { x: 640, y: 637 })).toBe(2);
    expect(gameHudLayout.getSlotIndexAtPoint(1280, 720, { x: 772, y: 637 })).toBe(4);
    expect(gameHudLayout.getSlotIndexAtPoint(1280, 720, { x: 640, y: 300 })).toBeUndefined();
  });
});
