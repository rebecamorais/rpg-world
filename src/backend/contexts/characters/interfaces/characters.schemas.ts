import { z } from 'zod';

import { ITEM_KEY, SPELL_KEY } from '@shared/content/content-key';
import { httpUrlOrEmpty, optional, optionalQuery } from '@shared/http/validation';
import {
  MAX_RESOURCE_DESCRIPTION,
  RESOURCE_KEY,
  RESOURCE_SOURCES,
} from '@shared/systems/dnd5e/class-resources';
import { ATTRIBUTE_KEYS, SKILL_KEYS, type SkillKey } from '@shared/systems/dnd5e/constants';
import { EDITIONS } from '@shared/systems/dnd5e/content/editions';
import { HIT_DIE_OPTIONS } from '@shared/systems/dnd5e/hit-dice';
import type { AttributeKey } from '@shared/systems/dnd5e/types';

// Shape and sanity limits only. Game rules (name required, max HP >= 1...) stay in the domain,
// which reports them with translated error codes.

const SMALLINT = { min: -32_768, max: 32_767 };
const text = (max = 100) => z.string().max(max);
const int = (min: number, max: number) => z.number().int().min(min).max(max);

export const spellKeySchema = z.string().max(200).regex(SPELL_KEY);

const attributeKey = z.enum(ATTRIBUTE_KEYS as [AttributeKey, ...AttributeKey[]]);
const skillKey = z.enum(SKILL_KEYS as [SkillKey, ...SkillKey[]]);

export const createCharacterSchema = z.object({
  name: text(),
  system: optional(z.literal('DnD_5e')),
  class: optional(text()),
  race: optional(text()),
  level: optional(int(1, 20)),
  kind: optional(z.enum(['pc', 'npc'])),
});

/** GET /api/characters: playable characters, or the GM's enemy sheets with ?kind=npc. */
export const charactersQuerySchema = z.object({
  kind: optionalQuery(z.enum(['pc', 'npc'])).transform((kind) => kind ?? 'pc'),
});

export const duplicateCharacterSchema = z.object({ name: text().min(1) });

const recovery = z.object({
  rest: z.enum(['short', 'long']),
  amount: z.union([z.literal('all'), int(1, 1_000)]),
  fromLevel: optional(int(1, 20)),
});

const resourceState = z.object({
  used: int(0, 1_000),
  hidden: optional(z.boolean()),
  overrides: optional(
    z.object({
      max: optional(int(0, 1_000)),
      recovery: optional(z.array(recovery).max(4)),
      color: optional(text(32)),
      name: optional(text()),
      description: optional(text(MAX_RESOURCE_DESCRIPTION)),
    }),
  ),
  custom: optional(
    z.object({
      name: text(),
      max: int(0, 1_000),
      recovery: z.array(recovery).max(4),
      color: optional(text(32)),
      description: optional(text(MAX_RESOURCE_DESCRIPTION)),
      source: z.enum(RESOURCE_SOURCES),
    }),
  ),
});

export const characterUpdatesSchema = z.object({
  name: optional(text()),
  avatarUrl: optional(httpUrlOrEmpty),
  sheetBackgroundUrl: optional(httpUrlOrEmpty),
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

  hitDice: optional(
    z.union([
      z.object({ die: optional(z.enum(HIT_DIE_OPTIONS)), spent: int(0, 1_000) }),
      // How it was sent before 2026-11: a tab left open or an offline queue may still send it
      z.object({ total: text(20), current: int(0, 1_000) }),
    ]),
  ),
  deathSaves: optional(z.object({ successes: int(0, 3), failures: int(0, 3) })),

  spellcastingSystem: optional(z.enum(['slots', 'points'])),
  spellcastingAbility: optional(attributeKey),
  spellSaveDc: optional(int(-100, 100)),
  spellAttackBonus: optional(int(-100, 100)),
  spellSlots: optional(
    z.record(z.string().regex(/^[1-9]$/), z.object({ max: int(0, 100), used: int(0, 100) })),
  ),
  spellPoints: optional(z.object({ max: int(0, 10_000), current: int(0, 10_000) })),

  edition: optional(z.enum(EDITIONS)),
  resources: optional(
    z
      .record(z.string().max(200).regex(RESOURCE_KEY), resourceState)
      .refine((boxes) => Object.keys(boxes).length <= 100),
  ),
});

export const updateCharacterSchema = z.object({
  updates: characterUpdatesSchema,
  /** The revision the client last saw; without it the save goes on top of what is there. */
  revision: z.number().int().min(0).optional(),
});

export const toggleSpellSchema = z.object({
  id: spellKeySchema,
  action: z.enum(['learn', 'forget', 'prepare', 'unprepare']),
});

export const localeQuerySchema = z.object({
  locale: optionalQuery(text(10)).transform((locale) => locale ?? 'en'),
});

const itemParamsFields = { id: z.uuid(), itemId: z.uuid() };
export const inventoryItemParamsSchema = z.object(itemParamsFields);

const quantity = int(1, 9999);

export const addInventoryItemSchema = z.object({
  ref: z.string().max(200).regex(ITEM_KEY),
  containerId: z.uuid(),
  quantity,
  key: z.uuid().optional(),
});

const setItemQuantitySchema = z.object({ quantity });

/** An idempotency key: the same request sent twice is applied once. */
const operationKey = z.uuid();

/** Adding to (or taking from) the quantity, instead of the final value. */
const changeItemQuantitySchema = z.object({ delta: int(-9999, 9999), key: operationKey });

/** The absolute quantity (the app before operations) or a change. */
export const itemQuantityBodySchema = z.union([setItemQuantitySchema, changeItemQuantitySchema]);

/** Exactly the five coins, whole numbers from 0 to a billion. */
export const setCoinsSchema = z.object({
  containerId: z.uuid(),
  coins: z.strictObject({
    cp: int(0, 1_000_000_000),
    sp: int(0, 1_000_000_000),
    ep: int(0, 1_000_000_000),
    gp: int(0, 1_000_000_000),
    pp: int(0, 1_000_000_000),
  }),
});

const coinDelta = int(-1_000_000_000, 1_000_000_000).optional();

/** How much each coin goes up or down; the coins left out don't change. */
const addCoinsSchema = z.object({
  containerId: z.uuid(),
  delta: z.strictObject({
    cp: coinDelta,
    sp: coinDelta,
    ep: coinDelta,
    gp: coinDelta,
    pp: coinDelta,
  }),
  key: operationKey,
});

const coinValue = int(0, 1_000_000_000).optional();
const someCoins = z.strictObject({
  cp: coinValue,
  sp: coinValue,
  ep: coinValue,
  gp: coinValue,
  pp: coinValue,
});
const sameCoins = (a: object, b: object) =>
  Object.keys(a).sort().join() === Object.keys(b).sort().join();

/**
 * The final value of the coins typed by hand, and what each one was on the screen (`expected`):
 * the same coins in both, at least one.
 */
const typedCoinsSchema = z
  .object({ containerId: z.uuid(), coins: someCoins, expected: someCoins, key: operationKey })
  .refine(({ coins, expected }) => Object.keys(coins).length > 0 && sameCoins(coins, expected), {
    path: ['expected'],
  });

/** A change to the coins: a `delta` to add (Pay, Receive) or the typed final values. */
export const changeCoinsSchema = z.union([addCoinsSchema, typedCoinsSchema]);
