import { z } from 'zod';

import { SKILL_KEYS, type SkillKey } from '../constants/skill';
import type { AttributeKey } from '../types';

const id = z.string().regex(/^[a-z0-9-]+$/);
const level = z.number().int().min(1).max(20);

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const satisfies AttributeKey[];
const ability = z.enum(ABILITIES);

/**
 * A value that changes with the class level: each step holds from its level until the next one,
 * e.g. Rage `[{ level: 1, value: 2 }, { level: 3, value: 3 }, …]`. Levels go up.
 */
const steps = <T extends z.ZodType>(value: T) =>
  z
    .array(z.object({ level, value }))
    .min(1)
    .refine((list) => list.every((step, i) => i === 0 || step.level > list[i - 1].level), {
      message: 'steps must go up in level',
    });

/** A feature, gained at a class level. Its texts are in the i18n file under the same id. */
const featureSchema = z.object({
  /** Unique within its class or subclass, e.g. `rage`; a name that repeats ends in its level. */
  id,
  level,
  /** Where the class table says "subclass feature": the subclass gives one at this level. */
  gainsSubclassFeature: z.literal(true).optional(),
});

/** How many uses (or points) a resource has. */
const resourceMaxSchema = z.discriminatedUnion('type', [
  /** From the class table or the feature's text; `null` is unlimited (Rage at level 20, SRD 5.1). */
  z.object({ type: z.literal('steps'), steps: steps(z.number().int().min(1).nullable()) }),
  /** The class level times `multiplier`: Ki points (1×), Lay on Hands' pool (5×). */
  z.object({ type: z.literal('classLevel'), multiplier: z.number().int().min(1) }),
  /** An ability modifier plus `bonus`, never under `minimum`: Bardic Inspiration (CHA, min. 1). */
  z.object({
    type: z.literal('ability'),
    ability,
    bonus: z.number().int(),
    minimum: z.number().int().min(0),
  }),
]);

/** What a rest gives back: everything, or a number of uses; from a class level on, if given. */
const recoverySchema = z.object({
  rest: z.enum(['short', 'long']),
  amount: z.union([z.literal('all'), z.number().int().min(1)]),
  /** Font of Inspiration: Bardic Inspiration also comes back on a short rest from level 5. */
  fromLevel: level.optional(),
});

/** Something a feature lets you spend and get back on a rest: Rage, Ki, Channel Divinity… */
const resourceSchema = z.object({
  id,
  /** The feature that grants it, in the same class or subclass. */
  feature: id,
  /** The class level it is gained at. */
  level,
  unit: z.enum(['uses', 'points', 'hit-points', 'spell-slots']),
  max: resourceMaxSchema,
  /** Each rest that gives something back. A long rest is listed too, even when a short one is. */
  recovery: z.array(recoverySchema).min(1),
  /** The die it rolls, by level, as its number of faces: Bardic Inspiration d6 → d12. */
  die: steps(
    z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12)]),
  ).optional(),
  /** The spell level of what it casts: pact slots (1 → 5), Mystic Arcanum (6 to 9). */
  spellLevel: steps(z.number().int().min(1).max(9)).optional(),
  /**
   * Resources of the same list that took this one's place: Signature Spells, a pool of 2, became
   * one box per spell (#262). The old one stays only on a sheet that saved something in it, whose
   * meaning the new ones can't keep (#213); there it is shown instead of them.
   */
  replacedBy: z.array(id).min(1).optional(),
});

/** How many options of a kind the class picks, by level: Metamagic, Eldritch Invocations… */
const choiceSchema = z.object({
  id,
  kind: z.enum(['optional-feature', 'feat']),
  /** The option categories, as 5etools codes them, e.g. `MM` (Metamagic), `EI`, `FS:P`, `EB`. */
  categories: z.array(z.string().min(1)).min(1),
  /** The total picked by each level. */
  count: steps(z.number().int().min(1)),
});

/**
 * A number of the class table that is not spent: Rage Damage, Martial Arts, Sneak Attack… What the
 * value is depends on `kind`: a `bonus`, the faces of one `die`, how many `dice` of `faces` faces,
 * or a `speed` bonus in feet (as the book has it; the sheet shows metres).
 */
const tableSchema = z
  .object({
    id,
    /** The feature the number belongs to, in the same class. */
    feature: id,
    kind: z.enum(['bonus', 'die', 'dice', 'speed']),
    /** Only for `dice`: the faces of each die (Sneak Attack rolls d6s). */
    faces: z.number().int().min(2).optional(),
    values: steps(z.number().int().min(1)),
  })
  .refine((table) => (table.kind === 'dice') === (table.faces !== undefined), {
    message: 'faces goes with dice, and only with it',
  });

