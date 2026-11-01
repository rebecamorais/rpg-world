import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import {
  addMember,
  bring,
  createCharacter,
  createNpc,
  createParty,
} from '../../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../../test/helpers/signed-in-client';
import { CharacterErrorCodes } from '../../domain/CharacterError';
import { SupabaseCharacterRepository } from './supabase-character.repository';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();
const fireball = 'dnd5e:srd-5.1:spell:fireball';

describe('duplicate_character (Integration)', () => {
  let owner: Session;
  let characterId: string;

  const duplicate = (session: Session, id = characterId, name = 'Arani (cópia)') =>
    session.client.rpc('duplicate_character', { p_character_id: id, p_name: name });

  beforeEach(async () => {
    owner = await createSignedInClient('owner');
    characterId = await createCharacter(owner.userId, {
      name: 'Arani',
      level: 5,
      hp_max: 31,
      hp_current: 20,
      attributes: { STR: 8, DEX: 16 },
      system_data: { race: 'Elfa', class: 'Maga', ac: 13 },
      avatar_url: 'https://example.com/arani.webp',
      theme_color: '#123456',
    });
    const lore = await owner.client
      .from('character_lore')
      .insert({ character_id: characterId, backstory: 'Segredo', ideals: 'Saber' });
    const spells = await owner.client
      .from('character_spells')
      .insert({ character_id: characterId, spell_ref: fireball, is_prepared: true });
    if (lore.error ?? spells.error) throw lore.error ?? spells.error;
  });

  it('o dono duplica: ficha, lore e magias iguais, nome novo, sem avatar, mesmo kind', async () => {
    const { data: copyId, error } = await duplicate(owner);
    if (error) throw error;

    const columns =
      'owner_id, name, system, level, attributes, system_data, hp_current, hp_max, avatar_url, theme_color, kind';
    const [original, copy] = await Promise.all(
      [characterId, copyId].map(
        async (id) => (await admin().from('characters').select(columns).eq('id', id).single()).data,
      ),
    );
    expect(copy).toEqual({ ...original, name: 'Arani (cópia)', avatar_url: null });

    const lore = await admin()
      .from('character_lore')
      .select('backstory, ideals')
      .eq('character_id', copyId)
      .single();
    expect(lore.data).toEqual({ backstory: 'Segredo', ideals: 'Saber' });
    const spells = await admin()
      .from('character_spells')
      .select('spell_ref, is_prepared')
      .eq('character_id', copyId);
    expect(spells.data).toEqual([{ spell_ref: fireball, is_prepared: true }]);
  });

  it('uma ficha npc continua npc; sem lore nem magias a cópia sai sem elas', async () => {
    const npcId = await createNpc(owner.userId, 'Goblin');

    const { data: copyId, error } = await duplicate(owner, npcId, 'Goblin chefe');
    if (error) throw error;

    const copy = await admin().from('characters').select('name, kind').eq('id', copyId).single();
    expect(copy.data).toEqual({ name: 'Goblin chefe', kind: 'npc' });
  });

  it('o mestre não duplica a ficha de um jogador da mesa (character_not_found)', async () => {
    const gm = await createSignedInClient('gm');
    const partyId = await createParty(gm);
    await addMember(partyId, owner.userId, 'active');
    await bring(owner, partyId, characterId);

    const { error } = await duplicate(gm);
    expect(error?.message).toBe('character_not_found');
  });

  it('ficha apagada não é duplicada', async () => {
    await admin()
      .from('characters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', characterId);

    const { error } = await duplicate(owner);
    expect(error?.message).toBe('character_not_found');
  });

  it('pelo repositório: devolve o id da cópia; ficha alheia vira CharacterError ACCESS_NOT_FOUND', async () => {
    const copyId = await new SupabaseCharacterRepository(owner.client).duplicate(
      characterId,
      'Arani 2',
    );
    expect(copyId).toMatch(/^[0-9a-f-]{36}$/);

    const intruder = await createSignedInClient('intruder');
    const error = await new SupabaseCharacterRepository(intruder.client)
      .duplicate(characterId, 'Roubada')
      .catch((e) => e);
    expect(error.code).toBe(CharacterErrorCodes.ACCESS_NOT_FOUND);
  });
});
