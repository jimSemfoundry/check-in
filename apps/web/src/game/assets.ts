const tinySwordsBase = '/game/tiny-swords';

export const tinySwordsAssets = {
  sea: `${tinySwordsBase}/water-background.png`,
  islandTiles: `${tinySwordsBase}/grass-tiles.png`,
  islandCenter: `${tinySwordsBase}/grass-center.png`,
  rockTiles: `${tinySwordsBase}/scene-layout.png`,
  waterFoam: `${tinySwordsBase}/water-foam.png`,
} as const;

export const tinySwordsAssetNotes = {
  source: `${tinySwordsBase}/SOURCE.txt`,
} as const;
