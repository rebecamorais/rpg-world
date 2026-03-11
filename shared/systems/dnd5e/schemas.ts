import { z } from 'zod';

import { ATTRIBUTE_KEYS } from './constants/attributes';
import { SKILL_KEYS } from './constants/skill';

export const dnd5eCharacterSchema = z.object({
  name: z.string().min(1, 'O nome do personagem é obrigatório.'),
  ownerUsername: z.string().min(1, 'Dono inválido.'),
  system: z.literal('DnD_5e'),
  race: z.string().min(1, 'Forneça a raça do personagem.'),
  class: z.string().min(1, 'Forneça a classe do personagem.'),
  subclass: z.string().optional(),
  level: z.number().int().min(1).max(20),
  background: z.string().optional(),
  alignment: z.string().optional(),
  xp: z.number().int().nonnegative().optional().default(0),

  hpCurrent: z.number().int(),
  hpMax: z.number().int().min(1),
  hpTemp: z.number().int().nonnegative().optional().default(0),
  ac: z.number().int().nonnegative(),
  speed: z.number().nonnegative(),
  initiative: z.number().int(),

  hitDice: z
    .object({
      total: z.string(),
      current: z.number().int().nonnegative(),
    })
    .optional(),
  deathSaves: z
    .object({
      successes: z.number().int().min(0).max(3),
      failures: z.number().int().min(0).max(3),
    })
    .optional(),

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
  passivePerception: z.number().int().nonnegative().optional().default(10),

  spellcastingSystem: z.enum(['slots', 'points']).optional(),
  spellcastingAbility: z.enum(ATTRIBUTE_KEYS as [string, ...string[]]).optional(),
  spellSaveDc: z.number().int().optional(),
  spellAttackBonus: z.number().int().optional(),
  spellSlots: z
    .record(
      z.string(),
      z.object({
        max: z.number().int().nonnegative(),
        used: z.number().int().nonnegative(),
      }),
    )
    .optional(),
  spellPoints: z
    .object({
      max: z.number().int().nonnegative(),
      current: z.number().int().nonnegative(),
    })
    .optional(),
  spellsKnown: z.array(z.string()).optional().default([]),
  spells: z.array(z.string()).optional(), // keeping for backwards compatibility

  coins: z
    .object({
      cp: z.number().int().nonnegative().default(0),
      sp: z.number().int().nonnegative().default(0),
      ep: z.number().int().nonnegative().default(0),
      gp: z.number().int().nonnegative().default(0),
      pp: z.number().int().nonnegative().default(0),
    })
    .optional(),
});

export type DnD5eCharacterFormValues = z.infer<typeof dnd5eCharacterSchema>;
