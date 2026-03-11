export function getModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

/**
 * D&D 5e: +2 at level 1–4, +1 every 4 levels after.
 */
export function getProficiencyBonus(level: number): number {
  return 2 + Math.floor((level - 1) / 4);
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
