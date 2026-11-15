import { getModifier } from './calculations';
import type { ClassContent } from './class-resources';
import { ATTRIBUTE_KEYS } from './constants';
import type { Edition } from './content/editions';
import type { HitDie } from './hit-dice';
import { followsSrd2014 } from './sheet-values';
import type { AttributeKey } from './types';

/*
 * What the class gives a sheet, and what the sheet shows once the player's own changes are on top
 * (docs/class-sheet-map.md, "Contrato de valores"). The class default is computed here and never
 * stored. The sheet, the server and the demo all read through this file, so the rule lives once.
 */

/** Something the class lets the player pick at level 1. */
export interface ClassChoiceDefault {
  /**
   * Stable across languages: `<edition>/<class>/<choice>`, e.g. `2014/bard/skills`. What was
   * picked or dismissed for one class is never counted for another.
   */
  key: string;
  kind: 'skills' | 'tools';
  count: number;
  /** Skill keys, or the kinds of tool (`musical-instrument`, `artisan-tools`). */
  from: string[];
}

/** What a level 1 character of the class starts with, by id. */
export interface ClassDefaults {
  hitDie: HitDie;
  /** Level 1: the die's maximum plus the Constitution modifier, at least 1. */
  hpMax: number;
  savingThrows: AttributeKey[];
  armor: string[];
  weapons: string[];
  /** Martial weapons with any of these properties, on top of `weapons` (SRD 5.2 only so far). */
  martialWeaponsWithProperty?: string[];
  tools: string[];
  spellcastingAbility?: AttributeKey;
  choices: ClassChoiceDefault[];
}

type DefaultsContent = Pick<
  ClassContent,
  'classId' | 'edition' | 'hitDie' | 'proficiencies' | 'spellcasting'
>;

/**
 * The class's defaults, or null when the sheet does not follow the class: no edition yet, the
 * 2024 edition, or a class that is not one of the SRD's (`content` is null for those).
 */
export function classDefaults(
  edition: Edition | undefined,
  content: DefaultsContent | null,
  attributes: Record<AttributeKey, number>,
): ClassDefaults | null {
  if (!content || !followsSrd2014(edition) || !followsSrd2014(content.edition)) return null;
  const { classId, hitDie, proficiencies, spellcasting } = content;
  const { skills, toolChoice, martialWeaponsWithProperty } = proficiencies;
  const key = (choice: string) => `${content.edition}/${classId}/${choice}`;

  return {
    hitDie: `d${hitDie}`,
    hpMax: Math.max(1, hitDie + getModifier(attributes.CON)),
    savingThrows: [...proficiencies.savingThrows],
    armor: [...proficiencies.armor],
    weapons: [...proficiencies.weapons],
    ...(martialWeaponsWithProperty && { martialWeaponsWithProperty }),
    tools: [...proficiencies.tools],
    ...(spellcasting && { spellcastingAbility: spellcasting.ability }),
    choices: [
      { key: key('skills'), kind: 'skills', count: skills.count, from: [...skills.from] },
      ...(toolChoice
        ? [
            {
              key: key('tools'),
              kind: 'tools' as const,
              count: toolChoice.count,
              from: [...toolChoice.from],
            },
          ]
        : []),
    ],
  };
}

/** What the sheet stores: only the saving throws the player set by hand, on or off. */
export type SavedSavingThrows = Partial<Record<AttributeKey, boolean>>;

export interface EffectiveSavingThrow {
  /** What the sheet shows and rolls with. */
  proficient: boolean;
  /** `inherit`: nothing stored, the class decides. `manual`: the player set it, and it wins. */
  source: 'inherit' | 'manual';
  /** What the class gives; false when the sheet does not follow a class. */
  classDefault: boolean;
}

/**
 * Saving throw proficiency by ability: the value the player stored when there is one, else what
 * the class gives. A stored `false` is a choice (the class's proficiency turned off), not the
 * same as nothing stored. Without a class to follow, nothing stored is not proficient.
 */
export function effectiveSavingThrows(
  saved: SavedSavingThrows | undefined,
  defaults: Pick<ClassDefaults, 'savingThrows'> | null,
): Record<AttributeKey, EffectiveSavingThrow> {
  return Object.fromEntries(
    ATTRIBUTE_KEYS.map((key) => {
      const classDefault = defaults?.savingThrows.includes(key) ?? false;
      const stored = saved?.[key];
      const manual = typeof stored === 'boolean';
      return [
        key,
        {
          proficient: manual ? stored : classDefault,
          source: manual ? 'manual' : 'inherit',
          classDefault,
        },
      ];
    }),
  ) as Record<AttributeKey, EffectiveSavingThrow>;
}
