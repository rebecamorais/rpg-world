import { z } from 'zod';

/** Rules data of a spell, the same in every language. */
export const spellDataSchema = z.object({
  /** Unique within its source, e.g. `fireball`. */
  id: z.string().regex(/^[a-z0-9-]+$/),
  level: z.number().int().min(0).max(9),
  school: z.string().min(1),
  classes: z.array(z.string().min(1)),
  components: z.array(z.enum(['V', 'S', 'M'])),
  castingTime: z.string().nullable(),
  castingValue: z.number().int().nullable(),
  /** Other ways to cast it (Plant Growth: 1 action, or 8 hours). Left out when there are none. */
  extraCastingTimes: z
    .array(z.object({ castingTime: z.string(), castingValue: z.number().int() }))
    .min(1)
    .optional(),
  rangeUnit: z.string().nullable(),
  rangeValue: z.number().int().nullable(),
  durationUnit: z.string().nullable(),
  durationValue: z.number().int().nullable(),
  concentration: z.boolean(),
  ritual: z.boolean(),
  isScaling: z.boolean(),
  materialCost: z.number().int().min(0),
  damageType: z.string().nullable(),
  spellCategory: z.enum(['buff', 'control', 'utility']).nullable(),
  bgStyleId: z.string().nullable(),
});

/**
 * English texts of a spell. Fields a spell doesn't have are left out (not null): translation tools
 * turn null into "" and back.
 */
export const spellTextSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  higherLevel: z.string().min(1).optional(),
  material: z.string().min(1).optional(),
  /** When a reaction or bonus action is taken: "which you take when you see a creature…". */
  trigger: z.string().min(1).optional(),
});

/**
 * Texts of a spell in a translated language. Translators work field by field: a field may be
 * missing or "" (how Crowdin exports what is not translated yet), and then the English one shows.
 */
export const spellTranslationSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    higherLevel: z.string(),
    material: z.string(),
    trigger: z.string(),
  })
  .partial();

export type SpellData = z.infer<typeof spellDataSchema>;
export type SpellText = z.infer<typeof spellTextSchema>;
export type SpellTranslation = z.infer<typeof spellTranslationSchema>;
