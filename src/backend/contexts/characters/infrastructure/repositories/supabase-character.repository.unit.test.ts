import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import type { Database } from '@database-types';

import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { SupabaseCharacterRepository } from './supabase-character.repository';

/** A client whose character lookup finds a level 5 sheet with `systemData`. */
function repoWithSheet(systemData: Record<string, unknown>) {
  const row = {
    id: 'c1',
    name: 'Hero',
    owner_id: 'owner-1',
    system: 'dnd_5e',
    level: 5,
    hp_current: 8,
    hp_max: 12,
    attributes: { STR: 10 },
    system_data: systemData,
  };
  const lookup = {
    select: () => lookup,
    eq: () => lookup,
    is: () => lookup,
    maybeSingle: async () => ({ data: row, error: null }),
  };
  return new SupabaseCharacterRepository({
    from: () => lookup,
  } as unknown as SupabaseClient<Database>);
}

const hitDiceOf = async (systemData: Record<string, unknown>) =>
  ((await repoWithSheet(systemData).findById('c1')) as DnD5eCharacter).hitDice;

describe('SupabaseCharacterRepository: dados de vida na leitura', () => {
  it('o formato novo vem como está guardado', async () => {
    expect(await hitDiceOf({ hitDice: { die: 'd10', spent: 2 } })).toEqual({
      die: 'd10',
      spent: 2,
    });
  });

  it('ficha salva no formato antigo vira dado e gastos, pelo nível da linha', async () => {
    expect(await hitDiceOf({ hitDice: { total: '5d10', current: 3 } })).toEqual({
      die: 'd10',
      spent: 2,
    });
    expect(await hitDiceOf({ hitDice: { total: '', current: 5 } })).toEqual({ spent: 0 });
  });

  it('ficha que nunca marcou dados de vida continua sem eles', async () => {
    expect(await hitDiceOf({})).toBeUndefined();
  });
});

describe('SupabaseCharacterRepository: escolhas da classe na leitura', () => {
  const choicesOf = async (systemData: Record<string, unknown>) =>
    ((await repoWithSheet(systemData).findById('c1')) as DnD5eCharacter).classChoices;

  it('vêm pela identidade da escolha, como foram guardadas', async () => {
    const classChoices = { '2014/bard/skills': ['ARCANA'], '2014/rogue/skills': ['STEALTH'] };
    expect(await choicesOf({ classChoices })).toEqual(classChoices);
  });

  it('ficha sem escolhas continua sem elas', async () => {
    expect(await choicesOf({})).toBeUndefined();
  });
});
