import type { AttributeKey } from '../types';

export type SkillKey =
  | 'ACROBATICS'
  | 'ANIMAL_HANDLING'
  | 'ARCANA'
  | 'ATHLETICS'
  | 'DECEPTION'
  | 'HISTORY'
  | 'INSIGHT'
  | 'INTIMIDATION'
  | 'INVESTIGATION'
  | 'MEDICINE'
  | 'NATURE'
  | 'PERCEPTION'
  | 'PERFORMANCE'
  | 'PERSUASION'
  | 'RELIGION'
  | 'SLEIGHT_OF_HAND'
  | 'STEALTH'
  | 'SURVIVAL';

export const SKILLS_CATALOG: Record<SkillKey, { attribute: AttributeKey }> = {
  ACROBATICS: { attribute: 'DEX' },
  ANIMAL_HANDLING: { attribute: 'WIS' },
  ARCANA: { attribute: 'INT' },
  ATHLETICS: { attribute: 'STR' },
  DECEPTION: { attribute: 'CHA' },
  HISTORY: { attribute: 'INT' },
  INSIGHT: { attribute: 'WIS' },
  INTIMIDATION: { attribute: 'CHA' },
  INVESTIGATION: { attribute: 'INT' },
  MEDICINE: { attribute: 'WIS' },
  NATURE: { attribute: 'INT' },
  PERCEPTION: { attribute: 'WIS' },
  PERFORMANCE: { attribute: 'CHA' },
  PERSUASION: { attribute: 'CHA' },
  RELIGION: { attribute: 'INT' },
  SLEIGHT_OF_HAND: { attribute: 'DEX' },
  STEALTH: { attribute: 'DEX' },
  SURVIVAL: { attribute: 'WIS' },
};

export const SKILL_KEYS = Object.keys(SKILLS_CATALOG) as SkillKey[];
