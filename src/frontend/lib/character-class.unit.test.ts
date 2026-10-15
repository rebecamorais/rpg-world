import { describe, expect, it } from 'vitest';

import { CharacterClass } from '@frontend/types/spells';

import { matchCharacterClass } from './character-class';

const PT: Partial<Record<CharacterClass, string>> = {
  [CharacterClass.WIZARD]: 'Mago',
  [CharacterClass.CLERIC]: 'Clérigo',
  [CharacterClass.PALADIN]: 'Paladino',
  [CharacterClass.WARLOCK]: 'Bruxo',
};
const labelOf = (cls: CharacterClass) => PT[cls] ?? cls;

describe('matchCharacterClass', () => {
  it.each([
    ['Wizard', CharacterClass.WIZARD],
    ['mago', CharacterClass.WIZARD],
    ['CLERIGO', CharacterClass.CLERIC],
    ['Clérigo 5', CharacterClass.CLERIC],
    ['Paladino/Bruxo', CharacterClass.PALADIN],
  ])('%s → %s', (text, expected) => {
    expect(matchCharacterClass(text, labelOf)).toBe(expected);
  });

  it.each([[''], [null], [undefined], ['Artífice'], ['Magoado']])(
    '%s não é uma classe do sistema',
    (text) => {
      expect(matchCharacterClass(text, labelOf)).toBeNull();
    },
  );
});
