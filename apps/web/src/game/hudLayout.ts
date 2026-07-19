const BANNER_PIECE_SCALE = 0.5;
const MAX_ROW_WIDTH = 408;
const HORIZONTAL_MARGIN = 48;

type BannerRow = 'top' | 'middle' | 'bottom';

type BannerPieceSource = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type BannerPieceTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type BannerPieceRole = 'left' | 'leftCenter' | 'center' | 'rightCenter' | 'right';

type BannerPiece = {
  key: string;
  row: BannerRow;
  role: BannerPieceRole;
  source: BannerPieceSource;
  target: BannerPieceTarget;
};

function piece(
  row: BannerRow,
  role: BannerPieceRole,
  source: BannerPieceSource,
): BannerPiece {
  const key = `hud-banner-piece-${source.x}-${source.y}-${source.width}-${source.height}`;

  return {
    key,
    row,
    role,
    source,
    target: {
      x: 0,
      y: 0,
      width: source.width * BANNER_PIECE_SCALE,
      height: source.height * BANNER_PIECE_SCALE,
    },
  };
}

function getRowY(row: BannerRow) {
  if (row === 'top') return -64;
  if (row === 'middle') return -24;
  return 24;
}

function getRoleX(role: BannerPieceRole, rowWidth: number, pieceWidth: number) {
  if (role === 'left') return -rowWidth / 2 + pieceWidth / 2;
  if (role === 'right') return rowWidth / 2 - pieceWidth / 2;
  if (role === 'leftCenter') return -18;
  if (role === 'rightCenter') return 18;
  return 0;
}

export const gameHudLayout = {
  bannerPieces: [
    piece('top', 'left', { x: 4, y: 0, width: 60, height: 64 }),
    piece('top', 'leftCenter', { x: 256, y: 0, width: 64, height: 64 }),
    piece('top', 'rightCenter', { x: 384, y: 0, width: 64, height: 64 }),
    piece('top', 'right', { x: 640, y: 0, width: 44, height: 64 }),
    piece('middle', 'left', { x: 4, y: 128, width: 60, height: 64 }),
    piece('middle', 'center', { x: 320, y: 128, width: 64, height: 64 }),
    piece('middle', 'right', { x: 640, y: 128, width: 44, height: 64 }),
    piece('bottom', 'left', { x: 4, y: 256, width: 188, height: 92 }),
    piece('bottom', 'leftCenter', { x: 256, y: 256, width: 64, height: 64 }),
    piece('bottom', 'rightCenter', { x: 384, y: 256, width: 64, height: 64 }),
    piece('bottom', 'right', { x: 512, y: 256, width: 172, height: 98 }),
  ],
  bannerBounds: {
    left: -204,
    top: -80,
    right: 204,
    bottom: 49,
    width: 408,
    height: 129,
  },
  bottomGap: 18,
  getRowWidth(width: number) {
    return Math.min(Math.max(width - HORIZONTAL_MARGIN, 0), MAX_ROW_WIDTH);
  },
  getBannerPieceTargets(width: number) {
    const rowWidth = this.getRowWidth(width);

    return this.bannerPieces.map((bannerPiece) => ({
      ...bannerPiece,
      target: {
        ...bannerPiece.target,
        x: getRoleX(bannerPiece.role, rowWidth, bannerPiece.target.width),
        y: getRowY(bannerPiece.row),
      },
    }));
  },
  getHudTransform(width: number, height: number) {
    return {
      x: width / 2,
      y: height - this.bottomGap - this.bannerBounds.bottom,
      scale: 1,
    };
  },
} as const;
