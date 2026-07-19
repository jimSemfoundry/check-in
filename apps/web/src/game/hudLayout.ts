export const gameHudLayout = {
  bannerSourceFrame: {
    x: 0,
    y: 0,
    width: 704,
    height: 384,
  },
  bannerDisplaySize: {
    width: 352,
    height: 192,
  },
  bannerVisibleBounds: {
    left: -174,
    top: -96,
    right: 166,
    bottom: 81,
    centerX: -4,
    centerY: -7.5,
  },
  woodTableSlotsDisplaySize: {
    width: 96,
    height: 96,
  },
  woodTableSlotsOffset: {
    x: -4,
    y: -7.5,
  },
  bottomGap: 18,
  getHudTransform(width: number, height: number) {
    const scale = Math.min(width / (this.bannerDisplaySize.width + 24), 1);

    return {
      x: width / 2 - this.bannerVisibleBounds.centerX * scale,
      y: height - this.bottomGap - this.bannerVisibleBounds.bottom * scale,
      scale,
    };
  },
} as const;
