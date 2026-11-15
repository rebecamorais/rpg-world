import { getModifier } from './calculations';
import { stepValue } from './class-resources';
import type {
  ClassFeature,
  ClassResource,
  ClassSpellcasting,
  ClassTable,
} from './content/class.schema';
import type { AttributeKey } from './types';

/*
 * What a class gives at a level, from its content: spell slots, spell counts and the numbers of
 * its table. Pure rules: nothing here reads or writes a sheet. Only sheets on the 2014 edition
 * follow them (`CLASS_AUTOMATION`).
 */

/** Slots of a full caster by class level (rows) and spell level, 1st first (SRD 5.1 class tables). */
const FULL_CASTER_SLOTS: readonly (readonly number[])[] = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

const MAX_LEVEL = 20;

/**
 * The spell slots of a class level, by spell level: `[4, 2]` is four 1st-level and two 2nd-level
 * slots. Empty when there are none. A half caster has none at level 1 and then follows the full
 * caster's table at half its level, rounded up. Pact Magic is not in this table (`pactMagic`).
 */
export function slotMaximums(progression: ClassSpellcasting['progression'], level: number) {
  const classLevel = Math.min(Math.trunc(level), MAX_LEVEL);
  if (progression === 'pact' || classLevel < 1) return [];
  if (progression === 'full') return [...FULL_CASTER_SLOTS[classLevel - 1]];
  if (progression === 'half' && classLevel < 2) return [];
  return [...FULL_CASTER_SLOTS[Math.ceil(classLevel / 2) - 1]];
}

/** Pact Magic at a class level: how many slots, all of the same spell level. Null before it is gained. */
export function pactMagic(
  resources: Pick<ClassResource, 'unit' | 'max' | 'spellLevel'>[],
  level: number,
): { slots: number; spellLevel: number } | null {
  const pact = resources.find((resource) => resource.unit === 'spell-slots');
  if (!pact || pact.max.type !== 'steps' || !pact.spellLevel) return null;
  const slots = stepValue(pact.max.steps, level)?.value;
  const spellLevel = stepValue(pact.spellLevel, level)?.value;
  return slots && spellLevel ? { slots, spellLevel } : null;
}

export interface SpellCounts {
  /** Cantrips known; 0 when the class has none. */
  cantrips: number;
  /** Spells known, for a class that learns a fixed number; null for one that prepares. */
  known: number | null;
  /** Spells it can prepare; null for a class that knows a fixed number, or before it casts. */
  prepared: number | null;
  /** Wizard: spells the book holds from levelling alone (copied ones come on top). */
  spellbook: number | null;
}

/** How many cantrips and spells a class has at a level. Informational: nothing blocks on them. */
export function spellCounts(
  spellcasting: ClassSpellcasting,
  level: number,
  attributes: Record<AttributeKey, number>,
): SpellCounts {
  const { ability, progression, cantrips, spellsKnown, prepared, spellbook } = spellcasting;
  // A paladin prepares nothing at level 1: the feature comes with the first slots
  const casts = progression === 'pact' || slotMaximums(progression, level).length > 0;
  return {
    cantrips: (cantrips && stepValue(cantrips, level)?.value) ?? 0,
    known: spellsKnown ? (stepValue(spellsKnown, level)?.value ?? 0) : null,
    prepared:
      prepared && casts
        ? Math.max(1, getModifier(attributes[ability]) + Math.floor(level / prepared.levelDivisor))
        : null,
    spellbook:
      spellbook && level >= 1 ? spellbook.initial + spellbook.perLevel * (level - 1) : null,
  };
}

/** A number of the class table at a level (see `ClassTable` for what it means); null before it is gained. */
export function tableValue(table: Pick<ClassTable, 'values'>, level: number): number | null {
  return stepValue(table.values, level)?.value ?? null;
}

/** A feature that adds half the proficiency bonus to ability checks made without it. */
export interface HalfProficiency {
  rounding: 'down' | 'up';
  /** Only checks of these abilities; every ability when absent. */
  abilities?: readonly AttributeKey[];
}

/** SRD 5.1: Jack of All Trades (bard) and Remarkable Athlete (Champion), by feature id. */
const HALF_PROFICIENCY_FEATURES: Record<string, HalfProficiency> = {
  'jack-of-all-trades': { rounding: 'down' },
  'remarkable-athlete': { rounding: 'up', abilities: ['STR', 'DEX', 'CON'] },
};

/** The half proficiency a class (with its subclass) has at a level, if any. */
export function halfProficiencyAt(features: ClassFeature[], level: number): HalfProficiency | null {
  const feature = features.find(
    (f) => f.level <= level && Object.hasOwn(HALF_PROFICIENCY_FEATURES, f.id),
  );
  return feature ? HALF_PROFICIENCY_FEATURES[feature.id] : null;
}
