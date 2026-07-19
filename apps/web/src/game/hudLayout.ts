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
  woodTableSlotsDisplaySize: {
    width: 96,
    height: 96,
  },
  woodTableSlotsOffset: {
    x: 0,
    y: 0,
  },
  bottomGap: 18,
  getHudTransform(width: number, height: number) {
    const scale = Math.min(width / (this.bannerDisplaySize.width + 24), 1);

    return {
      x: width / 2,
      y: height - this.bannerDisplaySize.height * scale * 0.5 - this.bottomGap,
      scale,
    };
  },
} as const;
