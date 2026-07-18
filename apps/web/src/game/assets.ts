const tinySwordsBase = '/game/tiny-swords';

export const tinySwordsAssets = {
  sea: `${tinySwordsBase}/water-background.png`,
  islandTiles: `${tinySwordsBase}/grass-tiles.png`,
  islandCenter: `${tinySwordsBase}/grass-center.png`,
  foam: `${tinySwordsBase}/scene-layout.png`,
  shadow: `${tinySwordsBase}/scene-layout.png`,
  clouds: [`${tinySwordsBase}/clouds-decor.png`],
  trees: [`${tinySwordsBase}/tree-pine.png`],
  rocks: [`${tinySwordsBase}/rocks.png`],
  sheep: [`${tinySwordsBase}/sheep-idle.png`],
} as const;

export const tinySwordsAssetNotes = {
  source: `${tinySwordsBase}/SOURCE.txt`,
  sheep: 'Temporary local pixel sheep until the original Tiny Swords Free Pack zip is available.',
} as const;
