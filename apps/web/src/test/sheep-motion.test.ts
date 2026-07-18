import { describe, expect, it } from 'vitest';
import { sheepMotionConfig } from '../game/natureAssets';
import { createSheepRouteTarget, getSheepMoveDurationMs } from '../game/sheepMotion';

describe('sheep motion helpers', () => {
  it('maps deterministic random values into the configured grass bounds', () => {
    expect(createSheepRouteTarget(() => 0, sheepMotionConfig.bounds)).toEqual({ x: -58, y: -82 });
    expect(createSheepRouteTarget(() => 1, sheepMotionConfig.bounds)).toEqual({ x: 58, y: -28 });
    expect(createSheepRouteTarget(() => 0.5, sheepMotionConfig.bounds)).toEqual({ x: 0, y: -55 });
  });

  it('calculates movement duration from distance and pixels per second', () => {
    expect(
      getSheepMoveDurationMs(
        { x: -58, y: -82 },
        { x: 58, y: -82 },
        sheepMotionConfig.movePixelsPerSecond,
      ),
    ).toBe(2762);
  });
});
