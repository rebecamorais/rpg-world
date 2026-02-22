import type { CharacterBase } from '@/types/character';

import type { SkillKey } from './constants';

export type AttributeKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface CharacterSkill {
  isProficient: boolean;
  expertise?: boolean;
}

export interface DnD5eCharacterData {
  race: string;
  class: string;
  level: number;
  hpCurrent: number;
  hpMax: number;
  hpTemp?: number;
  manaCurrent?: number;
  manaMax?: number;
  ac: number;
  speed: number;
  initiative: number;
  attributes: Record<AttributeKey, number>;
  skills: Partial<Record<SkillKey, CharacterSkill>>;
  savingThrowProficiencies: Record<AttributeKey, boolean>;
  spells?: string[];
  passivePerception?: number;
}

export type DnD5eCharacter = CharacterBase & {
  system: 'DnD_5e';
} & DnD5eCharacterData;
