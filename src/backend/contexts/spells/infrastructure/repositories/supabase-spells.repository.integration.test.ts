import { describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { SupabaseSpellsRepository } from './supabase-spells.repository';

describe('SupabaseSpellsRepository (Integration)', () => {
  const dbClient = SupabaseFactory.createAdmin();
  const repository = new SupabaseSpellsRepository(dbClient);

  const seedSpells = async () => {
    // Insert base spells
    const { error: spellError } = await dbClient
      .from('spells')
      .insert([
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          level: 3,
          school: 'Evocation',
          classes: ['wizard', 'sorcerer'],
          damage_type: 'fire',
          external_index: 'fireball',
        },
        {
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          level: 4,
          school: 'Evocation',
          classes: ['wizard'],
          damage_type: 'cold',
          external_index: 'ice-storm',
        },
        {
          id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          level: 0,
          school: 'Conjuration',
          classes: ['wizard', 'sorcerer', 'cleric'],
          damage_type: 'acid',
          external_index: 'acid-splash',
        },
      ])
      .select();

    if (spellError) throw spellError;

    // Insert translations
    const { error: transError } = await dbClient.from('spell_translations').insert([
      {
        spell_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        locale: 'en',
        name: 'Fireball',
        description: 'A bright streak flashes...',
      },
      {
        spell_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        locale: 'pt-br',
        name: 'Bola de Fogo',
        description: 'Um rastro brilhante...',
      },
      {
        spell_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        locale: 'en',
        name: 'Ice Storm',
        description: 'A hail of rock-hard ice...',
      },
      {
        spell_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        locale: 'en',
        name: 'Acid Splash',
        description: 'You hurl a bubble of acid.',
      },
    ]);

    if (transError) throw transError;
  };

  it('deve buscar magias com paginação padrão', async () => {
    await seedSpells();

    const result = await repository.findAll({ locale: 'en', page: 0, limit: 12 });

    expect(result.data.length).toBe(3);
    expect(result.total).toBe(3);
    expect(result.data[0].name).toBeDefined();
  });

  it('deve filtrar magias por busca textual no nome', async () => {
    await seedSpells();

    const result = await repository.findAll({ locale: 'en', search: 'Fire' });

    expect(result.data.length).toBe(1);
    expect(result.data[0].name).toBe('Fireball');
  });

  it('deve filtrar magias por nível', async () => {
    await seedSpells();

    const result = await repository.findAll({ locale: 'en', level: 0 });

    expect(result.data.length).toBe(1);
    expect(result.data[0].level).toBe(0);
    expect(result.data[0].name).toBe('Acid Splash');
  });

  it('deve filtrar magias por tipo de dano', async () => {
    await seedSpells();

    const result = await repository.findAll({ locale: 'en', damageType: 'cold' });

    expect(result.data.length).toBe(1);
    expect(result.data[0].damageType).toBe('cold');
    expect(result.data[0].name).toBe('Ice Storm');
  });

  it('deve filtrar magias por escola', async () => {
    await seedSpells();

    const result = await repository.findAll({ locale: 'en', school: 'Conjuration' });

    expect(result.data.length).toBe(1);
    expect(result.data[0].school).toBe('Conjuration');
    expect(result.data[0].name).toBe('Acid Splash');
  });

  it('deve filtrar magias por classe (contém no array)', async () => {
    await seedSpells();

    const result = await repository.findAll({ locale: 'en', class: 'cleric' });

    expect(result.data.length).toBe(1);
    expect(result.data[0].classes).toContain('cleric');
    expect(result.data[0].name).toBe('Acid Splash');
  });

  it('deve filtrar magias por classe (múltiplos resultados)', async () => {
    await seedSpells();

    const result = await repository.findAll({ locale: 'en', class: 'sorcerer' });

    expect(result.data.length).toBe(2);
    expect(result.data.every((s) => s.classes.includes('sorcerer'))).toBe(true);
  });

  it('deve respeitar a paginação (limit e offset)', async () => {
    await seedSpells();

    const resultPage1 = await repository.findAll({ locale: 'en', page: 0, limit: 1 });
    const resultPage2 = await repository.findAll({ locale: 'en', page: 1, limit: 1 });

    expect(resultPage1.data.length).toBe(1);
    expect(resultPage2.data.length).toBe(1);
    expect(resultPage1.total).toBe(3);
    expect(resultPage1.data[0].id).not.toBe(resultPage2.data[0].id);
  });
});
