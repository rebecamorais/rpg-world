import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { addMember, createParty } from '../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();

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

// A coin typed by hand is the final value, written only if the chest still has what the person
// saw (fase-2-resultados, causa 2: she saw 50, the GM gave +5, she typed 70 and got 75).
describe('set_container_coins_if_unchanged (Integration)', () => {
  let gm: Session;
  let player: Session;
  let stranger: Session;
  let partyId: string;
  let chest: string;

  const typeCoins = (
    s: Session,
    coins: Record<string, number>,
    expected: Record<string, number>,
    key: string = crypto.randomUUID(),
  ) =>
    s.client.rpc('set_container_coins_if_unchanged', {
      p_owner_id: partyId,
      p_container_id: chest,
      p_coins: coins,
      p_expected: expected,
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
      .update({ coins: { cp: 0, sp: 4, ep: 0, gp: 50, pp: 0 } })
      .eq('id', chest);
  });

  it('com o valor que a pessoa viu, grava o número digitado (não soma)', async () => {
    const { data, error } = await typeCoins(player, { gp: 70 }, { gp: 50 });

    expect(error).toBeNull();
    expect(data).toEqual({ cp: 0, sp: 4, ep: 0, gp: 70, pp: 0 });
    expect(await coinsOf(chest)).toEqual({ cp: 0, sp: 4, ep: 0, gp: 70, pp: 0 });
  });

  it('mudou desde que a pessoa viu: não grava e diz quanto há agora', async () => {
    await gm.client.rpc('change_container_coins', {
      p_owner_id: partyId,
      p_container_id: chest,
      p_delta: { gp: 5 },
      p_key: crypto.randomUUID(),
    });

    const { error } = await typeCoins(player, { gp: 70 }, { gp: 50 });

    expect(error?.message).toBe('coins_changed');
    expect(JSON.parse(error?.details ?? '')).toEqual({ cp: 0, sp: 4, ep: 0, gp: 55, pp: 0 });
    expect((await coinsOf(chest)).gp).toBe(55);
  });

  it('confere só as moedas digitadas: a prata mudar não barra o ouro', async () => {
    await admin()
      .from('containers')
      .update({ coins: { cp: 0, sp: 9, ep: 0, gp: 50, pp: 0 } })
      .eq('id', chest);

    expect((await typeCoins(player, { gp: 70 }, { gp: 50 })).error).toBeNull();
    expect(await coinsOf(chest)).toEqual({ cp: 0, sp: 9, ep: 0, gp: 70, pp: 0 });
  });

  it('o reenvio da mesma chave (a resposta se perdeu) não vira conflito nem grava de novo', async () => {
    const key = crypto.randomUUID();
    await typeCoins(player, { gp: 70 }, { gp: 50 }, key);

    const again = await typeCoins(player, { gp: 70 }, { gp: 50 }, key);

    expect(again.error).toBeNull();
    expect((again.data as { gp: number }).gp).toBe(70);
  });

  it('um conflito não gasta a chave', async () => {
    const key = crypto.randomUUID();
    await admin()
      .from('containers')
      .update({ coins: { cp: 0, sp: 4, ep: 0, gp: 55, pp: 0 } })
      .eq('id', chest);
    expect((await typeCoins(player, { gp: 70 }, { gp: 50 }, key)).error?.message).toBe(
      'coins_changed',
    );

    expect((await typeCoins(player, { gp: 70 }, { gp: 55 }, key)).error).toBeNull();
    expect((await coinsOf(chest)).gp).toBe(70);
  });

  it('recusa moedas diferentes no valor e no esperado, moeda desconhecida e negativa', async () => {
    expect((await typeCoins(gm, { gp: 70 }, { sp: 4 })).error?.message).toBe('invalid_coins');
    expect((await typeCoins(gm, { xp: 1 }, { xp: 0 })).error?.message).toBe('invalid_coins');
    expect((await typeCoins(gm, { gp: -1 }, { gp: 50 })).error?.message).toBe('invalid_coins');
    expect((await typeCoins(gm, {}, {})).error?.message).toBe('invalid_coins');
    expect((await coinsOf(chest)).gp).toBe(50);
  });

  it('quem não é da mesa recebe null e nada muda', async () => {
    const { data, error } = await typeCoins(stranger, { gp: 70 }, { gp: 50 });

    expect(error).toBeNull();
    expect(data).toBeNull();
    expect((await coinsOf(chest)).gp).toBe(50);
  });
});
