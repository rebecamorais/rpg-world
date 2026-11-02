import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import type { Database } from '@database-types';

import {
  addMember,
  bring,
  createCharacter,
  createNpc,
  createParty,
} from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();
const rope = 'dnd5e:srd-5.2:item:rope';
const torch = 'dnd5e:srd-5.2:item:torch';
const emptyCoins = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
const RLS = 'row-level security';

const containersOf = async (characterId: string) => {
  const { data, error } = await admin()
    .from('containers')
    .select('id, kind, name, position, coins')
    .eq('character_id', characterId)
    .order('position')
    .order('created_at')
    .order('id');
  if (error) throw error;
  return data;
};

const itemsIn = async (containerIds: string[]) => {
  const { data, error } = await admin()
    .from('inventory_items')
    .select('container_id, item_ref, quantity')
    .in('container_id', containerIds)
    .order('item_ref');
  if (error) throw error;
  return data;
};

const itemsOf = async (characterId: string) =>
  itemsIn((await containersOf(characterId)).map((c) => c.id));

const containerId = async (characterId: string, kind: 'coin_pouch' | 'backpack') =>
  (await containersOf(characterId)).find((c) => c.kind === kind)!.id;

const createPartyChest = async (partyId: string) => {
  const { data, error } = await admin()
    .from('containers')
    .insert({ party_id: partyId, kind: 'party_chest' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
};

const fill = async (id: string, count: number) => {
  const items = Array.from({ length: count }, (_, i) => ({
    container_id: id,
    item_ref: `dnd5e:srd-5.2:item:thing-${i}`,
    quantity: 1,
  }));
  const { error } = await admin().from('inventory_items').insert(items);
  if (error) throw error;
};

const addChests = async (characterId: string, count: number, from = 2) => {
  const chests = Array.from({ length: count }, (_, i) => ({
    character_id: characterId,
    kind: 'chest',
    name: `Baú ${i}`,
    position: from + i,
  }));
  const { error } = await admin().from('containers').insert(chests);
  if (error) throw error;
};

// Inventário: lugares (algibeira, mochila, baú do personagem; baú da party) e as entradas de
// itens. Lugar de personagem: o dono lê e escreve, o mestre da mesa só lê. Baú da party: todo
// membro ativo e o mestre leem e escrevem. Mais ninguém vê.
describe('Inventário (Integration)', () => {
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
    await bring(player, partyId, characterId);

    pouchId = await containerId(characterId, 'coin_pouch');
    backpackId = await containerId(characterId, 'backpack');
  });

  describe('lugares padrão', () => {
    it('personagem novo, pc ou npc, tem exatamente uma algibeira e uma mochila, vazias (Ponto 1)', async () => {
      const npcId = await createNpc(gm.userId);
      for (const id of [characterId, npcId]) {
        expect(await containersOf(id)).toEqual([
          expect.objectContaining({
            kind: 'coin_pouch',
            position: 0,
            name: null,
            coins: emptyCoins,
          }),
          expect.objectContaining({ kind: 'backpack', position: 1, name: null, coins: emptyCoins }),
        ]);
        expect(await itemsOf(id)).toEqual([]);
      }
    });

    // Invariante global, não a carga em si: a carga da migração só roda sobre os personagens que já
    // existiam (conferida no banco de dev); aqui vale para todos os que estão no banco.
    it('o banco tem exatamente uma algibeira por personagem', async () => {
      const characters = await admin()
        .from('characters')
        .select('id', { count: 'exact', head: true });
      const pouches = await admin()
        .from('containers')
        .select('id', { count: 'exact', head: true })
        .eq('kind', 'coin_pouch');
      expect(characters.count).toBeGreaterThan(0);
      expect(pouches.count).toBe(characters.count);
    });

    it('personagem criado pelo próprio dono também ganha os dois', async () => {
      const { data, error } = await player.client
        .from('characters')
        .insert({ owner_id: player.userId, name: 'Pelo app' })
        .select('id')
        .single();
      if (error) throw error;
      expect((await containersOf(data.id)).map((c) => c.kind)).toEqual(['coin_pouch', 'backpack']);
    });
  });

  describe('lugares do personagem', () => {
    it('o dono põe item na mochila e muda as moedas', async () => {
      const insert = await player.client
        .from('inventory_items')
        .insert({ container_id: backpackId, item_ref: rope, quantity: 2 });
      expect(insert.error).toBeNull();

      const coins = { cp: 1, sp: 2, ep: 0, gp: 30, pp: 0 };
      const update = await player.client
        .from('containers')
        .update({ coins })
        .eq('id', pouchId)
        .select('coins')
        .single();
      expect(update.error).toBeNull();
      expect(update.data?.coins).toEqual(coins);

      const own = await player.client.from('inventory_items').select('item_ref, quantity');
      expect(own.data).toEqual([{ item_ref: rope, quantity: 2 }]);
    });

    it('o mestre da mesa lê lugares e itens e não insere, muda nem apaga (Ponto 5)', async () => {
      await admin()
        .from('inventory_items')
        .insert({ container_id: backpackId, item_ref: rope, quantity: 2 });

      const containers = await gm.client.from('containers').select('id');
      const items = await gm.client.from('inventory_items').select('item_ref');
      expect(containers.data?.map((c) => c.id).sort()).toEqual([pouchId, backpackId].sort());
      expect(items.data).toEqual([{ item_ref: rope }]);

      const insertItem = await gm.client
        .from('inventory_items')
        .insert({ container_id: backpackId, item_ref: torch, quantity: 1 });
      expect(insertItem.error?.message).toContain(RLS);
      const insertChest = await gm.client
        .from('containers')
        .insert({ character_id: characterId, kind: 'chest' });
      expect(insertChest.error?.message).toContain(RLS);

      // Update e delete negados pelo RLS não dão erro: não mexem em nada
      await gm.client
        .from('containers')
        .update({ coins: { ...emptyCoins, gp: 999 } })
        .eq('id', pouchId);
      await gm.client.from('inventory_items').update({ quantity: 99 }).eq('item_ref', rope);
      await gm.client.from('inventory_items').delete().eq('item_ref', rope);
      await gm.client.from('containers').delete().eq('id', backpackId);

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
        .from('inventory_items')
        .insert({ container_id: backpackId, item_ref: rope, quantity: 2 });

      for (const session of [colleague, stranger]) {
        const containers = await session.client.from('containers').select('id');
        const items = await session.client.from('inventory_items').select('id');
        expect(containers.data?.map((c) => c.id)).not.toContain(pouchId);
        expect(containers.data?.map((c) => c.id)).not.toContain(backpackId);
        expect(items.data).toEqual([]);
      }
    });

    it('o estranho não põe item nem lugar no personagem dos outros', async () => {
      const insertItem = await stranger.client
        .from('inventory_items')
        .insert({ container_id: backpackId, item_ref: rope, quantity: 1 });
      const insertChest = await stranger.client
        .from('containers')
        .insert({ character_id: characterId, kind: 'chest' });
      expect(insertItem.error?.message).toContain(RLS);
      expect(insertChest.error?.message).toContain(RLS);
    });

    it('a algibeira não se apaga, nem vira outro tipo, e não há segunda algibeira', async () => {
      const remove = await player.client.from('containers').delete().eq('id', pouchId);
      expect(remove.error?.message).toContain('coin_pouch_required');

      const asAdmin = await admin().from('containers').delete().eq('id', pouchId);
      expect(asAdmin.error?.message).toContain('coin_pouch_required');

      const retype = await player.client
        .from('containers')
        .update({ kind: 'backpack' })
        .eq('id', pouchId);
      expect(retype.error?.message).toContain('container_immutable');

      const promote = await player.client
        .from('containers')
        .update({ kind: 'coin_pouch' })
        .eq('id', backpackId);
      expect(promote.error).not.toBeNull();

      const second = await player.client
        .from('containers')
        .insert({ character_id: characterId, kind: 'coin_pouch' });
      expect(second.error).not.toBeNull();

      expect((await containersOf(characterId)).filter((c) => c.kind === 'coin_pouch')).toHaveLength(
        1,
      );
    });

    it('o dono apaga uma mochila extra com os itens dela', async () => {
      const { data: extra } = await player.client
        .from('containers')
        .insert({
          character_id: characterId,
          kind: 'backpack',
          name: 'Mochila do cavalo',
          position: 2,
        })
        .select('id')
        .single();
      await player.client
        .from('inventory_items')
        .insert({ container_id: extra!.id, item_ref: rope, quantity: 1 });

      const remove = await player.client.from('containers').delete().eq('id', extra!.id);
      expect(remove.error).toBeNull();
      expect(await containersOf(characterId)).toHaveLength(2);
      expect(await itemsOf(characterId)).toEqual([]);
    });

    it('apagar o personagem apaga lugares e itens', async () => {
      await player.client
        .from('inventory_items')
        .insert({ container_id: backpackId, item_ref: rope, quantity: 1 });

      const { error } = await admin().from('characters').delete().eq('id', characterId);
      expect(error).toBeNull();
      expect(await containersOf(characterId)).toEqual([]);
      expect(await itemsIn([pouchId, backpackId])).toEqual([]);
    });
  });

  describe('add_inventory_item', () => {
    it('adicionar duas vezes o mesmo item soma a quantidade numa entrada só (Ponto 3)', async () => {
      const first = await player.client.rpc('add_inventory_item', {
        p_container_id: backpackId,
        p_item_ref: rope,
        p_quantity: 1,
      });
      const second = await player.client.rpc('add_inventory_item', {
        p_container_id: backpackId,
        p_item_ref: rope,
        p_quantity: 1,
      });

      expect(first.error).toBeNull();
      expect(second.error).toBeNull();
      expect(second.data?.id).toBe(first.data?.id);
      expect(await itemsIn([backpackId])).toEqual([
        { container_id: backpackId, item_ref: rope, quantity: 2 },
      ]);
    });

    it('a soma para em 9999', async () => {
      await player.client.rpc('add_inventory_item', {
        p_container_id: backpackId,
        p_item_ref: rope,
        p_quantity: 9990,
      });
      const capped = await player.client.rpc('add_inventory_item', {
        p_container_id: backpackId,
        p_item_ref: rope,
        p_quantity: 50,
      });

      expect(capped.error).toBeNull();
      expect(capped.data?.quantity).toBe(9999);
    });

    it('quem não é o dono leva erro de RLS e nada muda', async () => {
      const { error } = await stranger.client.rpc('add_inventory_item', {
        p_container_id: backpackId,
        p_item_ref: rope,
        p_quantity: 1,
      });

      expect(error?.message).toContain(RLS);
      expect(await itemsIn([backpackId])).toEqual([]);
    });
  });

  describe('baú da party', () => {
    let chestId: string;

    beforeEach(async () => {
      chestId = await createPartyChest(partyId);
    });

    it('o mestre e os jogadores da mesa leem, põem item e mudam as moedas', async () => {
      for (const [session, ref] of [
        [gm, rope],
        [player, torch],
      ] as const) {
        const insert = await session.client
          .from('inventory_items')
          .insert({ container_id: chestId, item_ref: ref, quantity: 1 });
        expect(insert.error).toBeNull();
      }
      const coins = { ...emptyCoins, gp: 70 };
      const update = await player.client
        .from('containers')
        .update({ coins })
        .eq('id', chestId)
        .select('coins')
        .single();
      expect(update.error).toBeNull();
      expect(update.data?.coins).toEqual(coins);

      for (const session of [gm, player, colleague]) {
        const chest = await session.client.from('containers').select('id').eq('id', chestId);
        const items = await session.client
          .from('inventory_items')
          .select('item_ref')
          .eq('container_id', chestId)
          .order('item_ref');
        expect(chest.data).toEqual([{ id: chestId }]);
        expect(items.data).toEqual([{ item_ref: rope }, { item_ref: torch }]);
      }
    });

    it('quem não é da mesa não vê nem escreve', async () => {
      await admin()
        .from('inventory_items')
        .insert({ container_id: chestId, item_ref: rope, quantity: 1 });
      const invited = await createSignedInClient('invited');
      await addMember(partyId, invited.userId, 'invited');

      for (const session of [stranger, invited]) {
        const chest = await session.client.from('containers').select('id').eq('id', chestId);
        const items = await session.client
          .from('inventory_items')
          .select('id')
          .eq('container_id', chestId);
        expect(chest.data).toEqual([]);
        expect(items.data).toEqual([]);

        const insert = await session.client
          .from('inventory_items')
          .insert({ container_id: chestId, item_ref: torch, quantity: 1 });
        expect(insert.error?.message).toContain(RLS);
        await session.client
          .from('containers')
          .update({ coins: { ...emptyCoins, gp: 5 } })
          .eq('id', chestId);
      }
      const { data } = await admin().from('containers').select('coins').eq('id', chestId).single();
      expect(data?.coins).toEqual(emptyCoins);
      expect(await itemsIn([chestId])).toEqual([
        { container_id: chestId, item_ref: rope, quantity: 1 },
      ]);
    });

    it('não há dois baús na mesma mesa', async () => {
      const second = await gm.client
        .from('containers')
        .insert({ party_id: partyId, kind: 'party_chest' });
      expect(second.error).not.toBeNull();
    });

    it('o baú não se apaga; apagar a mesa apaga o baú e os itens', async () => {
      await admin()
        .from('inventory_items')
        .insert({ container_id: chestId, item_ref: rope, quantity: 1 });

      const byGm = await gm.client.from('containers').delete().eq('id', chestId);
      expect(byGm.error?.message).toContain('party_chest_required');
      const byAdmin = await admin().from('containers').delete().eq('id', chestId);
      expect(byAdmin.error?.message).toContain('party_chest_required');

      const { error } = await admin().from('parties').delete().eq('id', partyId);
      expect(error).toBeNull();
      const { data } = await admin().from('containers').select('id').eq('id', chestId);
      expect(data).toEqual([]);
      expect(await itemsIn([chestId])).toEqual([]);
    });
  });

  describe('dono único', () => {
    it('lugar sem dono, com os dois ou com o tipo errado para o dono falha', async () => {
      const otherParty = await createParty(gm, 'Outra mesa');
      const rows: Database['public']['Tables']['containers']['Insert'][] = [
        { kind: 'chest' },
        { character_id: characterId, party_id: otherParty, kind: 'chest' },
        { character_id: characterId, party_id: otherParty, kind: 'party_chest' },
        { character_id: characterId, kind: 'party_chest' },
        { party_id: otherParty, kind: 'backpack' },
        { party_id: otherParty, kind: 'coin_pouch' },
        { character_id: characterId, kind: 'sack' },
      ];
      for (const row of rows) {
        const { error } = await admin().from('containers').insert(row);
        expect(error, JSON.stringify(row)).not.toBeNull();
      }
      const { data } = await admin().from('containers').select('id').eq('party_id', otherParty);
      expect(data).toEqual([]);
    });

    it('o dono de um lugar não muda', async () => {
      const otherId = await createCharacter(player.userId, { name: 'Outra' });
      const toOther = await player.client
        .from('containers')
        .update({ character_id: otherId })
        .eq('id', backpackId);
      expect(toOther.error?.message).toContain('container_immutable');

      const chestId = await createPartyChest(partyId);
      const otherParty = await createParty(gm, 'Outra mesa');
      const toParty = await gm.client
        .from('containers')
        .update({ party_id: otherParty })
        .eq('id', chestId);
      expect(toParty.error?.message).toContain('container_immutable');

      expect(await containersOf(otherId)).toHaveLength(2);
    });
  });

  describe('valores', () => {
    it('a entrada não muda de item', async () => {
      await player.client
        .from('inventory_items')
        .insert({ container_id: backpackId, item_ref: rope, quantity: 1 });
      for (const client of [player.client, admin()]) {
        const { error } = await client
          .from('inventory_items')
          .update({ item_ref: torch })
          .eq('container_id', backpackId);
        expect(error?.message).toContain('item_immutable');
      }
      expect(await itemsOf(characterId)).toEqual([
        { container_id: backpackId, item_ref: rope, quantity: 1 },
      ]);
    });

    it('quantidade fora de 1 a 9999 e item_ref vazio ou longo falham', async () => {
      for (const row of [
        { item_ref: rope, quantity: 0 },
        { item_ref: rope, quantity: 10000 },
        { item_ref: '', quantity: 1 },
        { item_ref: 'x'.repeat(121), quantity: 1 },
      ]) {
        const { error } = await player.client
          .from('inventory_items')
          .insert({ container_id: backpackId, ...row });
        expect(error, JSON.stringify(row)).not.toBeNull();
      }
      const ok = await player.client
        .from('inventory_items')
        .insert({ container_id: backpackId, item_ref: rope, quantity: 9999 });
      expect(ok.error).toBeNull();
    });

    it('moedas negativas, fracionadas, acima do teto, em texto, faltando ou com chave a mais falham', async () => {
      for (const coins of [
        { ...emptyCoins, gp: -1 },
        { ...emptyCoins, gp: 1.5 },
        { ...emptyCoins, gp: 1000000001 },
        { ...emptyCoins, gp: '10' },
        { cp: 0, sp: 0, ep: 0, gp: 0 },
        { ...emptyCoins, xp: 1 },
      ]) {
        const { error } = await player.client
          .from('containers')
          .update({ coins })
          .eq('id', pouchId);
        expect(error, JSON.stringify(coins)).not.toBeNull();
      }
      const top = await player.client
        .from('containers')
        .update({ coins: { ...emptyCoins, pp: 1000000000 } })
        .eq('id', pouchId);
      expect(top.error).toBeNull();
    });
  });

  describe('mover itens', () => {
    it('da mochila do jogador para o baú da party da mesa dele funciona', async () => {
      const chestId = await createPartyChest(partyId);
      await player.client
        .from('inventory_items')
        .insert({ container_id: backpackId, item_ref: rope, quantity: 3 });

      const move = await player.client
        .from('inventory_items')
        .update({ container_id: chestId })
        .eq('container_id', backpackId)
        .select('container_id');
      expect(move.error).toBeNull();
      expect(move.data).toEqual([{ container_id: chestId }]);
      expect(await itemsOf(characterId)).toEqual([]);
    });

    it('para a mochila de outro jogador ou para o baú de outra mesa falha', async () => {
      const colleagueChar = await createCharacter(colleague.userId, { name: 'Colega' });
      const colleagueBackpack = await containerId(colleagueChar, 'backpack');
      const foreignParty = await createParty(stranger, 'Mesa alheia');
      const foreignChest = await createPartyChest(foreignParty);
      await player.client
        .from('inventory_items')
        .insert({ container_id: backpackId, item_ref: rope, quantity: 1 });

      for (const target of [colleagueBackpack, foreignChest]) {
        const move = await player.client
          .from('inventory_items')
          .update({ container_id: target })
          .eq('container_id', backpackId);
        expect(move.error?.message).toContain(RLS);
        expect(await itemsIn([target])).toEqual([]);
      }
      expect(await itemsOf(characterId)).toEqual([
        { container_id: backpackId, item_ref: rope, quantity: 1 },
      ]);
    });

    it('do baú da party para a mochila do colega, pelo próprio jogador, falha', async () => {
      const chestId = await createPartyChest(partyId);
      const colleagueChar = await createCharacter(colleague.userId, { name: 'Colega' });
      const colleagueBackpack = await containerId(colleagueChar, 'backpack');
      await admin()
        .from('inventory_items')
        .insert({ container_id: chestId, item_ref: rope, quantity: 1 });

      const move = await player.client
        .from('inventory_items')
        .update({ container_id: colleagueBackpack })
        .eq('container_id', chestId);
      expect(move.error?.message).toContain(RLS);
      expect(await itemsIn([colleagueBackpack])).toEqual([]);
    });
  });

  describe('limites', () => {
    it('o 21º lugar e a 501ª entrada falham; o upsert que soma passa', async () => {
      await addChests(characterId, 18);
      const twentyFirst = await player.client
        .from('containers')
        .insert({ character_id: characterId, kind: 'chest' });
      expect(twentyFirst.error?.message).toContain('container_limit');

      await fill(backpackId, 500);
      const fiveHundredFirst = await player.client
        .from('inventory_items')
        .insert({ container_id: pouchId, item_ref: rope, quantity: 1 });
      expect(fiveHundredFirst.error?.message).toContain('item_limit');

      // No limite, somar a uma entrada que já existe continua valendo
      const upsert = await player.client
        .from('inventory_items')
        .upsert(
          { container_id: backpackId, item_ref: 'dnd5e:srd-5.2:item:thing-0', quantity: 3 },
          { onConflict: 'container_id,item_ref' },
        );
      expect(upsert.error).toBeNull();

      // Mudar de lugar dentro do mesmo dono não cria entrada
      const sameOwner = await player.client
        .from('inventory_items')
        .update({ container_id: pouchId })
        .eq('container_id', backpackId)
        .eq('item_ref', 'dnd5e:srd-5.2:item:thing-1');
      expect(sameOwner.error).toBeNull();
    });

    it('mover um item para um dono no limite falha', async () => {
      const chestId = await createPartyChest(partyId);
      await fill(chestId, 500);
      await player.client
        .from('inventory_items')
        .insert({ container_id: backpackId, item_ref: rope, quantity: 1 });

      const move = await player.client
        .from('inventory_items')
        .update({ container_id: chestId })
        .eq('container_id', backpackId);
      expect(move.error?.message).toContain('item_limit');
      expect(await itemsOf(characterId)).toEqual([
        { container_id: backpackId, item_ref: rope, quantity: 1 },
      ]);

      // Para outro personagem do mesmo dono, no limite, também falha
      const otherId = await createCharacter(player.userId, { name: 'Cheia' });
      const otherBackpack = await containerId(otherId, 'backpack');
      await fill(otherBackpack, 500);
      const intoFull = await player.client
        .from('inventory_items')
        .update({ container_id: otherBackpack })
        .eq('container_id', backpackId);
      expect(intoFull.error?.message).toContain('item_limit');
    });

    it('quem não pode escrever recebe o erro do RLS, não o do limite', async () => {
      await addChests(characterId, 18);
      await fill(backpackId, 500);
      const chestId = await createPartyChest(partyId);
      await fill(chestId, 500);

      for (const session of [gm, colleague, stranger]) {
        for (const row of [
          { container_id: pouchId, item_ref: rope, quantity: 1 },
          // Upsert numa entrada que já existe, num personagem cheio
          { container_id: backpackId, item_ref: 'dnd5e:srd-5.2:item:thing-0', quantity: 2 },
        ]) {
          const item = await session.client
            .from('inventory_items')
            .upsert(row, { onConflict: 'container_id,item_ref' });
          expect(item.error?.message, JSON.stringify(row)).toContain(RLS);
        }
        const chest = await session.client
          .from('containers')
          .insert({ character_id: characterId, kind: 'chest' });
        expect(chest.error?.message).toContain(RLS);
      }

      const intoChest = await stranger.client
        .from('inventory_items')
        .insert({ container_id: chestId, item_ref: rope, quantity: 1 });
      expect(intoChest.error?.message).toContain(RLS);

      // Lugar que não existe: também o RLS, sem dizer se o id existe
      const ghost = await stranger.client
        .from('inventory_items')
        .insert({ container_id: crypto.randomUUID(), item_ref: rope, quantity: 1 });
      expect(ghost.error?.message).toContain(RLS);
    });
  });

  describe('duplicate_character', () => {
    it('copia moedas, lugares e itens para a cópia; o original não muda (Ponto 1)', async () => {
      const coins = { cp: 3, sp: 50, ep: 0, gp: 120, pp: 1 };
      await player.client.from('containers').update({ coins }).eq('id', pouchId);
      await player.client
        .from('containers')
        .update({ name: 'Mochila de couro' })
        .eq('id', backpackId);
      const { data: horse } = await player.client
        .from('containers')
        .insert({
          character_id: characterId,
          kind: 'backpack',
          name: 'Mochila do cavalo',
          position: 2,
        })
        .select('id')
        .single();
      await player.client.from('inventory_items').insert([
        { container_id: backpackId, item_ref: rope, quantity: 2 },
        { container_id: horse!.id, item_ref: torch, quantity: 10 },
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
      const shape = (rows: typeof copyContainers) =>
        rows.map(({ kind, name, position, coins }) => ({ kind, name, position, coins }));
      expect(shape(copyContainers)).toEqual(shape(before.containers));
      const copyIds = new Set(copyContainers.map((c) => c.id));
      expect(before.containers.some((c) => copyIds.has(c.id))).toBe(false);

      const byOriginal = new Map(before.containers.map((c, i) => [c.id, copyContainers[i].id]));
      expect(await itemsOf(copyId)).toEqual(
        before.items.map((item) => ({ ...item, container_id: byOriginal.get(item.container_id) })),
      );
    });

    it('copia um original sem mochila (algibeira + 19 baús) sem erro e igual (Ponto 1)', async () => {
      const remove = await player.client.from('containers').delete().eq('id', backpackId);
      expect(remove.error).toBeNull();
      await addChests(characterId, 19, 1);
      const before = await containersOf(characterId);
      expect(before).toHaveLength(20);

      const { data: copyId, error } = await player.client.rpc('duplicate_character', {
        p_character_id: characterId,
        p_name: 'Arani (cópia)',
      });
      if (error) throw error;

      const shape = (rows: typeof before) =>
        rows.map(({ kind, name, position, coins }) => ({ kind, name, position, coins }));
      expect(shape(await containersOf(copyId))).toEqual(shape(before));
    });

    it('copia um original só com a algibeira', async () => {
      await player.client.from('containers').delete().eq('id', backpackId);

      const { data: copyId, error } = await player.client.rpc('duplicate_character', {
        p_character_id: characterId,
        p_name: 'Arani (cópia)',
      });
      if (error) throw error;
      expect((await containersOf(copyId)).map((c) => c.kind)).toEqual(['coin_pouch']);
    });
  });
});
