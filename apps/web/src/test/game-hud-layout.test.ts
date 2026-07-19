import { describe, expect, it } from 'vitest';
import { gameHudLayout } from '../game/hudLayout';

describe('game HUD layout', () => {
  it('uses the top banner group from the Banner atlas', () => {
    expect(gameHudLayout.bannerSourceFrame).toEqual({
      x: 0,
      y: 0,
      width: 704,
      height: 384,
    });
  });

  it('centers the wood table slots inside the cropped banner frame', () => {
    expect(gameHudLayout.bannerDisplaySize).toEqual({
      width: 352,
      height: 192,
    });
    expect(gameHudLayout.woodTableSlotsDisplaySize).toEqual({
      width: 96,
      height: 96,
    });
    expect(gameHudLayout.woodTableSlotsOffset).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('anchors the cropped banner to the bottom center of the viewport', () => {
    expect(gameHudLayout.getHudTransform(1280, 720)).toEqual({
      x: 640,
      y: 606,
      scale: 1,
    });
    expect(gameHudLayout.getHudTransform(320, 568)).toEqual({
      x: 160,
      y: 468.29787234042556,
      scale: 0.851063829787234,
    });
  });
});
