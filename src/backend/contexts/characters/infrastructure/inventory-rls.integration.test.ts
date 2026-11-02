import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { addMember, createCharacter, createParty } from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();
const rope = 'dnd5e:srd-5.2:item:rope';
const torch = 'dnd5e:srd-5.2:item:torch';
const emptyCoins = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

const containersOf = async (characterId: string) => {
  const { data, error } = await admin()
    .from('character_containers')
    .select('id, kind, name, position, coins')
    .eq('character_id', characterId)
    .order('position');
  if (error) throw error;
  return data;
};

const itemsOf = async (characterId: string) => {
  const { data, error } = await admin()
    .from('character_items')
    .select('container_id, item_ref, quantity')
    .eq('character_id', characterId)
    .order('item_ref');
  if (error) throw error;
  return data;
};

const containerId = async (characterId: string, kind: 'coin_pouch' | 'backpack') =>
  (await containersOf(characterId)).find((c) => c.kind === kind)!.id;

// Inventário do personagem: algibeira (moedas) e mochila (itens) em tabelas próprias. O dono lê e
// escreve; o mestre da mesa só lê; mais ninguém vê.
describe('Inventário do personagem (Integration)', () => {
  let gm: Session;
  let player: Session;
  let colleague: Session;
  let stranger: Session;
  let partyId: string;
  let characterId: string;
  let pouchId: string;
  let backpackId: string;

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    colleague = await createSignedInClient('colleague');
    stranger = await createSignedInClient('stranger');
    partyId = await createParty(gm);
    await addMember(partyId, player.userId, 'active');
    await addMember(partyId, colleague.userId, 'active');

    characterId = await createCharacter(player.userId, { name: 'Arani' });
    const { error } = await player.client
      .from('party_characters')
      .insert({ party_id: partyId, character_id: characterId });
    if (error) throw error;

    pouchId = await containerId(characterId, 'coin_pouch');
    backpackId = await containerId(characterId, 'backpack');
  });

  it('personagem novo tem exatamente uma algibeira e uma mochila, vazias (Ponto 1)', async () => {
    expect(await containersOf(characterId)).toEqual([
      expect.objectContaining({ kind: 'coin_pouch', position: 0, name: null, coins: emptyCoins }),
      expect.objectContaining({ kind: 'backpack', position: 1, name: null, coins: emptyCoins }),
    ]);
    expect(await itemsOf(characterId)).toEqual([]);
  });

  it('o dono põe item na mochila e muda as moedas', async () => {
    const insert = await player.client
      .from('character_items')
      .insert({ character_id: characterId, container_id: backpackId, item_ref: rope, quantity: 2 });
    expect(insert.error).toBeNull();

    const coins = { cp: 1, sp: 2, ep: 0, gp: 30, pp: 0 };
    const update = await player.client
      .from('character_containers')
      .update({ coins })
      .eq('id', pouchId)
      .select('coins')
      .single();
    expect(update.error).toBeNull();
    expect(update.data?.coins).toEqual(coins);

    const own = await player.client.from('character_items').select('item_ref, quantity');
    expect(own.data).toEqual([{ item_ref: rope, quantity: 2 }]);
  });

  it('o mestre da mesa lê lugares e itens e não insere, muda nem apaga (Ponto 5)', async () => {
    await admin()
      .from('character_items')
      .insert({ character_id: characterId, container_id: backpackId, item_ref: rope, quantity: 2 });

    const containers = await gm.client.from('character_containers').select('id');
    const items = await gm.client.from('character_items').select('item_ref');
    expect(containers.data?.map((c) => c.id).sort()).toEqual([pouchId, backpackId].sort());
    expect(items.data).toEqual([{ item_ref: rope }]);

    const insertItem = await gm.client.from('character_items').insert({
      character_id: characterId,
      container_id: backpackId,
      item_ref: torch,
      quantity: 1,
    });
    expect(insertItem.error).not.toBeNull();
    const insertChest = await gm.client
      .from('character_containers')
      .insert({ character_id: characterId, kind: 'chest' });
    expect(insertChest.error).not.toBeNull();

    // Update e delete negados pelo RLS não dão erro: não mexem em nada
    await gm.client
      .from('character_containers')
      .update({ coins: { ...emptyCoins, gp: 999 } })
      .eq('id', pouchId);
    await gm.client.from('character_items').update({ quantity: 99 }).eq('item_ref', rope);
    await gm.client.from('character_items').delete().eq('item_ref', rope);
    await gm.client.from('character_containers').delete().eq('id', backpackId);

    expect(await containersOf(characterId)).toEqual([
      expect.objectContaining({ id: pouchId, coins: emptyCoins }),
      expect.objectContaining({ id: backpackId }),
    ]);
    expect(await itemsOf(characterId)).toEqual([
      { container_id: backpackId, item_ref: rope, quantity: 2 },
    ]);
  });

  it('o colega de mesa e o estranho não leem lugares nem itens', async () => {
    await admin()
      .from('character_items')
      .insert({ character_id: characterId, container_id: backpackId, item_ref: rope, quantity: 2 });

    for (const session of [colleague, stranger]) {
      const containers = await session.client.from('character_containers').select('id');
      const items = await session.client.from('character_items').select('id');
      expect(containers.data).toEqual([]);
      expect(items.data).toEqual([]);
    }
  });

  it('o estranho não põe item nem lugar no personagem dos outros', async () => {
    const insertItem = await stranger.client
      .from('character_items')
      .insert({ character_id: characterId, container_id: backpackId, item_ref: rope, quantity: 1 });
    const insertChest = await stranger.client
      .from('character_containers')
      .insert({ character_id: characterId, kind: 'chest' });
    expect(insertItem.error).not.toBeNull();
    expect(insertChest.error).not.toBeNull();
  });

  it('a algibeira não se apaga, nem vira outro tipo, e não há segunda algibeira', async () => {
    const remove = await player.client.from('character_containers').delete().eq('id', pouchId);
    expect(remove.error?.message).toContain('coin_pouch_required');

    const asAdmin = await admin().from('character_containers').delete().eq('id', pouchId);
    expect(asAdmin.error?.message).toContain('coin_pouch_required');

    const retype = await player.client
      .from('character_containers')
      .update({ kind: 'backpack' })
      .eq('id', pouchId);
    expect(retype.error).not.toBeNull();

    const second = await player.client
      .from('character_containers')
      .insert({ character_id: characterId, kind: 'coin_pouch' });
    expect(second.error).not.toBeNull();

    expect((await containersOf(characterId)).filter((c) => c.kind === 'coin_pouch')).toHaveLength(
      1,
    );
  });

  it('o dono apaga uma mochila extra com os itens dela', async () => {
    const { data: extra } = await player.client
      .from('character_containers')
      .insert({
        character_id: characterId,
        kind: 'backpack',
        name: 'Mochila do cavalo',
        position: 2,
      })
      .select('id')
      .single();
    await player.client
      .from('character_items')
      .insert({ character_id: characterId, container_id: extra!.id, item_ref: rope, quantity: 1 });

    const remove = await player.client.from('character_containers').delete().eq('id', extra!.id);
    expect(remove.error).toBeNull();
    expect(await containersOf(characterId)).toHaveLength(2);
    expect(await itemsOf(characterId)).toEqual([]);
  });

  it('apagar o personagem apaga lugares e itens', async () => {
    await player.client
      .from('character_items')
      .insert({ character_id: characterId, container_id: backpackId, item_ref: rope, quantity: 1 });

    const { error } = await admin().from('characters').delete().eq('id', characterId);
    expect(error).toBeNull();
    expect(await containersOf(characterId)).toEqual([]);
    expect(await itemsOf(characterId)).toEqual([]);
  });

  it('apagar a conta apaga personagens, lugares e itens', async () => {
    await player.client
      .from('character_items')
      .insert({ character_id: characterId, container_id: backpackId, item_ref: rope, quantity: 1 });

    const { error } = await admin().auth.admin.deleteUser(player.userId);
    expect(error).toBeNull();
    expect(await containersOf(characterId)).toEqual([]);
    expect(await itemsOf(characterId)).toEqual([]);
  });

  it('quantidade fora de 1 a 9999 falha; repetir o item no mesmo lugar falha', async () => {
    for (const quantity of [0, 10000]) {
      const { error } = await player.client
        .from('character_items')
        .insert({ character_id: characterId, container_id: backpackId, item_ref: rope, quantity });
      expect(error).not.toBeNull();
    }
    await player.client
      .from('character_items')
      .insert({ character_id: characterId, container_id: backpackId, item_ref: rope, quantity: 1 });
    const repeated = await player.client
      .from('character_items')
      .insert({ character_id: characterId, container_id: backpackId, item_ref: rope, quantity: 1 });
    expect(repeated.error).not.toBeNull();
  });

  it('moedas negativas, quebradas, acima do teto ou sem as cinco chaves falham', async () => {
    for (const coins of [
      { ...emptyCoins, gp: -1 },
      { ...emptyCoins, gp: 1.5 },
      { ...emptyCoins, gp: 1000000001 },
      { ...emptyCoins, gp: '10' },
      { cp: 0, sp: 0, ep: 0, gp: 0 },
      { ...emptyCoins, xp: 1 },
    ]) {
      const { error } = await player.client
        .from('character_containers')
        .update({ coins })
        .eq('id', pouchId);
      expect(error, JSON.stringify(coins)).not.toBeNull();
    }
    const top = await player.client
      .from('character_containers')
      .update({ coins: { ...emptyCoins, pp: 1000000000 } })
      .eq('id', pouchId);
    expect(top.error).toBeNull();
  });

  it('item num lugar de outro personagem falha, mesmo do mesmo dono', async () => {
    const otherId = await createCharacter(player.userId, { name: 'Outra' });
    const otherBackpack = await containerId(otherId, 'backpack');

    const insert = await player.client.from('character_items').insert({
      character_id: characterId,
      container_id: otherBackpack,
      item_ref: rope,
      quantity: 1,
    });
    expect(insert.error).not.toBeNull();

    await player.client
      .from('character_items')
      .insert({ character_id: characterId, container_id: backpackId, item_ref: rope, quantity: 1 });
    const move = await player.client
      .from('character_items')
      .update({ container_id: otherBackpack })
      .eq('character_id', characterId);
    expect(move.error).not.toBeNull();
    expect(await itemsOf(otherId)).toEqual([]);
  });

  it('até 20 lugares e 500 entradas por personagem', async () => {
    const chests = Array.from({ length: 18 }, (_, i) => ({
      character_id: characterId,
      kind: 'chest',
      position: i + 2,
    }));
    expect((await admin().from('character_containers').insert(chests)).error).toBeNull();
    const twentyFirst = await player.client
      .from('character_containers')
      .insert({ character_id: characterId, kind: 'chest' });
    expect(twentyFirst.error?.message).toContain('container_limit');

    const items = Array.from({ length: 500 }, (_, i) => ({
      character_id: characterId,
      container_id: backpackId,
      item_ref: `dnd5e:srd-5.2:item:thing-${i}`,
      quantity: 1,
    }));
    expect((await admin().from('character_items').insert(items)).error).toBeNull();
    const fiveHundredFirst = await player.client
      .from('character_items')
      .insert({ character_id: characterId, container_id: pouchId, item_ref: rope, quantity: 1 });
    expect(fiveHundredFirst.error?.message).toContain('item_limit');

    // No limite, somar a uma entrada que já existe continua valendo
    const upsert = await player.client.from('character_items').upsert(
      {
        character_id: characterId,
        container_id: backpackId,
        item_ref: 'dnd5e:srd-5.2:item:thing-0',
        quantity: 3,
      },
      { onConflict: 'container_id,item_ref' },
    );
    expect(upsert.error).toBeNull();
  });

  it('duplicate_character copia moedas, lugares e itens para a cópia; o original não muda (Ponto 1)', async () => {
    const coins = { cp: 3, sp: 50, ep: 0, gp: 120, pp: 1 };
    await player.client.from('character_containers').update({ coins }).eq('id', pouchId);
    await player.client
      .from('character_containers')
      .update({ name: 'Mochila de couro' })
      .eq('id', backpackId);
    const { data: horse } = await player.client
      .from('character_containers')
      .insert({
        character_id: characterId,
        kind: 'backpack',
        name: 'Mochila do cavalo',
        position: 2,
      })
      .select('id')
      .single();
    await player.client.from('character_items').insert([
      { character_id: characterId, container_id: backpackId, item_ref: rope, quantity: 2 },
      { character_id: characterId, container_id: horse!.id, item_ref: torch, quantity: 10 },
    ]);
    const before = {
      containers: await containersOf(characterId),
      items: await itemsOf(characterId),
    };

    const { data: copyId, error } = await player.client.rpc('duplicate_character', {
      p_character_id: characterId,
      p_name: 'Arani (cópia)',
    });
    if (error) throw error;

    expect({
      containers: await containersOf(characterId),
      items: await itemsOf(characterId),
    }).toEqual(before);

    const copyContainers = await containersOf(copyId);
    expect(
      copyContainers.map(({ kind, name, position, coins }) => ({ kind, name, position, coins })),
    ).toEqual(
      before.containers.map(({ kind, name, position, coins }) => ({ kind, name, position, coins })),
    );
    const copyIds = new Set(copyContainers.map((c) => c.id));
    expect(before.containers.some((c) => copyIds.has(c.id))).toBe(false);

    const byOriginal = new Map(before.containers.map((c, i) => [c.id, copyContainers[i].id]));
    expect(await itemsOf(copyId)).toEqual(
      before.items.map((item) => ({ ...item, container_id: byOriginal.get(item.container_id) })),
    );
  });
});
