import { describe, expect, it } from 'vitest';
import { tinySwordsAssets } from '../game/assets';

describe('tiny swords asset manifest', () => {
  it('lists every asset group required for the floating island scene', () => {
    expect(tinySwordsAssets).toMatchObject({
      sea: expect.stringContaining('/game/tiny-swords/'),
      islandTiles: expect.stringContaining('/game/tiny-swords/'),
      foam: expect.stringContaining('/game/tiny-swords/'),
      shadow: expect.stringContaining('/game/tiny-swords/'),
      clouds: expect.arrayContaining([expect.stringContaining('/game/tiny-swords/')]),
      trees: expect.arrayContaining([expect.stringContaining('/game/tiny-swords/')]),
      rocks: expect.arrayContaining([expect.stringContaining('/game/tiny-swords/')]),
      sheep: expect.arrayContaining([expect.stringContaining('/game/tiny-swords/')]),
    });
  });
});
