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

/** Texts of a spell in one language. */
export const spellTextSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  higherLevel: z.string().nullable(),
  material: z.string().nullable(),
});

export type SpellData = z.infer<typeof spellDataSchema>;
export type SpellText = z.infer<typeof spellTextSchema>;
