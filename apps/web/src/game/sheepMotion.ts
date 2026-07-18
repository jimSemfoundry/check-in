export type SheepMovementBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type SheepPoint = {
  x: number;
  y: number;
};

export function createSheepRouteTarget(random: () => number, bounds: SheepMovementBounds): SheepPoint {
  return {
    x: interpolate(bounds.minX, bounds.maxX, random()),
    y: interpolate(bounds.minY, bounds.maxY, random()),
  };
}

export function getSheepMoveDurationMs(from: SheepPoint, to: SheepPoint, pixelsPerSecond: number) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.round((distance / pixelsPerSecond) * 1000);
}

function interpolate(min: number, max: number, value: number) {
  const clamped = Math.min(Math.max(value, 0), 1);
  return Math.round(min + (max - min) * clamped);
}
