import type { CharacterBase } from '@/types/character';

export type AttributeKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface DnD5eCharacterData {
  race: string;
  class: string;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  initiative: number;
  attributes: Record<AttributeKey, number>;
  skillProficiencies: Record<string, boolean>;
  savingThrowProficiencies: Record<AttributeKey, boolean>;
}

export type DnD5eCharacter = CharacterBase & {
  system: 'DnD_5e';
} & DnD5eCharacterData;
