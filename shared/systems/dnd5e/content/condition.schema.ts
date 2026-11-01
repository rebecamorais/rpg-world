import { z } from 'zod';

/** Rules data of a condition, the same in every language. */
export const conditionDataSchema = z.object({
  /** Unique within its source, e.g. `frightened`. */
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** Only exhaustion has levels. Left out for the others. */
  maxLevel: z.number().int().min(1).max(6).optional(),
});

/** English texts of a condition. */
export const conditionTextSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

/** Texts of a condition in a translated language: a field may be missing or "" (see spells). */
export const conditionTranslationSchema = z
  .object({ name: z.string(), description: z.string() })
  .partial();

export type ConditionData = z.infer<typeof conditionDataSchema>;
export type ConditionText = z.infer<typeof conditionTextSchema>;
export type ConditionTranslation = z.infer<typeof conditionTranslationSchema>;
