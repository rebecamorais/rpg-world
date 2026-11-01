import { describe, expect, it } from 'vitest';

import {
  CharacterAlignment,
  CharacterBackground,
  CharacterRace,
} from '@frontend/constants/character-choices';
import { CharacterClass } from '@frontend/types/spells';

import {
  matchCharacterAlignment,
  matchCharacterBackground,
  matchCharacterClass,
  matchCharacterRace,
} from './character-choices';

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

const BACKGROUNDS_PT: Record<CharacterBackground, string> = {
  [CharacterBackground.ACOLYTE]: 'Acólito',
  [CharacterBackground.CRIMINAL]: 'Criminoso',
  [CharacterBackground.SAGE]: 'Sábio',
  [CharacterBackground.SOLDIER]: 'Soldado',
};

describe('matchCharacterBackground', () => {
  it.each([
    ['sage', CharacterBackground.SAGE],
    ['Sábio', CharacterBackground.SAGE],
    ['Sábia', CharacterBackground.SAGE],
    ['Acólita do templo', CharacterBackground.ACOLYTE],
  ])('%s → %s', (text, expected) => {
    expect(matchCharacterBackground(text, (b) => BACKGROUNDS_PT[b])).toBe(expected);
  });

  it('um antecedente fora do SRD é do jogador', () => {
    expect(matchCharacterBackground('Nobre', (b) => BACKGROUNDS_PT[b])).toBeNull();
  });
});

const ALIGNMENTS_PT: Partial<Record<CharacterAlignment, string>> = {
  [CharacterAlignment.NEUTRAL_GOOD]: 'Neutro e Bom',
  [CharacterAlignment.NEUTRAL]: 'Neutro',
  [CharacterAlignment.NEUTRAL_EVIL]: 'Neutro e Mau',
};
const alignmentLabelOf = (a: CharacterAlignment) => ALIGNMENTS_PT[a] ?? a;

describe('matchCharacterAlignment', () => {
  it.each([
    ['neutral-good', CharacterAlignment.NEUTRAL_GOOD],
    ['Neutro e Bom', CharacterAlignment.NEUTRAL_GOOD],
    ['NEUTRO E MAU', CharacterAlignment.NEUTRAL_EVIL],
    ['Leal Bom', CharacterAlignment.LAWFUL_GOOD],
    ['CE', CharacterAlignment.CHAOTIC_EVIL],
    ['NB', CharacterAlignment.NEUTRAL_GOOD],
    ['Neutro', CharacterAlignment.NEUTRAL],
  ])('%s → %s', (text, expected) => {
    expect(matchCharacterAlignment(text, alignmentLabelOf)).toBe(expected);
  });

  it('só o texto inteiro conta: "Neutro, tendendo ao caos" não vira Neutro', () => {
    expect(matchCharacterAlignment('Neutro, tendendo ao caos', alignmentLabelOf)).toBeNull();
  });
});
