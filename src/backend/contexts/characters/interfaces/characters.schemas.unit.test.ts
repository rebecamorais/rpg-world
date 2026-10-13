import { describe, expect, it } from 'vitest';

import { DnD5eCharacter } from '../domain/entity/DnD5eCharacter';
import { Attributes } from '../domain/value-object/Attributes';
import { HealthPoints } from '../domain/value-object/HealthPoints';
import {
  characterUpdatesSchema,
  createCharacterSchema,
  localeQuerySchema,
  toggleSpellSchema,
} from './characters.schemas';

// What the sheet sends back on save: the GET payload (toJSON) after edits, through JSON.
const sheetPayload = () =>
  JSON.parse(
    JSON.stringify(
      new DnD5eCharacter({
        id: 'char-1',
        name: 'Hero',
        ownerUsername: 'owner-1',
        attributes: new Attributes({ STR: 10, DEX: 14, CON: 12, INT: 8, WIS: 13, CHA: 15 }),
        hp: new HealthPoints(8, 12),
        level: 3,
        classStr: 'Rogue',
        race: 'Elf',
        skills: { STEALTH: { isProficient: true, expertise: true } } as never,
        savingThrowProficiencies: { DEX: true, INT: true },
        spellSlots: { '1': { max: 2, used: 1 } },
        coins: { cp: 0, sp: 3, ep: 0, gp: 15, pp: 0 },
        accentColor: '#ff4444',
      }).toJSON(),
    ),
  ) as Record<string, unknown>;

describe('characterUpdatesSchema', () => {
  it('aceita o payload real da ficha e descarta campos que não são editáveis', () => {
    const updates = characterUpdatesSchema.parse(sheetPayload());

    expect(updates).toMatchObject({
      name: 'Hero',
      level: 3,
      class: 'Rogue',
      hpCurrent: 8,
      hpMax: 12,
      skills: { STEALTH: { isProficient: true, expertise: true } },
      spellSlots: { '1': { max: 2, used: 1 } },
    });
    expect(updates).not.toHaveProperty('id');
    expect(updates).not.toHaveProperty('ownerUsername');
    expect(updates).not.toHaveProperty('system');
  });

  it('trata null como campo não enviado', () => {
    const updates = characterUpdatesSchema.parse({
      subclass: null,
      spellcastingAbility: null,
      hitDice: null,
    });
    expect(updates).toEqual({});
  });

  it('aceita atributos parciais', () => {
    expect(characterUpdatesSchema.parse({ attributes: { STR: 18 } }).attributes).toEqual({
      STR: 18,
    });
  });

  it.each([
    ['nível fora de 1..20', { level: 21 }],
    ['nível não inteiro', { level: 2.5 }],
    ['atributo desconhecido', { attributes: { LUCK: 10 } }],
    ['perícia desconhecida', { skills: { FLYING: { isProficient: true } } }],
    ['tipo errado', { name: 42 }],
    ['avatar com esquema perigoso', { avatarUrl: 'javascript:alert(1)' }],
    ['nome gigante', { name: 'x'.repeat(101) }],
    ['death saves acima de 3', { deathSaves: { successes: 4, failures: 0 } }],
    ['nível de slot inválido', { spellSlots: { '10': { max: 1, used: 0 } } }],
    ['moedas negativas', { coins: { cp: -1, sp: 0, ep: 0, gp: 0, pp: 0 } }],
  ])('rejeita %s', (_label, updates) => {
    expect(characterUpdatesSchema.safeParse(updates).success).toBe(false);
  });

  it('deixa a regra de HP máximo para o domínio', () => {
    expect(characterUpdatesSchema.safeParse({ hpMax: 0 }).success).toBe(true);
  });
});

describe('createCharacterSchema', () => {
  it('aceita o payload do formulário e ignora ownerUsername enviado pelo cliente', () => {
    expect(
      createCharacterSchema.parse({ name: 'Hero', system: 'DnD_5e', ownerUsername: 'someone' }),
    ).toEqual({ name: 'Hero', system: 'DnD_5e' });
  });

  it('rejeita sistema não suportado', () => {
    expect(createCharacterSchema.safeParse({ name: 'Hero', system: 'GURPS' }).success).toBe(false);
  });
});

describe('toggleSpellSchema', () => {
  it('exige id UUID e ação conhecida', () => {
    const id = crypto.randomUUID();
    expect(toggleSpellSchema.parse({ id, action: 'learn' })).toEqual({ id, action: 'learn' });
    expect(toggleSpellSchema.safeParse({ id: 'fireball', action: 'learn' }).success).toBe(false);
    expect(toggleSpellSchema.safeParse({ id, action: 'drop' }).success).toBe(false);
  });
});

describe('localeQuerySchema', () => {
  it('usa en por padrão', () => {
    expect(localeQuerySchema.parse({})).toEqual({ locale: 'en' });
    expect(localeQuerySchema.parse({ locale: '' })).toEqual({ locale: 'en' });
    expect(localeQuerySchema.parse({ locale: 'pt' })).toEqual({ locale: 'pt' });
  });
});
