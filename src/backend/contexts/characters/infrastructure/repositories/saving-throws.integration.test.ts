import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it } from 'vitest';

import type { AttributeKey } from '@shared/systems/dnd5e/types';

import { createSignedInClient } from '../../../../../../test/helpers/signed-in-client';
import { UpdateCharacterUseCase } from '../../application/update-character/update-character.use-case';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { SupabaseCharacterRepository } from './supabase-character.repository';

// Uma salvaguarda sem valor salvo segue a classe; `false` salvo é uma escolha. O banco precisa
// guardar a diferença: o servidor não pode completar as seis ao ler nem ao gravar.
describe('salvaguardas salvas (Integration)', () => {
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

  async function create(saves?: Partial<Record<AttributeKey, boolean>>) {
    const id = crypto.randomUUID();
    await repo.save(
      new DnD5eCharacter({
        id,
        name: 'Guerreira',
        ownerUsername: ownerId,
        attributes: new Attributes({ STR: 10 }),
        hp: new HealthPoints(10, 10),
        level: 5,
        classStr: 'fighter',
        edition: '2014',
        savingThrowProficiencies: saves,
      }),
    );
    return id;
  }

  /** What is in the row itself, without the repository in between. */
  async function stored(id: string) {
    const { data } = await client.from('characters').select('system_data').eq('id', id).single();
    return (data?.system_data as { savingThrowProficiencies?: unknown }).savingThrowProficiencies;
  }

  const read = async (id: string) =>
    ((await repo.findById(id)) as DnD5eCharacter).savingThrowProficiencies;

  const update = (id: string, updates: Parameters<typeof useCase.execute>[0]['updates']) =>
    useCase.execute({ id, ownerUsername: ownerId, updates });

  it('ficha antiga com as seis salvas continua igual depois de ler e gravar outro campo', async () => {
    const old = { STR: false, DEX: true, CON: false, INT: false, WIS: true, CHA: false };
    const id = await create(old);

    expect(await read(id)).toEqual(old);
    await update(id, { ac: 16 });

    expect(await read(id)).toEqual(old);
    expect(await stored(id)).toEqual(old);
  });

  it('ficha nova fica sem salvaguardas no banco, mesmo depois de salvar outro campo', async () => {
    const id = await create();

    expect(await stored(id)).toEqual({});
    await update(id, { ac: 16 });
    await update(id, { level: 6 });

    expect(await stored(id)).toEqual({});
    expect(await read(id)).toEqual({});
  });

  it('guarda só a que foi definida à mão, e tirá-la do mapa volta a herdar', async () => {
    const id = await create();

    await update(id, { savingThrowProficiencies: { STR: false } });
    expect(await stored(id)).toEqual({ STR: false });

    await update(id, { savingThrowProficiencies: { STR: false, WIS: true } });
    await update(id, { hpCurrent: 3 });
    expect(await stored(id)).toEqual({ STR: false, WIS: true });

    await update(id, { savingThrowProficiencies: { WIS: true } });
    expect(await stored(id)).toEqual({ WIS: true });
  });
});
