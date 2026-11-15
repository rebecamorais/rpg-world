import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';
import type { Database } from '@lib/types/database';

import {
  addMember,
  addParticipant,
  bring,
  createCharacter,
  createEncounter,
  createNpc,
  createParty,
} from '../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();
const rope = 'dnd5e:srd-5.2:item:rope';
const PRONE = 'dnd5e:srd-5.2:condition:prone';
const POISONED = 'dnd5e:srd-5.2:condition:poisoned';
const EXHAUSTION = 'dnd5e:srd-5.2:condition:exhaustion';

const chestOf = async (partyId: string) => {
  const { data, error } = await admin()
    .from('containers')
    .select('id')
    .eq('party_id', partyId)
    .eq('kind', 'party_chest')
    .single();
  if (error) throw error;
  return data.id;
};

const coinsOf = async (containerId: string) => {
  const { data, error } = await admin()
    .from('containers')
    .select('coins')
    .eq('id', containerId)
    .single();
  if (error) throw error;
  return data.coins as Record<string, number>;
};

// Two tabs (or the GM and a player) writing the same thing at once: each write is an operation
// applied in the database, so none undoes the other (fase-1-resultados, causa 2).
describe('Escritas concorrentes (Integration)', () => {
  let gm: Session;
  let player: Session;
  let stranger: Session;
  let partyId: string;
  let chest: string;

  const changeCoins = (s: Session, delta: Record<string, number>, key = crypto.randomUUID()) =>
    s.client.rpc('change_container_coins', {
      p_owner_id: partyId,
      p_container_id: chest,
      p_delta: delta,
      p_key: key,
    });

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    stranger = await createSignedInClient('stranger');
    partyId = await createParty(gm);
    await addMember(partyId, player.userId, 'active');
    chest = await chestOf(partyId);
    await admin()
      .from('containers')
      .update({ coins: { cp: 0, sp: 0, ep: 0, gp: 250, pp: 0 } })
      .eq('id', chest);
  });

  describe('change_container_coins', () => {
    it('+1 PO em duas abas ao mesmo tempo dá 252, não 251', async () => {
      const [a, b] = await Promise.all([
        changeCoins(gm, { gp: 1 }),
        changeCoins(player, { gp: 1 }),
      ]);
      expect(a.error).toBeNull();
      expect(b.error).toBeNull();
      expect((await coinsOf(chest)).gp).toBe(252);
    });

    it('a mesma chave duas vezes soma uma vez só e devolve as moedas de agora', async () => {
      const key = crypto.randomUUID();
      const first = await changeCoins(player, { gp: 5, sp: 3 }, key);
      const again = await changeCoins(player, { gp: 5, sp: 3 }, key);
      expect(first.data).toEqual({ cp: 0, sp: 3, ep: 0, gp: 255, pp: 0 });
      expect(again.data).toEqual(first.data);
      expect((await coinsOf(chest)).gp).toBe(255);
    });

    it('a chave é de cada usuário: a mesma chave de outra pessoa soma', async () => {
      const key = crypto.randomUUID();
      await changeCoins(gm, { gp: 1 }, key);
      await changeCoins(player, { gp: 1 }, key);
      expect((await coinsOf(chest)).gp).toBe(252);
    });

    it('gastar mais do que há falha com not_enough_coins e não muda nada (nem gasta a chave)', async () => {
      const key = crypto.randomUUID();
      const { error } = await changeCoins(player, { gp: -251 }, key);
      expect(error?.message).toBe('not_enough_coins');
      expect((await coinsOf(chest)).gp).toBe(250);

      // The failed attempt rolled its key back: the same key works once there is enough
      await changeCoins(gm, { gp: 1 }, crypto.randomUUID());
      expect((await changeCoins(player, { gp: -251 }, key)).error).toBeNull();
      expect((await coinsOf(chest)).gp).toBe(0);
    });

    it('para no teto de 1.000.000.000', async () => {
      await changeCoins(gm, { pp: 2_000_000_000 });
      expect((await coinsOf(chest)).pp).toBe(1_000_000_000);
    });

    it('recusa moeda desconhecida e valor quebrado', async () => {
      expect((await changeCoins(gm, { xp: 1 })).error?.message).toBe('invalid_coins');
      expect((await changeCoins(gm, { gp: 1.5 })).error?.message).toBe('invalid_coins');
    });

    it('quem não é da mesa, ou outro dono, recebe null e nada muda', async () => {
      expect((await changeCoins(stranger, { gp: 1 })).data).toBeNull();
      const other = await createParty(gm, 'Outra');
      const { data } = await gm.client.rpc('change_container_coins', {
        p_owner_id: other,
        p_container_id: chest,
        p_delta: { gp: 1 },
        p_key: crypto.randomUUID(),
      });
      expect(data).toBeNull();
      expect((await coinsOf(chest)).gp).toBe(250);
    });

    it('um null não gasta a chave: a mesma chave no lugar certo soma', async () => {
      const key = crypto.randomUUID();
      const { data } = await player.client.rpc('change_container_coins', {
        p_owner_id: crypto.randomUUID(),
        p_container_id: chest,
        p_delta: { gp: 1 },
        p_key: key,
      });
      expect(data).toBeNull();
      const { data: after } = await changeCoins(player, { gp: 1 }, key);
      expect((after as Record<string, number>).gp).toBe(251);
    });

    it('a algibeira do personagem: só o dono, e o mestre que lê a ficha não escreve', async () => {
      const heroId = await createCharacter(player.userId);
      await bring(player, partyId, heroId);
      const { data: pouch } = await admin()
        .from('containers')
        .select('id')
        .eq('character_id', heroId)
        .eq('kind', 'coin_pouch')
        .single();
      const change = (s: Session) =>
        s.client.rpc('change_container_coins', {
          p_owner_id: heroId,
          p_container_id: pouch!.id,
          p_delta: { sp: 2 },
          p_key: crypto.randomUUID(),
        });
      expect((await change(gm)).data).toBeNull();
      expect((await change(player)).data).toEqual({ cp: 0, sp: 2, ep: 0, gp: 0, pp: 0 });
    });
  });

  describe('change_inventory_item_quantity', () => {
    let item: string;
    const change = (s: Session, delta: number, key = crypto.randomUUID()) =>
      s.client.rpc('change_inventory_item_quantity', {
        p_owner_id: partyId,
        p_item_id: item,
        p_delta: delta,
        p_key: key,
      });
    const quantity = async () => {
      const { data } = await admin()
        .from('inventory_items')
        .select('quantity')
        .eq('id', item)
        .single();
      return data!.quantity;
    };

    beforeEach(async () => {
      const { data, error } = await admin()
        .from('inventory_items')
        .insert({ container_id: chest, item_ref: rope, quantity: 2 })
        .select('id')
        .single();
      if (error) throw error;
      item = data.id;
    });

    it('+1 em duas abas ao mesmo tempo soma as duas', async () => {
      await Promise.all([change(gm, 1), change(player, 1)]);
      expect(await quantity()).toBe(4);
    });

    it('a mesma chave duas vezes soma uma vez', async () => {
      const key = crypto.randomUUID();
      expect((await change(player, 3, key)).data).toBe(5);
      expect((await change(player, 3, key)).data).toBe(5);
      expect(await quantity()).toBe(5);
    });

    it('tirar abaixo de 1 falha com item_quantity_conflict; o teto é 9999', async () => {
      expect((await change(player, -2)).error?.message).toBe('item_quantity_conflict');
      expect(await quantity()).toBe(2);
      expect((await change(player, 20000)).data).toBe(9999);
    });

    it('quem não é da mesa recebe null', async () => {
      expect((await change(stranger, 1)).data).toBeNull();
      expect(await quantity()).toBe(2);
    });

    it('um null não gasta a chave: a mesma chave na entrada certa soma', async () => {
      const key = crypto.randomUUID();
      const { data } = await player.client.rpc('change_inventory_item_quantity', {
        p_owner_id: crypto.randomUUID(),
        p_item_id: item,
        p_delta: 1,
        p_key: key,
      });
      expect(data).toBeNull();
      expect((await change(player, 1, key)).data).toBe(3);
    });
  });

  describe('add_inventory_item_once', () => {
    it('a mesma chave duas vezes adiciona uma vez', async () => {
      const key = crypto.randomUUID();
      const add = () =>
        player.client.rpc('add_inventory_item_once', {
          p_container_id: chest,
          p_item_ref: rope,
          p_quantity: 2,
          p_key: key,
        });
      expect((await add()).data?.quantity).toBe(2);
      expect((await add()).data?.quantity).toBe(2);
      // Removed after the first time: the same key adds it back
      await admin().from('inventory_items').delete().eq('container_id', chest);
      expect((await add()).data?.quantity).toBe(2);
    });
  });

  describe('change_participant_condition', () => {
    let hero: string;
    let goblin: string;
    const change = (
      s: Session,
      participantId: string,
      key: string,
      active: boolean,
      level: number | null = null,
    ) =>
      s.client.rpc('change_participant_condition', {
        p_party_id: partyId,
        p_participant_id: participantId,
        p_key: key,
        // The generated type says number; the function accepts null for conditions without levels
        p_level: level as number,
        p_active: active,
      });
    const conditionsOf = async (participantId: string) => {
      const { data } = await admin()
        .from('encounter_participants')
        .select('conditions')
        .eq('id', participantId)
        .single();
      return data!.conditions;
    };

    beforeEach(async () => {
      const heroId = await createCharacter(player.userId);
      await bring(player, partyId, heroId);
      await createEncounter(gm, partyId);
      hero = await addParticipant(gm, partyId, heroId, 'player');
      goblin = await addParticipant(gm, partyId, await createNpc(gm.userId), 'enemy', 'Goblin 1');
    });

    it('mestre e jogadora ligando condições diferentes ao mesmo tempo ficam com as duas', async () => {
      const [a, b] = await Promise.all([
        change(gm, hero, PRONE, true),
        change(player, hero, POISONED, true),
      ]);
      expect(a.data).toBe(true);
      expect(b.data).toBe(true);
      const keys = ((await conditionsOf(hero)) as { key: string }[]).map((c) => c.key).sort();
      expect(keys).toEqual([POISONED, PRONE].sort());
    });

    it('muda o nível no lugar, desliga só a que foi pedida, e repetir não duplica', async () => {
      await change(gm, hero, EXHAUSTION, true, 1);
      await change(gm, hero, PRONE, true);
      await change(gm, hero, PRONE, true);
      await change(player, hero, EXHAUSTION, true, 3);
      expect(await conditionsOf(hero)).toEqual([
        { key: EXHAUSTION, level: 3 },
        { key: PRONE, level: null },
      ]);

      await change(player, hero, EXHAUSTION, false);
      await change(player, hero, EXHAUSTION, false);
      expect(await conditionsOf(hero)).toEqual([{ key: PRONE, level: null }]);
    });

    it('a jogadora não mexe no inimigo; quem não é da mesa também não', async () => {
      expect((await change(player, goblin, PRONE, true)).data).toBe(false);
      expect((await change(stranger, hero, PRONE, true)).data).toBe(false);
      expect(await conditionsOf(goblin)).toEqual([]);
      expect(await conditionsOf(hero)).toEqual([]);
    });

    it('formato inválido falha pelo CHECK', async () => {
      const { error } = await change(gm, hero, 'not-a-condition', true);
      expect(error?.code).toBe('23514');
    });
  });

  describe('characters.revision', () => {
    const versionsOf = async (id: string) => {
      const { data } = await admin()
        .from('characters')
        .select('revision, row_version')
        .eq('id', id)
        .single();
      return data!;
    };

    it('sobe só quando muda a ficha, com o valor mandado ignorado; row_version sobe sempre', async () => {
      const id = await createCharacter(player.userId);
      expect(await versionsOf(id)).toEqual({ revision: 0, row_version: 0 });

      await player.client
        .from('characters')
        .update({ hp_max: 12, revision: 99, row_version: 99 })
        .eq('id', id);
      expect(await versionsOf(id)).toEqual({ revision: 1, row_version: 1 });

      // The GM's damage in combat: game state, the player's draft stays valid
      await player.client.from('characters').update({ hp_current: 4 }).eq('id', id);
      expect(await versionsOf(id)).toEqual({ revision: 1, row_version: 2 });
    });

    it('estado de jogo no system_data, avatar e fundo não sobem a revisão', async () => {
      const id = await createCharacter(player.userId);
      const sheet = {
        ac: 12,
        spellSlots: { '1': { max: 2, used: 0 } },
        spellPoints: { max: 4, current: 4 },
        hitDice: { total: '1d8', current: 1 },
        resources: { 'custom:a': { used: 0, custom: { name: 'A', max: 2 } } },
      };
      const write = async (patch: Database['public']['Tables']['characters']['Update']) => {
        const { error } = await player.client.from('characters').update(patch).eq('id', id);
        if (error) throw error;
        return (await versionsOf(id)).revision;
      };
      expect(await write({ system_data: sheet })).toBe(1);

      const played = {
        ...sheet,
        hpTemp: 5,
        deathSaves: { successes: 1, failures: 1 },
        spellSlots: { '1': { max: 2, used: 2 } },
        spellPoints: { max: 4, current: 0 },
        hitDice: { total: '1d8', current: 0 },
        resources: {
          'custom:a': { used: 2, custom: { name: 'A', max: 2 } },
          // A class box spent for the first time
          'class:monk:ki': { used: 1 },
        },
      };
      expect(await write({ system_data: played })).toBe(1);
      expect(
        await write({ avatar_url: 'https://example.test/a.webp', sheet_background_url: null }),
      ).toBe(1);

      expect(
        await write({ system_data: { ...played, spellSlots: { '1': { max: 3, used: 2 } } } }),
      ).toBe(2);
      expect(await write({ system_data: { ...played, ac: 15 } })).toBe(3);
    });

    it('UPDATE condicionado ao row_version visto: o segundo com o antigo não muda nada', async () => {
      const id = await createCharacter(player.userId);
      const save = (ac: number) =>
        player.client
          .from('characters')
          .update({ system_data: { ac } })
          .eq('id', id)
          .eq('row_version', 0)
          .select('revision, row_version');
      expect((await save(20)).data).toEqual([{ revision: 1, row_version: 1 }]);
      expect((await save(18)).data).toEqual([]);
    });
  });
});
