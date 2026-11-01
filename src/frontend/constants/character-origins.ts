import { CharacterClass } from '@frontend/types/spells';

/** The races of the SRD 5.1 and the species of the SRD 5.2, by id. */
export enum CharacterRace {
  DRAGONBORN = 'dragonborn',
  DWARF = 'dwarf',
  ELF = 'elf',
  GNOME = 'gnome',
  GOLIATH = 'goliath',
  HALF_ELF = 'half-elf',
  HALF_ORC = 'half-orc',
  HALFLING = 'halfling',
  HUMAN = 'human',
  ORC = 'orc',
  TIEFLING = 'tiefling',
}

/** The emblem of each class (game-icons.net). */
export const CLASS_ICONS: Record<CharacterClass, string> = {
  [CharacterClass.BARBARIAN]: 'barbarian',
  [CharacterClass.BARD]: 'lyre',
  [CharacterClass.CLERIC]: 'holy-symbol',
  [CharacterClass.DRUID]: 'oak-leaf',
  [CharacterClass.FIGHTER]: 'crossed-swords',
  [CharacterClass.MONK]: 'meditation',
  [CharacterClass.PALADIN]: 'templar-shield',
  [CharacterClass.RANGER]: 'high-shot',
  [CharacterClass.ROGUE]: 'plain-dagger',
  [CharacterClass.SORCERER]: 'fire-spell-cast',
  [CharacterClass.WARLOCK]: 'warlock-eye',
  [CharacterClass.WIZARD]: 'wizard-staff',
};

/** The emblem of each race (game-icons.net). */
export const RACE_ICONS: Record<CharacterRace, string> = {
  [CharacterRace.DRAGONBORN]: 'dragon-head',
  [CharacterRace.DWARF]: 'dwarf-face',
  [CharacterRace.ELF]: 'woman-elf-face',
  [CharacterRace.GNOME]: 'bad-gnome',
  [CharacterRace.GOLIATH]: 'giant',
  [CharacterRace.HALF_ELF]: 'elf-ear',
  [CharacterRace.HALF_ORC]: 'ivory-tusks',
  [CharacterRace.HALFLING]: 'hobbit-door',
  [CharacterRace.HUMAN]: 'person',
  [CharacterRace.ORC]: 'orc-head',
  [CharacterRace.TIEFLING]: 'devil-mask',
};

/** A class or race of the player's own ("Other…"), or an NPC without one. */
export const UNKNOWN_ORIGIN_ICON = 'hooded-figure';
