import type { AttributeKey } from './types';

export function getModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

/**
 * D&D 5e: +2 at level 1–4, +1 every 4 levels after.
 */
export function getProficiencyBonus(level: number): number {
  return 2 + Math.floor((level - 1) / 4);
}

/**
 * What a "half proficiency" feature adds to one ability check: half the proficiency bonus, rounded
 * as the feature says. Nothing when the check already has the bonus (a proficient skill) or is of
 * an ability the feature leaves out. It never applies to a saving throw: don't call it for one.
 */
export function getHalfProficiencyBonus(
  half: { rounding: 'down' | 'up'; abilities?: readonly AttributeKey[] },
  level: number,
  ability: AttributeKey,
  isProficient: boolean,
): number {
  if (isProficient || (half.abilities && !half.abilities.includes(ability))) return 0;
  const bonus = getProficiencyBonus(level) / 2;
  return half.rounding === 'up' ? Math.ceil(bonus) : Math.floor(bonus);
}

export function calculateSkillValue(
  attributeValue: number,
  level: number,
  isProficient: boolean,
  expertise: boolean = false,
): number {
  const mod = getModifier(attributeValue);
  let bonus = 0;
  if (isProficient) {
    const pb = getProficiencyBonus(level);
    bonus = expertise ? pb * 2 : pb;
  }
  return mod + bonus;
}

export function calculateSavingThrow(
  attributeValue: number,
  level: number,
  isProficient: boolean,
): number {
  const mod = getModifier(attributeValue);
  const pb = isProficient ? getProficiencyBonus(level) : 0;
  return mod + pb;
}

export function calculatePassivePerception(
  wisValue: number,
  level: number,
  isPerceptionProficient: boolean,
  hasPerceptionExpertise: boolean = false,
): number {
  return 10 + calculateSkillValue(wisValue, level, isPerceptionProficient, hasPerceptionExpertise);
}

export function calculatePassiveInsight(
  wisValue: number,
  level: number,
  isInsightProficient: boolean,
  hasInsightExpertise: boolean = false,
): number {
  return 10 + calculateSkillValue(wisValue, level, isInsightProficient, hasInsightExpertise);
}
