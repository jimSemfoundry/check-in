import { describe, expect, it } from 'vitest';
import { tinySwordsTerrainTileset } from '../game/terrainTileset';

describe('tiny swords terrain tileset config', () => {
  it('encapsulates the active Tilemap_color1 island tileset', () => {
    expect(tinySwordsTerrainTileset).toMatchObject({
      image: '/game/tiny-swords/Terrain/Tileset/Tilemap_color1.png',
      tileSize: 64,
      platform: {
        widthTiles: 3,
        grassRows: 2,
        rockRows: 1,
        tileOverlapPixels: 1,
      },
      frames: {
        grassRows: [
          [5, 6, 7],
          [23, 24, 25],
        ],
        rockRows: [[50, 51, 52]],
      },
    });
  });
});
