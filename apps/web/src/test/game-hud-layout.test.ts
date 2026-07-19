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
});
