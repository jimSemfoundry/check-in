import { describe, expect, it } from 'vitest';
import { gameHudLayout } from '../game/hudLayout';

describe('game HUD layout', () => {
  it('builds a filled banner body from the Banner atlas center tile', () => {
    expect(gameHudLayout.bannerFillPiece.source).toEqual({
      x: 320,
      y: 128,
      width: 64,
      height: 64,
    });
    expect(gameHudLayout.bannerFillPiece.target).toEqual({
      x: 0,
      y: 0,
      width: 200,
      height: 96,
    });
    expect(gameHudLayout.bannerFillBounds).toEqual({
      left: -100,
      top: -48,
      right: 100,
      bottom: 48,
      width: 200,
      height: 96,
    });
  });

  it('packs the red-box banner pieces from the Banner atlas', () => {
    expect(gameHudLayout.bannerPieces).toHaveLength(2);
    expect(gameHudLayout.bannerPieces.map((piece) => piece.source)).toEqual([
      { x: 4, y: 256, width: 188, height: 92 },
      { x: 512, y: 256, width: 172, height: 98 },
    ]);
    expect(gameHudLayout.bannerPieces.map((piece) => piece.target.x)).toEqual([
      -63, 63,
    ]);
  });

  it('removes atlas whitespace without a wood table overlay', () => {
    expect(gameHudLayout.bannerBounds).toEqual({
      left: -110,
      top: -56.5,
      right: 106,
      bottom: 56.5,
      width: 216,
      height: 113,
    });
    expect(gameHudLayout).not.toHaveProperty('woodTableSlotsOffset');
    expect(gameHudLayout).not.toHaveProperty('woodTableSlotsDisplaySize');
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
