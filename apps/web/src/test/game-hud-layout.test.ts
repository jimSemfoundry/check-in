import { describe, expect, it } from 'vitest';
import { gameHudLayout } from '../game/hudLayout';

describe('game HUD layout', () => {
  it('packs the red-box banner pieces from the Banner atlas', () => {
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
    expect(gameHudLayout.bannerPieces.map((piece) => piece.target.x)).toEqual([
      -63, -16, 16, 59, -63, 0, 59, -63, -16, 16, 63,
    ]);
  });

  it('removes atlas whitespace and centers the wood table on the packed banner', () => {
    expect(gameHudLayout.bannerBounds).toEqual({
      left: -110,
      top: -56.5,
      right: 106,
      bottom: 56.5,
      width: 216,
      height: 113,
    });
    expect(gameHudLayout.woodTableSlotsOffset).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('anchors the packed banner bottom to the viewport bottom center', () => {
    expect(gameHudLayout.getHudTransform(1280, 720)).toEqual({
      x: 640,
      y: 645.5,
      scale: 1,
    });
    expect(gameHudLayout.getHudTransform(320, 568)).toEqual({
      x: 160,
      y: 493.5,
      scale: 1,
    });
  });
});
