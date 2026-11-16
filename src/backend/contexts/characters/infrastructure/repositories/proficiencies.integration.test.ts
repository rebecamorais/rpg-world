import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it } from 'vitest';

import type { SavedProficiencies } from '@shared/systems/dnd5e/proficiencies';

import { createSignedInClient } from '../../../../../../test/helpers/signed-in-client';
import { UpdateCharacterUseCase } from '../../application/update-character/update-character.use-case';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { SupabaseCharacterRepository } from './supabase-character.repository';

// O que a classe dá em armaduras, armas, ferramentas e idiomas nunca é gravado. O banco guarda só
// o que a pessoa adicionou (por id), escreveu ou desligou, e uma ficha que nunca mexeu fica sem a
// chave: salvar outra coisa não pode criar o campo (nem subir a revisão por causa dele).
describe('proficiências e idiomas salvos (Integration)', () => {
  let ownerId: string;
  let client: SupabaseClient;
  let repo: SupabaseCharacterRepository;
  let useCase: UpdateCharacterUseCase;

  beforeEach(async () => {
    const owner = await createSignedInClient('owner');
    ownerId = owner.userId;
    client = owner.client;
    repo = new SupabaseCharacterRepository(client);
    useCase = new UpdateCharacterUseCase(repo);
  });

  async function create(proficiencies?: SavedProficiencies) {
    const id = crypto.randomUUID();
    await repo.save(
      new DnD5eCharacter({
        id,
        name: 'Druida',
        ownerUsername: ownerId,
        attributes: new Attributes({ WIS: 16 }),
        hp: new HealthPoints(9, 9),
        level: 1,
        classStr: 'druid',
        edition: '2014',
        proficiencies,
      }),
    );
    return id;
  }

  /** The row itself, without the repository in between. */
  async function row(id: string) {
    const { data } = await client
      .from('characters')
      .select('system_data, revision')
      .eq('id', id)
      .single();
    return {
      systemData: data?.system_data as Record<string, unknown>,
      revision: data?.revision as number,
    };
  }

  const update = (id: string, updates: Parameters<typeof useCase.execute>[0]['updates']) =>
    useCase.execute({ id, ownerUsername: ownerId, updates });

  it('ficha que nunca mexeu continua sem a chave depois de salvar outros campos', async () => {
    const id = await create();

    await update(id, { ac: 14 });
    const afterSheet = await row(id);
    expect(Object.hasOwn(afterSheet.systemData, 'proficiencies')).toBe(false);

    // Estado de jogo não sobe a revisão; a chave ausente também não
    await update(id, { hpCurrent: 4 });
    const afterPlay = await row(id);
    expect(Object.hasOwn(afterPlay.systemData, 'proficiencies')).toBe(false);
    expect(afterPlay.revision).toBe(afterSheet.revision);
  });

  it('grava ids e texto próprio como vieram, e trocar de classe não mexe neles', async () => {
    const id = await create();
    const proficiencies: SavedProficiencies = {
      languages: { added: ['elvish'], own: ['Língua dos Corvos'], off: ['druidic'] },
      tools: { added: ['lute'] },
    };

    await update(id, { proficiencies });
    expect((await row(id)).systemData.proficiencies).toEqual(proficiencies);

    await update(id, { class: 'rogue' });
    expect((await row(id)).systemData.proficiencies).toEqual(proficiencies);
    expect(((await repo.findById(id)) as DnD5eCharacter).proficiencies).toEqual(proficiencies);
  });

  it('mexer nas proficiências sobe a revisão: é campo da ficha, não estado de jogo', async () => {
    const id = await create();
    const before = (await row(id)).revision;

    await update(id, { proficiencies: { armor: { added: ['heavy'] } } });

    expect((await row(id)).revision).toBe(before + 1);
  });
});
