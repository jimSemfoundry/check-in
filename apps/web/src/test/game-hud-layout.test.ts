import { describe, expect, it } from 'vitest';
import { gameHudLayout } from '../game/hudLayout';

describe('game HUD layout', () => {
  it('uses only the selected three rows from the Banner atlas', () => {
    expect(gameHudLayout.bannerPieces).toHaveLength(11);
    expect(gameHudLayout.bannerPieces.map((piece) => piece.source)).toEqual([
      { x: 4, y: 0, width: 60, height: 64 },
      { x: 256, y: 0, width: 64, height: 64 },
      { x: 384, y: 0, width: 64, height: 64 },
      { x: 640, y: 0, width: 44, height: 64 },
      { x: 4, y: 128, width: 60, height: 64 },
      { x: 320, y: 128, width: 64, height: 64 },
      { x: 640, y: 128, width: 44, height: 64 },
      { x: 4, y: 256, width: 188, height: 92 },
      { x: 256, y: 256, width: 64, height: 64 },
      { x: 384, y: 256, width: 64, height: 64 },
      { x: 512, y: 256, width: 172, height: 98 },
    ]);
    expect(gameHudLayout.bannerPieces.map((piece) => piece.row)).toEqual([
      'top',
      'top',
      'top',
      'top',
      'middle',
      'middle',
      'middle',
      'bottom',
      'bottom',
      'bottom',
      'bottom',
    ]);
  });

  it('computes an adaptive row width from the viewport', () => {
    expect(gameHudLayout.getRowWidth(1280)).toBe(408);
    expect(gameHudLayout.getRowWidth(390)).toBe(342);
    expect(gameHudLayout.getRowWidth(320)).toBe(272);
  });

  it('lays out selected pieces in three adaptive rows', () => {
    const desktop = gameHudLayout.getBannerPieceTargets(1280);
    expect(desktop.map((piece) => piece.target.x)).toEqual([
      -189, -18, 18, 193, -189, 0, 193, -157, -18, 18, 161,
    ]);
    expect(desktop.map((piece) => piece.target.y)).toEqual([
      -64, -64, -64, -64, -24, -24, -24, 24, 24, 24, 24,
    ]);

    const narrow = gameHudLayout.getBannerPieceTargets(320);
    expect(narrow[0].target.x).toBe(-121);
    expect(narrow[3].target.x).toBe(125);
    expect(narrow[7].target.x).toBe(-89);
    expect(narrow[10].target.x).toBe(93);
  });

  it('anchors the three-row banner bottom to the viewport bottom center', () => {
    expect(gameHudLayout.getHudTransform(1280, 720)).toEqual({
      x: 640,
      y: 653,
      scale: 1,
    });
    expect(gameHudLayout.getHudTransform(320, 568)).toEqual({
      x: 160,
      y: 501,
      scale: 1,
    });
  });
});
