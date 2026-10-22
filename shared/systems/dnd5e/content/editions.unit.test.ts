import { describe, expect, it } from 'vitest';

import { editionOfKey } from './editions';

describe('editionOfKey', () => {
  it.each([
    ['dnd5e:srd-5.1:spell:fireball', '2014'],
    ['dnd5e:srd-5.2:spell:fireball', '2024'],
    ['dnd5e:homebrew-x:spell:fireball', null],
    ['nope', null],
  ])('%s → %s', (key, edition) => {
    expect(editionOfKey(key)).toBe(edition);
  });
});
