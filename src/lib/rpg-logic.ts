export const getModifier = (value: number) => Math.floor((value - 10) / 2);

export const getProficiencyBonus = (level: number) => 1 + Math.ceil(level / 4);

export const calculateSkill = (attrValue: number, level: number, isProficient: boolean) => {
  const mod = getModifier(attrValue);
  const pb = getProficiencyBonus(level);
  return isProficient ? mod + pb : mod;
};