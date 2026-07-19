type BannerPieceId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type BannerPiece = {
  id: BannerPieceId;
  key: string;
  source: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  stretch?: boolean;
};

type BannerPieceTarget = BannerPiece & {
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
const FIXED_EDGE_WIDTH = 52;
const MIN_FILL_WIDTH = 64 * BANNER_PIECE_SCALE;
const HUD_BOTTOM_INSET = 18;
const HUD_BOTTOM_EXTENT = 49;

const scaled = (value: number) => value * BANNER_PIECE_SCALE;

const bannerPieces: BannerPiece[] = [
  { id: 0, key: 'piece-0', source: { x: 320, y: 128, width: 64, height: 64 }, stretch: true },
  { id: 1, key: 'piece-1', source: { x: 4, y: 0, width: 60, height: 64 } },
  { id: 2, key: 'piece-2', source: { x: 256, y: 0, width: 64, height: 64 } },
  { id: 3, key: 'piece-3', source: { x: 384, y: 0, width: 64, height: 64 } },
  { id: 4, key: 'piece-4', source: { x: 640, y: 0, width: 44, height: 64 } },
  { id: 5, key: 'piece-5', source: { x: 4, y: 128, width: 60, height: 64 } },
  { id: 6, key: 'piece-6', source: { x: 640, y: 128, width: 44, height: 64 } },
  { id: 7, key: 'piece-7', source: { x: 4, y: 256, width: 188, height: 92 } },
  { id: 8, key: 'piece-8', source: { x: 256, y: 256, width: 64, height: 64 } },
  { id: 9, key: 'piece-9', source: { x: 384, y: 256, width: 64, height: 64 } },
  { id: 10, key: 'piece-10', source: { x: 512, y: 256, width: 172, height: 98 } },
];

function getBannerWidth(viewportWidth: number) {
  return Math.max(
    FIXED_EDGE_WIDTH + MIN_FILL_WIDTH,
    Math.min(MAX_BANNER_WIDTH, viewportWidth - HORIZONTAL_MARGIN),
  );
}

function getBannerPieceTargets(viewportWidth: number): BannerPieceTarget[] {
  const bannerWidth = getBannerWidth(viewportWidth);
  const fillWidth = Math.max(MIN_FILL_WIDTH, bannerWidth - FIXED_EDGE_WIDTH);
  const halfBannerWidth = bannerWidth / 2;
  const leftOuterX = -halfBannerWidth + scaled(30);
  const rightOuterX = halfBannerWidth - scaled(22);
  const fillX = (leftOuterX + scaled(30) + rightOuterX - scaled(22)) / 2;
  const topLeftInnerX = -halfBannerWidth + scaled(92);
  const topRightInnerX = halfBannerWidth - scaled(120);
  const bottomLeftInnerX = -halfBannerWidth + scaled(220);
  const bottomRightInnerX = halfBannerWidth - scaled(204);

  const targets: Record<BannerPieceId, BannerPieceTarget['target']> = {
    1: {
      x: leftOuterX,
      y: -56,
      width: scaled(60),
      height: scaled(64),
    },
    2: {
      x: topLeftInnerX,
      y: -56,
      width: scaled(64),
      height: scaled(64),
    },
    3: {
      x: topRightInnerX,
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
    0: {
      x: fillX,
      y: -16,
      width: fillWidth,
      height: scaled(224),
    },
    6: {
      x: rightOuterX,
      y: -24,
      width: scaled(44),
      height: scaled(64),
    },
    7: {
      x: -halfBannerWidth + scaled(94),
      y: 24,
      width: scaled(188),
      height: scaled(92),
    },
    8: {
      x: bottomLeftInnerX,
      y: 24,
      width: scaled(64),
      height: scaled(64),
    },
    9: {
      x: bottomRightInnerX,
      y: 24,
      width: scaled(64),
      height: scaled(64),
    },
    10: {
      x: halfBannerWidth - scaled(86),
      y: 24,
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
  getBannerWidth,
  getBannerPieceTargets,
  getHudTransform,
};
