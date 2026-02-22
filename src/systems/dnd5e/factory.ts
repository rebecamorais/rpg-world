import { ATTRIBUTE_KEYS } from './constants';
import type { SkillKey } from './constants';
import type { AttributeKey } from './types';
import type { DnD5eCharacter } from './types';
import type { CharacterSkill } from './types';

const defaultAttributes: Record<AttributeKey, number> = {
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIS: 10,
  CHA: 10,
};

function defaultSkills(): Partial<Record<SkillKey, CharacterSkill>> {
  return {};
}

function defaultSavingThrowProficiencies(): Record<AttributeKey, boolean> {
  return ATTRIBUTE_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: false }),
    {} as Record<AttributeKey, boolean>,
  );
}

export function createDnD5eCharacter(
  ownerUsername: string,
  name: string,
  overrides?: Partial<Omit<DnD5eCharacter, 'id' | 'ownerUsername' | 'system'>>,
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
    speed: overrides?.speed ?? 30, // Default 30ft speed
    initiative: overrides?.initiative ?? 0,
    attributes: { ...defaultAttributes, ...overrides?.attributes },
    skills: overrides?.skills ?? defaultSkills(),
    savingThrowProficiencies:
      overrides?.savingThrowProficiencies ?? defaultSavingThrowProficiencies(),
  };
}
