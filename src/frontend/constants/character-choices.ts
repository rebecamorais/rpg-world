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

/** The backgrounds of the SRD (5.1 has only the acolyte; 5.2 adds the other three), by id. */
export enum CharacterBackground {
  ACOLYTE = 'acolyte',
  CRIMINAL = 'criminal',
  SAGE = 'sage',
  SOLDIER = 'soldier',
}

/** The nine alignments, by id. */
export enum CharacterAlignment {
  LAWFUL_GOOD = 'lawful-good',
  NEUTRAL_GOOD = 'neutral-good',
  CHAOTIC_GOOD = 'chaotic-good',
  LAWFUL_NEUTRAL = 'lawful-neutral',
  NEUTRAL = 'neutral',
  CHAOTIC_NEUTRAL = 'chaotic-neutral',
  LAWFUL_EVIL = 'lawful-evil',
  NEUTRAL_EVIL = 'neutral-evil',
  CHAOTIC_EVIL = 'chaotic-evil',
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

/** The emblem of each background (game-icons.net). */
export const BACKGROUND_ICONS: Record<CharacterBackground, string> = {
  [CharacterBackground.ACOLYTE]: 'candle-light',
  [CharacterBackground.CRIMINAL]: 'robber-mask',
  [CharacterBackground.SAGE]: 'open-book',
  [CharacterBackground.SOLDIER]: 'spartan-helmet',
};

/** A class of the player's own ("Other…"), or an NPC without one. */
export const UNKNOWN_CLASS_ICON = 'hooded-figure';
