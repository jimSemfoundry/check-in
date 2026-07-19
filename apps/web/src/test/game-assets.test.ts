import { describe, expect, it } from 'vitest';
import { tinySwordsAssets } from '../game/assets';

describe('tiny swords asset manifest', () => {
  it('loads the compact island from the original Tiny Swords terrain tileset files', () => {
    expect(tinySwordsAssets).toEqual({
      sea: '/game/tiny-swords/Terrain/Tileset/Water Background color.png',
      terrainTiles: '/game/tiny-swords/Terrain/Tileset/Tilemap_color1.png',
      waterFoam: '/game/tiny-swords/Terrain/Tileset/Water Foam.png',
      trees: {
        tree1: '/game/tiny-swords/Terrain/Resources/Wood/Trees/Tree1.png',
        tree2: '/game/tiny-swords/Terrain/Resources/Wood/Trees/Tree2.png',
        tree3: '/game/tiny-swords/Terrain/Resources/Wood/Trees/Tree3.png',
        tree4: '/game/tiny-swords/Terrain/Resources/Wood/Trees/Tree4.png',
      },
      sheep: {
        idle: '/game/tiny-swords/Terrain/Resources/Meat/Sheep/Sheep_Idle.png',
        move: '/game/tiny-swords/Terrain/Resources/Meat/Sheep/Sheep_Move.png',
        grass: '/game/tiny-swords/Terrain/Resources/Meat/Sheep/Sheep_Grass.png',
      },
      hud: {
        storeBanner:
          '/game/tiny-swords/UI Elements/UI Banners from the store page/Banner/Banner.png',
        woodTableSlots:
          '/game/tiny-swords/UI Elements/UI Elements/Wood Table/WoodTable_Slots.png',
      },
    });
    expect(tinySwordsAssets).not.toHaveProperty('clouds');
    expect(tinySwordsAssets).not.toHaveProperty('rocks');
  });
});
