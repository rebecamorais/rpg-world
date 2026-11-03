import { z } from 'zod';

export const ITEM_CATEGORIES = [
  'weapon',
  'armor',
  'shield',
  'gear',
  'tool',
  'kit',
  'ammunition',
  'focus',
  'instrument',
  'mount',
  'vehicle',
  'food',
  'trade-good',
  'other',
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

/** Rules data of a common item, the same in every language. */
export const itemDataSchema = z.object({
  /** Unique within its source, e.g. `plate-armor`. */
  id: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum(ITEM_CATEGORIES),
  /** Price in copper pieces (a few bulk items cost a fraction, e.g. 0.1 per ball bearing). */
  value: z.number().min(0).optional(),
  /** Weight in pounds. */
  weight: z.number().min(0).optional(),
  /** Strength needed to wear it without a speed penalty. */
  strength: z.number().int().min(1).optional(),
  stealthDisadvantage: z.literal(true).optional(),
  ac: z.number().int().min(0).optional(),
  damage: z.object({ dice: z.string().min(1), type: z.string().min(1) }).optional(),
  /** Damage dice when wielded with two hands. */
  versatile: z.string().min(1).optional(),
  /** Weapon property codes, e.g. `V` (versatile). */
  properties: z.array(z.string().min(1)).optional(),
  /** Normal/long range in feet, e.g. `80/320`. */
  range: z.string().min(1).optional(),
});

/** English texts of an item. */
export const itemTextSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
});

/** Texts of an item in a translated language: a field may be missing or "" (see spells). */
export const itemTranslationSchema = z
  .object({ name: z.string(), description: z.string() })
  .partial();

export type ItemData = z.infer<typeof itemDataSchema>;
export type ItemText = z.infer<typeof itemTextSchema>;
export type ItemTranslation = z.infer<typeof itemTranslationSchema>;
