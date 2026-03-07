import type { CharacterBase } from '@shared/types/character';

import type { SkillKey } from './constants';

export type AttributeKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface CharacterSkill {
  isProficient: boolean;
  expertise?: boolean;
}

export interface DnD5eCharacterData {
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

  hitDice?: { total: string; current: number };
  deathSaves?: { successes: number; failures: number };

  attributes: Record<AttributeKey, number>;
  skills: Partial<Record<SkillKey, CharacterSkill>>;
  savingThrowProficiencies: Record<AttributeKey, boolean>;
  passivePerception?: number;

  spellcastingSystem?: 'slots' | 'points';
  spellcastingAbility?: AttributeKey;
  spellSaveDc?: number;
  spellAttackBonus?: number;
  spellSlots?: Record<string, { max: number; used: number }>;
  spellPoints?: { max: number; current: number };
  spellsKnown?: string[];

  coins?: { cp: number; sp: number; ep: number; gp: number; pp: number };
}

export type DnD5eCharacter = CharacterBase & {
  system: 'DnD_5e';
} & DnD5eCharacterData;
