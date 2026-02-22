import { z } from 'zod';

import { ATTRIBUTE_KEYS } from './constants/attributes';
import { SKILL_KEYS } from './constants/skill';

export const dnd5eCharacterSchema = z.object({
  name: z.string().min(1, 'O nome do personagem é obrigatório.'),
  ownerUsername: z.string().min(1, 'Dono inválido.'),
  system: z.literal('DnD_5e'),
  race: z.string().min(1, 'Forneça a raça do personagem.'),
  class: z.string().min(1, 'Forneça a classe do personagem.'),
  level: z.number().int().min(1).max(20),
  hpCurrent: z.number().int(),
  hpMax: z.number().int().min(1),
  hpTemp: z.number().int().nonnegative().optional().default(0),
  manaCurrent: z.number().int().nonnegative().optional().default(0),
  manaMax: z.number().int().nonnegative().optional().default(0),
  ac: z.number().int().nonnegative(),
  speed: z.number().nonnegative(),
  initiative: z.number().int(),
  attributes: z.record(
    z.enum(ATTRIBUTE_KEYS as [string, ...string[]]),
    z.number().int().min(1).max(30),
  ),
  skills: z
    .record(
      z.enum(SKILL_KEYS as [string, ...string[]]),
      z.object({
        isProficient: z.boolean(),
        expertise: z.boolean().optional().default(false),
      }),
    )
    .optional()
    .default({}),
  savingThrowProficiencies: z
    .record(z.enum(ATTRIBUTE_KEYS as [string, ...string[]]), z.boolean())
    .optional()
    .default({}),
  spells: z.array(z.string()).optional().default([]),
  passivePerception: z.number().int().nonnegative().optional().default(10),
});

export type DnD5eCharacterFormValues = z.infer<typeof dnd5eCharacterSchema>;
