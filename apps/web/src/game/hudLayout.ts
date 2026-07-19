const BANNER_PIECE_SCALE = 0.5;

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

function piece(
  prefix: string,
  source: BannerPieceSource,
  target: { x: number; y: number; width?: number; height?: number },
): {
  key: string;
  source: BannerPieceSource;
  target: BannerPieceTarget;
} {
  const key = `${prefix}-${source.x}-${source.y}-${source.width}-${source.height}`;

  return {
    key,
    source,
    target: {
      x: target.x,
      y: target.y,
      width: target.width ?? source.width * BANNER_PIECE_SCALE,
      height: target.height ?? source.height * BANNER_PIECE_SCALE,
    },
  };
}

export const gameHudLayout = {
  bannerFillPiece: piece(
    'hud-banner-fill-piece',
    { x: 320, y: 128, width: 64, height: 64 },
    { x: 0, y: 0, width: 200, height: 96 },
  ),
  bannerFillBounds: {
    left: -100,
    top: -48,
    right: 100,
    bottom: 48,
    width: 200,
    height: 96,
  },
  bannerPieces: [
    piece('hud-banner-piece', { x: 4, y: 0, width: 60, height: 64 }, { x: -100, y: -40.5 }),
    piece('hud-banner-piece', { x: 256, y: 0, width: 64, height: 64 }, { x: -16, y: -40.5 }),
    piece('hud-banner-piece', { x: 384, y: 0, width: 64, height: 64 }, { x: 16, y: -40.5 }),
    piece('hud-banner-piece', { x: 640, y: 0, width: 44, height: 64 }, { x: 89, y: -40.5 }),
    piece('hud-banner-piece', { x: 4, y: 128, width: 60, height: 64 }, { x: -100, y: -8.5 }),
    piece('hud-banner-piece', { x: 320, y: 128, width: 64, height: 64 }, { x: 0, y: -8.5 }),
    piece('hud-banner-piece', { x: 640, y: 128, width: 44, height: 64 }, { x: 89, y: -8.5 }),
    piece('hud-banner-piece', { x: 4, y: 256, width: 188, height: 92 }, { x: -63, y: 10.5 }),
    piece('hud-banner-piece', { x: 256, y: 256, width: 64, height: 64 }, { x: -16, y: 24.5 }),
    piece('hud-banner-piece', { x: 384, y: 256, width: 64, height: 64 }, { x: 16, y: 24.5 }),
    piece('hud-banner-piece', { x: 512, y: 256, width: 172, height: 98 }, { x: 63, y: 7.5 }),
  ],
  bannerBounds: {
    left: -110,
    top: -56.5,
    right: 106,
    bottom: 56.5,
    width: 216,
    height: 113,
  },
  bottomGap: 18,
  getHudTransform(width: number, height: number) {
    const scale = Math.min(width / (this.bannerBounds.width + 24), 1);

    return {
      x: width / 2,
      y: height - this.bottomGap - this.bannerBounds.bottom * scale,
      scale,
    };
  },
} as const;
