import { describe, expect, it } from 'vitest';
import { tinySwordsAssets } from '../game/assets';

describe('tiny swords asset manifest', () => {
  it('loads the compact island from the original Tiny Swords terrain tileset files', () => {
    expect(tinySwordsAssets).toEqual({
      sea: '/game/tiny-swords/Terrain/Tileset/Water Background color.png',
      terrainTiles: '/game/tiny-swords/Terrain/Tileset/Tilemap_color1.png',
      waterFoam: '/game/tiny-swords/Terrain/Tileset/Water Foam.png',
      shadow: '/game/tiny-swords/Terrain/Tileset/Shadow.png',
    });
    expect(tinySwordsAssets).not.toHaveProperty('clouds');
    expect(tinySwordsAssets).not.toHaveProperty('trees');
    expect(tinySwordsAssets).not.toHaveProperty('sheep');
    expect(tinySwordsAssets).not.toHaveProperty('rocks');
  });
});
