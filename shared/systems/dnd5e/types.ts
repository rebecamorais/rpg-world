import type { CharacterBase } from '@shared/types/character';

import type { ResourceState } from './class-resources';
import type { SkillKey } from './constants';
import type { Edition } from './content/editions';
import type { HitDice, LegacyHitDice } from './hit-dice';

export type AttributeKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface CharacterSkill {
  isProficient: boolean;
  expertise?: boolean;
}

interface DnD5eCharacterData {
  race: string;
  class: string;
  subclass?: string;
  level: number;
  background?: string;
  alignment?: string;
  xp?: number;

  hpCurrent: number;
  hpMax: number;
  hpTemp?: number;
  ac: number;
  speed: number;
  initiative: number;

  // A copy cached on the client may still hold the legacy shape: read it with `readHitDice`
  hitDice?: HitDice | LegacyHitDice;
  deathSaves?: { successes: number; failures: number };

  attributes: Record<AttributeKey, number>;
  skills: Partial<Record<SkillKey, CharacterSkill>>;
  /** Only the ones set by hand, on or off; the rest follow the class (see `effectiveSavingThrows`). */
  savingThrowProficiencies: Partial<Record<AttributeKey, boolean>>;
  passivePerception?: number;

  spellcastingSystem?: 'slots' | 'points';
  spellcastingAbility?: AttributeKey;
  spellSaveDc?: number;
  spellAttackBonus?: number;
  spellSlots?: Record<string, { max: number; used: number }>;
  spellPoints?: { max: number; current: number };

  // Class resource boxes (Rage, Ki...) and the rules edition they follow
  edition?: Edition;
  resources?: Record<string, ResourceState>;

  // D&D 5e Specific Lore
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  alliesAndEnemies?: string;
  organizations?: string;
  treasure?: string;
}

export type DnD5eCharacter = CharacterBase & {
  system: 'DnD_5e';
} & DnD5eCharacterData;
