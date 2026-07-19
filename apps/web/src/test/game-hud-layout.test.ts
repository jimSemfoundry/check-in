import { describe, expect, it } from 'vitest';
import { gameHudLayout } from '../game/hudLayout';

describe('game HUD layout', () => {
  it('uses the red-box banner group from the Banner atlas', () => {
    expect(gameHudLayout.bannerSourceFrame).toEqual({
      x: 0,
      y: 0,
      width: 704,
      height: 384,
    });
  });

  it('centers the wood table on the visible banner pixels', () => {
    expect(gameHudLayout.bannerVisibleBounds).toEqual({
      left: -174,
      top: -96,
      right: 166,
      bottom: 81,
      centerX: -4,
      centerY: -7.5,
    });
    expect(gameHudLayout.woodTableSlotsOffset).toEqual({
      x: -4,
      y: -7.5,
    });
  });

  it('anchors the visible banner bottom to the viewport bottom center', () => {
    expect(gameHudLayout.getHudTransform(1280, 720)).toEqual({
      x: 644,
      y: 621,
      scale: 1,
    });
    expect(gameHudLayout.getHudTransform(320, 568)).toEqual({
      x: 163.40425531914894,
      y: 481.06382978723406,
      scale: 0.851063829787234,
    });
  });
});
