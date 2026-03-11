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

export const SKILLS_CATALOG: Record<SkillKey, { label: string; attribute: AttributeKey }> = {
  ACROBATICS: { label: 'Acrobacia', attribute: 'DEX' },
  ANIMAL_HANDLING: { label: 'Adestrar Animais', attribute: 'WIS' },
  ARCANA: { label: 'Arcanismo', attribute: 'INT' },
  ATHLETICS: { label: 'Atletismo', attribute: 'STR' },
  DECEPTION: { label: 'Enganação', attribute: 'CHA' },
  HISTORY: { label: 'História', attribute: 'INT' },
  INSIGHT: { label: 'Intuição', attribute: 'WIS' },
  INTIMIDATION: { label: 'Intimidação', attribute: 'CHA' },
  INVESTIGATION: { label: 'Investigação', attribute: 'INT' },
  MEDICINE: { label: 'Medicina', attribute: 'WIS' },
  NATURE: { label: 'Natureza', attribute: 'INT' },
  PERCEPTION: { label: 'Percepção', attribute: 'WIS' },
  PERFORMANCE: { label: 'Atuação', attribute: 'CHA' },
  PERSUASION: { label: 'Persuasão', attribute: 'CHA' },
  RELIGION: { label: 'Religião', attribute: 'INT' },
  SLEIGHT_OF_HAND: { label: 'Prestidigitação', attribute: 'DEX' },
  STEALTH: { label: 'Furtividade', attribute: 'DEX' },
  SURVIVAL: { label: 'Sobrevivência', attribute: 'WIS' },
};

export const SKILL_KEYS = Object.keys(SKILLS_CATALOG) as SkillKey[];
