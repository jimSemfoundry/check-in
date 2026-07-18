import { describe, expect, it } from 'vitest';
import { tinySwordsAssets } from '../game/assets';

describe('tiny swords asset manifest', () => {
  it('lists only the asset groups required for the compact rock island scene', () => {
    expect(tinySwordsAssets).toMatchObject({
      sea: expect.stringContaining('/game/tiny-swords/'),
      islandTiles: expect.stringContaining('/game/tiny-swords/'),
      rockTiles: expect.stringContaining('/game/tiny-swords/'),
      waterFoam: expect.stringContaining('/game/tiny-swords/'),
    });
    expect(tinySwordsAssets).not.toHaveProperty('clouds');
    expect(tinySwordsAssets).not.toHaveProperty('trees');
    expect(tinySwordsAssets).not.toHaveProperty('sheep');
    expect(tinySwordsAssets).not.toHaveProperty('rocks');
  });
});
