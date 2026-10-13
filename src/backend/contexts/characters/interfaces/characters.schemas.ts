import { z } from 'zod';

import { httpUrlOrEmpty, optional, optionalQuery } from '@shared/http/validation';
import { ATTRIBUTE_KEYS, SKILL_KEYS } from '@shared/systems/dnd5e/constants';

// Shape and sanity limits only. Game rules (name required, max HP >= 1...) stay in the domain,
// which reports them with translated error codes.

const SMALLINT = { min: -32_768, max: 32_767 };
const text = (max = 100) => z.string().max(max);
const int = (min: number, max: number) => z.number().int().min(min).max(max);

const attributeKey = z.enum(ATTRIBUTE_KEYS as [string, ...string[]]);
const skillKey = z.enum(SKILL_KEYS as [string, ...string[]]);

export const createCharacterSchema = z.object({
  name: text(),
  system: optional(z.literal('DnD_5e')),
  class: optional(text()),
  race: optional(text()),
  level: optional(int(1, 20)),
});

export const characterUpdatesSchema = z.object({
  name: optional(text()),
  avatarUrl: optional(httpUrlOrEmpty),
  accentColor: optional(text(32)),
  class: optional(text()),
  race: optional(text()),
  subclass: optional(text()),
  background: optional(text()),
  alignment: optional(text()),
  level: optional(int(1, 20)),
  xp: optional(int(0, 10_000_000)),

  ac: optional(int(0, 1_000)),
  speed: optional(z.number().min(0).max(10_000)),
  initiative: optional(int(-1_000, 1_000)),
  hpCurrent: optional(int(SMALLINT.min, SMALLINT.max)),
  hpMax: optional(int(SMALLINT.min, SMALLINT.max)),
  hpTemp: optional(int(0, SMALLINT.max)),
  passivePerception: optional(int(0, 1_000)),

  attributes: optional(z.partialRecord(attributeKey, int(1, 99))),
  skills: optional(
    z.partialRecord(
      skillKey,
      z.object({ isProficient: z.boolean(), expertise: optional(z.boolean()) }),
    ),
  ),
  savingThrowProficiencies: optional(z.partialRecord(attributeKey, z.boolean())),

  hitDice: optional(z.object({ total: text(20), current: int(0, 1_000) })),
  deathSaves: optional(z.object({ successes: int(0, 3), failures: int(0, 3) })),

  spellcastingSystem: optional(z.enum(['slots', 'points'])),
  spellcastingAbility: optional(attributeKey),
  spellSaveDc: optional(int(-100, 100)),
  spellAttackBonus: optional(int(-100, 100)),
  spellSlots: optional(
    z.record(z.string().regex(/^[1-9]$/), z.object({ max: int(0, 100), used: int(0, 100) })),
  ),
  spellPoints: optional(z.object({ max: int(0, 10_000), current: int(0, 10_000) })),

  coins: optional(
    z.object({
      cp: int(0, 1_000_000_000),
      sp: int(0, 1_000_000_000),
      ep: int(0, 1_000_000_000),
      gp: int(0, 1_000_000_000),
      pp: int(0, 1_000_000_000),
    }),
  ),
});

export const updateCharacterSchema = z.object({ updates: characterUpdatesSchema });

export const toggleSpellSchema = z.object({
  id: z.uuid(),
  action: z.enum(['learn', 'forget', 'prepare', 'unprepare']),
});

export const localeQuerySchema = z.object({
  locale: optionalQuery(text(10)).transform((locale) => locale ?? 'en'),
});
