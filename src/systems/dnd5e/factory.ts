import type { AttributeKey } from './types';
import type { DnD5eCharacter } from './types';
import { ATTRIBUTE_KEYS } from './constants';

const defaultAttributes: Record<AttributeKey, number> = {
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIS: 10,
  CHA: 10,
};

function defaultSkillProficiencies(): Record<string, boolean> {
  return {};
}

function defaultSavingThrowProficiencies(): Record<AttributeKey, boolean> {
  return ATTRIBUTE_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: false }),
    {} as Record<AttributeKey, boolean>
  );
}

export function createDnD5eCharacter(
  ownerUsername: string,
  name: string,
  overrides?: Partial<Omit<DnD5eCharacter, 'id' | 'ownerUsername' | 'system'>>
): Omit<DnD5eCharacter, 'id'> {
  return {
    ownerUsername,
    system: 'DnD_5e',
    name: name.trim() || 'Sem nome',
    level: Math.max(1, overrides?.level ?? 1),
    race: overrides?.race ?? '',
    class: overrides?.class ?? '',
    hpCurrent: overrides?.hpCurrent ?? 1,
    hpMax: overrides?.hpMax ?? 1,
    ac: overrides?.ac ?? 10,
    initiative: overrides?.initiative ?? 0,
    attributes: { ...defaultAttributes, ...overrides?.attributes },
    skillProficiencies: overrides?.skillProficiencies ?? defaultSkillProficiencies(),
    savingThrowProficiencies:
      overrides?.savingThrowProficiencies ?? defaultSavingThrowProficiencies(),
  };
}
