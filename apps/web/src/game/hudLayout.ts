type BannerPieceId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type SlotPieceId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type HudPiece<TId extends number> = {
  id: TId;
  key: string;
  source: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  stretch?: boolean;
};

type BannerPiece = HudPiece<BannerPieceId>;
type SlotPiece = HudPiece<SlotPieceId>;

type BannerPieceTarget = BannerPiece & {
  target: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type SlotPieceTarget = SlotPiece & {
  slotIndex: number;
  target: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type SlotCursorTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SlotItem = {
  slotIndex: number;
  frame: number;
  displayScale: number;
};

type SlotItemTarget = SlotItem & {
  target: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

const BANNER_PIECE_SCALE = 0.5;
const MAX_BANNER_WIDTH = 408;
const HORIZONTAL_MARGIN = 48;
const LEFT_TOP_WIDTH = 60 * BANNER_PIECE_SCALE;
const LEFT_BOTTOM_WIDTH = 188 * BANNER_PIECE_SCALE;
const RIGHT_TOP_WIDTH = (64 + 44) * BANNER_PIECE_SCALE;
const RIGHT_BOTTOM_WIDTH = (64 + 172) * BANNER_PIECE_SCALE;
const MIN_BANNER_WIDTH = LEFT_BOTTOM_WIDTH + RIGHT_BOTTOM_WIDTH + 16;
const HUD_BOTTOM_INSET = 18;
const HUD_BOTTOM_EXTENT = 41;
const SLOT_COUNT = 5;
const MAX_SLOT_STEP = 66;
const MAX_SLOT_SIZE = 58;
const SLOT_CENTER_Y = -24;

const scaled = (value: number) => value * BANNER_PIECE_SCALE;

const bannerPieces: BannerPiece[] = [
  { id: 0, key: 'piece-0', source: { x: 320, y: 128, width: 64, height: 64 }, stretch: true },
  { id: 2, key: 'piece-2', source: { x: 256, y: 0, width: 64, height: 64 }, stretch: true },
  { id: 8, key: 'piece-8', source: { x: 256, y: 256, width: 64, height: 64 }, stretch: true },
  { id: 1, key: 'piece-1', source: { x: 4, y: 0, width: 60, height: 64 } },
  { id: 3, key: 'piece-3', source: { x: 384, y: 0, width: 64, height: 64 } },
  { id: 4, key: 'piece-4', source: { x: 640, y: 0, width: 44, height: 64 } },
  { id: 5, key: 'piece-5', source: { x: 4, y: 128, width: 60, height: 64 } },
  { id: 6, key: 'piece-6', source: { x: 640, y: 128, width: 44, height: 64 } },
  { id: 7, key: 'piece-7', source: { x: 4, y: 256, width: 188, height: 92 } },
  { id: 9, key: 'piece-9', source: { x: 384, y: 256, width: 64, height: 64 } },
  { id: 10, key: 'piece-10', source: { x: 512, y: 256, width: 172, height: 98 } },
];

const slotPieces: SlotPiece[] = [
  { id: 1, key: 'slot-piece-1', source: { x: 43, y: 8, width: 21, height: 56 } },
  { id: 2, key: 'slot-piece-2', source: { x: 128, y: 8, width: 64, height: 56 } },
  { id: 3, key: 'slot-piece-3', source: { x: 256, y: 8, width: 24, height: 56 } },
  { id: 4, key: 'slot-piece-4', source: { x: 43, y: 128, width: 21, height: 64 } },
  { id: 5, key: 'slot-piece-5', source: { x: 128, y: 128, width: 64, height: 64 } },
  { id: 6, key: 'slot-piece-6', source: { x: 256, y: 128, width: 24, height: 64 } },
  { id: 7, key: 'slot-piece-7', source: { x: 43, y: 256, width: 21, height: 47 } },
  { id: 8, key: 'slot-piece-8', source: { x: 128, y: 256, width: 64, height: 47 } },
  { id: 9, key: 'slot-piece-9', source: { x: 256, y: 256, width: 24, height: 47 } },
];

const slotItems: SlotItem[] = [
  { slotIndex: 0, frame: 30, displayScale: 0.62 },
  { slotIndex: 1, frame: 28, displayScale: 0.6 },
  { slotIndex: 2, frame: 12, displayScale: 0.6 },
  { slotIndex: 3, frame: 10, displayScale: 0.6 },
];

function getBannerWidth(viewportWidth: number) {
  return Math.max(
    MIN_BANNER_WIDTH,
    Math.min(MAX_BANNER_WIDTH, viewportWidth - HORIZONTAL_MARGIN),
  );
}

function centerBetween(left: number, right: number) {
  return left + (right - left) / 2;
}

function roundLayoutValue(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function getSlotStep(viewportWidth: number) {
  return Math.min(MAX_SLOT_STEP, Math.floor(getBannerWidth(viewportWidth) * 0.1691176471));
}

function getSlotSize(viewportWidth: number) {
  return Math.min(MAX_SLOT_SIZE, Math.floor(getBannerWidth(viewportWidth) * 0.1617647059 - 8));
}

function getSlotCenterX(viewportWidth: number, slotIndex: number) {
  const step = getSlotStep(viewportWidth);
  const startX = -step * (SLOT_COUNT - 1) / 2;
  return roundLayoutValue(startX + step * slotIndex);
}

function getSlotTargets(viewportWidth: number): SlotPieceTarget[] {
  const step = getSlotStep(viewportWidth);
  const startX = -step * (SLOT_COUNT - 1) / 2;
  const slotSize = getSlotSize(viewportWidth);
  const cellSize = slotSize / 3;

  return Array.from({ length: SLOT_COUNT }, (_, slotIndex) => {
    const slotCenterX = startX + step * slotIndex;
    const left = slotCenterX - slotSize / 2;
    const top = SLOT_CENTER_Y - slotSize / 2;

    return slotPieces.map((piece) => {
      const column = (piece.id - 1) % 3;
      const row = Math.floor((piece.id - 1) / 3);

      return {
        ...piece,
        slotIndex,
        target: {
          x: roundLayoutValue(left + cellSize * column + cellSize / 2),
          y: roundLayoutValue(top + cellSize * row + cellSize / 2),
          width: roundLayoutValue(cellSize),
          height: roundLayoutValue(cellSize),
        },
      };
    });
  }).flat();
}

function getSlotCursorTarget(viewportWidth: number, slotIndex: number): SlotCursorTarget {
  const step = getSlotStep(viewportWidth);
  const clampedSlotIndex = Math.max(0, Math.min(SLOT_COUNT - 1, slotIndex));

  return {
    x: getSlotCenterX(viewportWidth, clampedSlotIndex),
    y: SLOT_CENTER_Y,
    width: step,
    height: step,
  };
}

function getSlotItemTargets(viewportWidth: number): SlotItemTarget[] {
  const slotSize = getSlotSize(viewportWidth);

  return slotItems.map((item) => {
    const itemSize = Math.floor(slotSize * item.displayScale);

    return {
      ...item,
      target: {
        x: getSlotCenterX(viewportWidth, item.slotIndex),
        y: SLOT_CENTER_Y,
        width: itemSize,
        height: itemSize,
      },
    };
  });
}

function getBannerPieceTargets(viewportWidth: number): BannerPieceTarget[] {
  const bannerWidth = getBannerWidth(viewportWidth);
  const halfBannerWidth = bannerWidth / 2;
  const leftEdge = -halfBannerWidth;
  const rightEdge = halfBannerWidth;
  const topFillLeft = leftEdge + LEFT_TOP_WIDTH;
  const topFillRight = rightEdge - RIGHT_TOP_WIDTH;
  const bottomFillLeft = leftEdge + LEFT_BOTTOM_WIDTH;
  const bottomFillRight = rightEdge - RIGHT_BOTTOM_WIDTH;
  const leftOuterX = -halfBannerWidth + scaled(30);
  const rightOuterX = halfBannerWidth - scaled(22);

  const targets: Record<BannerPieceId, BannerPieceTarget['target']> = {
    2: {
      x: centerBetween(topFillLeft, topFillRight),
      y: -56,
      width: topFillRight - topFillLeft,
      height: scaled(64),
    },
    0: {
      x: centerBetween(leftEdge + LEFT_TOP_WIDTH, rightEdge - scaled(44)),
      y: -24,
      width: rightEdge - scaled(44) - (leftEdge + LEFT_TOP_WIDTH),
      height: scaled(64),
    },
    8: {
      x: centerBetween(bottomFillLeft, bottomFillRight),
      y: 8,
      width: bottomFillRight - bottomFillLeft,
      height: scaled(64),
    },
    1: {
      x: leftOuterX,
      y: -56,
      width: scaled(60),
      height: scaled(64),
    },
    3: {
      x: rightEdge - scaled(44) - scaled(32),
      y: -56,
      width: scaled(64),
      height: scaled(64),
    },
    4: {
      x: rightOuterX,
      y: -56,
      width: scaled(44),
      height: scaled(64),
    },
    5: {
      x: leftOuterX,
      y: -24,
      width: scaled(60),
      height: scaled(64),
    },
    6: {
      x: rightOuterX,
      y: -24,
      width: scaled(44),
      height: scaled(64),
    },
    7: {
      x: -halfBannerWidth + scaled(94),
      y: 15,
      width: scaled(188),
      height: scaled(92),
    },
    9: {
      x: rightEdge - scaled(172) - scaled(32),
      y: 8,
      width: scaled(64),
      height: scaled(64),
    },
    10: {
      x: halfBannerWidth - scaled(86),
      y: 16.5,
      width: scaled(172),
      height: scaled(98),
    },
  };

  return bannerPieces.map((piece) => ({
    ...piece,
    target: targets[piece.id],
  }));
}

function getHudTransform(viewportWidth: number, viewportHeight: number) {
  return {
    x: Math.round(viewportWidth / 2),
    y: Math.round(viewportHeight - HUD_BOTTOM_INSET - HUD_BOTTOM_EXTENT),
    scale: 1,
  };
}

export const gameHudLayout = {
  bannerPieces,
  slotPieces,
  slotItems,
  getBannerWidth,
  getBannerPieceTargets,
  getSlotTargets,
  getSlotCursorTarget,
  getSlotItemTargets,
  getHudTransform,
};
