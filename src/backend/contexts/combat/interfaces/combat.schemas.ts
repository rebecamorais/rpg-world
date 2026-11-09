import { z } from 'zod';

import { MAX_ENEMIES_PER_ADD } from '../domain/Encounter';

// Shape and sanity limits only; the database holds the rules (who may, 50 per combat...).

export const participantParamsSchema = z.object({ partyId: z.uuid(), participantId: z.uuid() });

/** A character brought to the party, or `count` enemies or allies from one of the GM's npc sheets. */
export const participantSchema = z.object({
  characterId: z.uuid(),
  count: z.number().int().min(1).max(MAX_ENEMIES_PER_ADD).default(1),
  // Only for an npc sheet; a party character is always a player
  side: z.enum(['ally', 'neutral', 'enemy']).default('enemy'),
});

export const participantPatchSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    initiative: z.number().int().min(-10).max(99).nullable(),
    hpCurrent: z.number().int().min(0).max(9999),
    hpTemp: z.number().int().min(0).max(9999),
    side: z.enum(['ally', 'neutral', 'enemy']),
    visibility: z.enum(['visible', 'anonymous', 'hidden']),
    fate: z.enum(['death_saves', 'dead']).nullable(),
    deathSaves: z.object({
      successes: z.number().int().min(0).max(3),
      failures: z.number().int().min(0).max(3),
    }),
    deathRevealed: z.boolean(),
  })
  .partial();

export const orderSchema = z.object({ participantIds: z.array(z.uuid()).min(1).max(50) });

export const turnSchema = z.object({ participantId: z.uuid() });

export const conditionsSchema = z.object({
  conditions: z
    .array(z.object({ key: z.string().max(80), level: z.number().int().nullable().default(null) }))
    .max(20),
});
