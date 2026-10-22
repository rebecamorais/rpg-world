import type { Edition } from '@shared/systems/dnd5e/content/editions';

export interface CharacterSpellRelation {
  id: string;
  edition: Edition;
  /** The description isn't in the requested language yet and shows in English. */
  untranslated: boolean;
  name: string;
  level: number;
  school: string;
  isPrepared: boolean;
  createdAt?: string;
  components?: string[];
  concentration?: boolean;
  ritual?: boolean;
  materialCost?: number;
  isScaling?: boolean;
  description?: string;
  higherLevel?: string | null;
  material?: string | null;
  castingTime?: string | null;
  castingValue?: number | null;
  durationUnit?: string | null;
  durationValue?: number | null;
  rangeUnit?: string | null;
  rangeValue?: number | null;
  damageType?: string | null;
  spellCategory?: string;
  bgStyleId?: string | null;
}

/** A spell in a character's spellbook: the content key it points to, e.g. `dnd5e:srd-5.1:spell:fireball`. */
export interface CharacterSpellLink {
  ref: string;
  isPrepared: boolean;
  createdAt?: string;
}

export interface CharacterSpellRepo {
  findByCharacterId(characterId: string): Promise<CharacterSpellLink[]>;
  learn(characterId: string, ref: string): Promise<void>;
  forget(characterId: string, ref: string): Promise<void>;
  togglePrepared(characterId: string, ref: string, isPrepared: boolean): Promise<void>;
}

/** Where the spells themselves come from (the content catalog). */
export interface SpellLookup {
  findByKeys(
    keys: string[],
    locale?: string,
  ): Promise<Omit<CharacterSpellRelation, 'isPrepared' | 'createdAt'>[]>;
}
