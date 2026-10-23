import type { Edition } from '@shared/systems/dnd5e/content/editions';

export enum SpellSchool {
  ABJURATION = 'abjuration',
  CONJURATION = 'conjuration',
  DIVINATION = 'divination',
  ENCHANTMENT = 'enchantment',
  EVOCATION = 'evocation',
  ILLUSION = 'illusion',
  NECROMANCY = 'necromancy',
  TRANSMUTATION = 'transmutation',
}

export enum CharacterClass {
  BARBARIAN = 'barbarian',
  BARD = 'bard',
  CLERIC = 'cleric',
  DRUID = 'druid',
  FIGHTER = 'fighter',
  MONK = 'monk',
  PALADIN = 'paladin',
  RANGER = 'ranger',
  ROGUE = 'rogue',
  SORCERER = 'sorcerer',
  WARLOCK = 'warlock',
  WIZARD = 'wizard',
}

export interface Spell {
  id: string;
  edition?: Edition;
  /** The description isn't in the app's language yet and shows in English. */
  untranslated?: boolean;
  name: string;
  level: number;
  school: SpellSchool | string;
  classes?: (CharacterClass | string)[];
  components?: string[];
  description?: string;
  higherLevel?: string | null;
  material?: string | null;
  concentration?: boolean;
  ritual?: boolean;
  materialCost?: number;
  isScaling?: boolean;
  castingTime?: string | null;
  castingValue?: number | null;
  /** Other ways to cast it (Plant Growth: 1 action, or 8 hours). */
  extraCastingTimes?: { castingTime: string; castingValue: number }[];
  /** When a reaction or bonus action is taken ("which you take when…"). */
  trigger?: string | null;
  durationUnit?: string | null;
  durationValue?: number | null;
  rangeUnit?: string | null;
  rangeValue?: number | null;
  damageType?: string | null;
  spellCategory?: string;
  bgStyleId?: string | null;
  isPrepared?: boolean;
}