const spellcastingSchema = z.object({
  ability,
  /** `half-round-up`: half casters that already have slots at level 1 (SRD 5.2). */
  progression: z.enum(['full', 'half', 'half-round-up', 'pact']),
  /** Cantrips known, by level. */
  cantrips: steps(z.number().int().min(1)).optional(),
  /** Classes that learn a fixed number of spells: how many, by level. */
  spellsKnown: steps(z.number().int().min(1)).optional(),
  /**
   * Classes that prepare spells: the ability modifier plus the class level over `levelDivisor`
   * (rounded down), never under 1. Cleric: 1; paladin: 2.
   */
  prepared: z.object({ levelDivisor: z.union([z.literal(1), z.literal(2)]) }).optional(),
  /** Wizard: spells in the spellbook at level 1, and how many each later level adds. */
  spellbook: z
    .object({ initial: z.number().int().min(1), perLevel: z.number().int().min(1) })
    .optional(),
});

const subclassDataSchema = z.object({
  /** Unique within its class, e.g. `berserker`. */
  id,
  features: z.array(featureSchema).min(1),
  resources: z.array(resourceSchema),
});

const skill = z.enum(SKILL_KEYS as [SkillKey, ...SkillKey[]]);

const proficienciesSchema = z.object({
  savingThrows: z.array(ability).length(2),
  armor: z.array(z.enum(['light', 'medium', 'heavy', 'shield'])),
  /** `simple`, `martial`, or the id of a weapon in the same book's items. */
  weapons: z.array(z.string().regex(/^[a-z0-9-]+$/)),
  /** Martial weapons with any of these property codes (as in the items), e.g. `F` and `L`. */
  martialWeaponsWithProperty: z.array(z.string().min(1)).min(1).optional(),
  /** Ids of tools in the same book's items. */
  tools: z.array(z.string().regex(/^[a-z0-9-]+$/)),
  /** Tools picked by the player: so many of one of these kinds. */
  toolChoice: z
    .object({
      count: z.number().int().min(1),
      from: z.array(z.enum(['artisan-tools', 'musical-instrument'])).min(1),
    })
    .optional(),
  /** Skills picked by the player: `count` of `from` (every skill when the class allows any). */
  skills: z.object({ count: z.number().int().min(1), from: z.array(skill).min(1) }),
});

/** Rules data of a class and its SRD subclass, the same in every language. */
export const classDataSchema = z.object({
  /** Unique within its source, e.g. `barbarian`. */
  id,
  /** Faces of the hit die, e.g. 12 for a d12. */
  hitDie: z.union([z.literal(6), z.literal(8), z.literal(10), z.literal(12)]),
  proficiencies: proficienciesSchema,
  spellcasting: spellcastingSchema.optional(),
  features: z.array(featureSchema).min(1),
  resources: z.array(resourceSchema),
  /** Absent when the class table has only what `resources` and `spellcasting` already say. */
  tables: z.array(tableSchema).optional(),
  choices: z.array(choiceSchema),
  /** The book's subclasses: one in the SRD. */
  subclasses: z.array(subclassDataSchema).min(1),
});

const featureTextSchema = z.object({ name: z.string().min(1), description: z.string().min(1) });
const resourceTextSchema = z.object({
  name: z.string().min(1),
  /** What the numbers don't say: Divine Intervention waits 7 days after it works. */
  note: z.string().min(1).optional(),
});

/** English texts of a class, keyed by the ids of its data. */
export const classTextSchema = z.object({
  name: z.string().min(1),
  /** What the class calls its subclass, e.g. "Primal Path". */
  subclassTitle: z.string().min(1),
  features: z.record(z.string(), featureTextSchema),
  resources: z.record(z.string(), resourceTextSchema),
  choices: z.record(z.string(), z.object({ name: z.string().min(1) })),
  subclasses: z.record(
    z.string(),
    z.object({
      name: z.string().min(1),
      features: z.record(z.string(), featureTextSchema),
      resources: z.record(z.string(), resourceTextSchema),
    }),
  ),
});

const partialText = z.object({ name: z.string(), description: z.string() }).partial();
const partialResource = z.object({ name: z.string(), note: z.string() }).partial();

/** Texts of a class in a translated language: any field may be missing or "" (see spells). */
export const classTranslationSchema = z
  .object({
    name: z.string(),
    subclassTitle: z.string(),
    features: z.record(z.string(), partialText),
    resources: z.record(z.string(), partialResource),
    choices: z.record(z.string(), z.object({ name: z.string() }).partial()),
    subclasses: z.record(
      z.string(),
      z
        .object({
          name: z.string(),
          features: z.record(z.string(), partialText),
          resources: z.record(z.string(), partialResource),
        })
        .partial(),
    ),
  })
  .partial();

export type ClassData = z.infer<typeof classDataSchema>;
export type ClassText = z.infer<typeof classTextSchema>;
export type ClassTranslation = z.infer<typeof classTranslationSchema>;
export type ClassFeature = z.infer<typeof featureSchema>;
export type ClassTable = z.infer<typeof tableSchema>;
export type ClassSpellcasting = z.infer<typeof spellcastingSchema>;
export type ClassResource = z.infer<typeof resourceSchema>;
export type ClassChoice = z.infer<typeof choiceSchema>;
export type ClassProficiencies = z.infer<typeof proficienciesSchema>;
export type ResourceMax = z.infer<typeof resourceMaxSchema>;
export type Steps<T> = { level: number; value: T }[];
