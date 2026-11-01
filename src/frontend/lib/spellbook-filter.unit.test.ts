import { describe, expect, it } from 'vitest';

import type { Spell } from '@frontend/types/spells';

import {
  NO_SPELLBOOK_FILTERS,
  activeSpellbookFilterCount,
  filterSpellbook,
} from './spellbook-filter';

function spell(id: string, overrides: Partial<Spell> = {}): Spell {
  return {
    id,
    name: id,
    level: 1,
    school: 'evocation',
    castingTime: 'action',
    castingValue: 1,
    ...overrides,
  };
}

const ids = (spells: Spell[]) => spells.map((s) => s.id);

describe('filterSpellbook', () => {
  const SPELLS = [
    spell('relampago', { name: 'Relâmpago', damageType: 'lightning' }),
    spell('bola-de-fogo', { name: 'Bola de Fogo', damageType: 'fire', isPrepared: true }),
    spell('escudo', { name: 'Escudo', school: 'abjuration', castingTime: 'reaction' }),
    spell('detectar', {
      name: 'Detectar Magia',
      school: 'divination',
      concentration: true,
      ritual: true,
    }),
    spell('passo', { name: 'Passo Nebuloso', school: 'conjuration', castingTime: 'bonus_action' }),
    spell('mansao', {
      name: 'Mansão',
      school: 'conjuration',
      castingTime: 'minute',
      castingValue: 1,
    }),
  ];

  it('sem filtros, devolve todas', () => {
    expect(ids(filterSpellbook(SPELLS, NO_SPELLBOOK_FILTERS))).toEqual(ids(SPELLS));
  });

  it('busca pelo nome sem diferenciar acento nem maiúscula', () => {
    expect(
      ids(filterSpellbook(SPELLS, { ...NO_SPELLBOOK_FILTERS, search: ' RELAMPAGO ' })),
    ).toEqual(['relampago']);
    expect(ids(filterSpellbook(SPELLS, { ...NO_SPELLBOOK_FILTERS, search: 'fogo' }))).toEqual([
      'bola-de-fogo',
    ]);
  });

  it('só as preparadas', () => {
    expect(ids(filterSpellbook(SPELLS, { ...NO_SPELLBOOK_FILTERS, preparedOnly: true }))).toEqual([
      'bola-de-fogo',
    ]);
  });

  it('por escola e por tipo de dano', () => {
    expect(
      ids(filterSpellbook(SPELLS, { ...NO_SPELLBOOK_FILTERS, school: 'conjuration' })),
    ).toEqual(['passo', 'mansao']);
    expect(ids(filterSpellbook(SPELLS, { ...NO_SPELLBOOK_FILTERS, damage: 'fire' }))).toEqual([
      'bola-de-fogo',
    ]);
  });

  it('por tempo de conjuração; "longer" junta minutos, horas e dias', () => {
    expect(
      ids(filterSpellbook(SPELLS, { ...NO_SPELLBOOK_FILTERS, castingTime: 'reaction' })),
    ).toEqual(['escudo']);
    expect(
      ids(filterSpellbook(SPELLS, { ...NO_SPELLBOOK_FILTERS, castingTime: 'longer' })),
    ).toEqual(['mansao']);
  });

  it('concentração e ritual', () => {
    expect(ids(filterSpellbook(SPELLS, { ...NO_SPELLBOOK_FILTERS, concentration: true }))).toEqual([
      'detectar',
    ]);
    expect(ids(filterSpellbook(SPELLS, { ...NO_SPELLBOOK_FILTERS, ritual: true }))).toEqual([
      'detectar',
    ]);
  });

  it('os filtros se somam', () => {
    expect(
      filterSpellbook(SPELLS, { ...NO_SPELLBOOK_FILTERS, school: 'evocation', preparedOnly: true }),
    ).toHaveLength(1);
    expect(
      filterSpellbook(SPELLS, { ...NO_SPELLBOOK_FILTERS, school: 'abjuration', damage: 'fire' }),
    ).toHaveLength(0);
  });
});

describe('activeSpellbookFilterCount', () => {
  it('conta os filtros ligados, sem a busca', () => {
    expect(activeSpellbookFilterCount(NO_SPELLBOOK_FILTERS)).toBe(0);
    expect(
      activeSpellbookFilterCount({
        ...NO_SPELLBOOK_FILTERS,
        search: 'fogo',
        school: 'evocation',
        ritual: true,
      }),
    ).toBe(2);
  });
});
