import { describe, expect, it } from 'vitest';

import { CharacterRace } from '@frontend/constants/character-origins';
import { CharacterClass } from '@frontend/types/spells';

import { matchCharacterClass, matchCharacterRace } from './character-origin';

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
    ['Maga', CharacterClass.WIZARD],
    ['Clériga 3', CharacterClass.CLERIC],
    ['Bruxa', CharacterClass.WARLOCK],
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

const RACES_PT: Partial<Record<CharacterRace, string>> = {
  [CharacterRace.ELF]: 'Elfo',
  [CharacterRace.HALF_ELF]: 'Meio-Elfo',
  [CharacterRace.DWARF]: 'Anão',
  [CharacterRace.HUMAN]: 'Humano',
};
const raceLabelOf = (race: CharacterRace) => RACES_PT[race] ?? race;

describe('matchCharacterRace', () => {
  it.each([
    ['elf', CharacterRace.ELF],
    ['half-elf', CharacterRace.HALF_ELF],
    ['Meio-Elfo', CharacterRace.HALF_ELF],
    ['meio elfa', CharacterRace.HALF_ELF],
    ['Elfa da floresta', CharacterRace.ELF],
    ['ANÃ', CharacterRace.DWARF],
    ['Humana', CharacterRace.HUMAN],
  ])('%s → %s', (text, expected) => {
    expect(matchCharacterRace(text, raceLabelOf)).toBe(expected);
  });

  it.each([['Aasimar'], [''], [null]])('%s não está na lista', (text) => {
    expect(matchCharacterRace(text, raceLabelOf)).toBeNull();
  });
});
