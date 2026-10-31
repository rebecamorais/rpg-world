import { beforeEach, describe, expect, it } from 'vitest';

import { Lore } from '@backend/contexts/lore';
import { SupabaseLoreRepository } from '@backend/contexts/lore/infrastructure/repositories/supabase-lore.repository';

import { SupabaseFactory } from '@lib/supabase';

import { addMember, createCharacter, createParty } from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';
import { SupabaseCharacterSpellRepository } from '../../characters/infrastructure/repositories/supabase-character-spell.repository';
import { SupabaseCharacterRepository } from '../../characters/infrastructure/repositories/supabase-character.repository';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();
const fireball = 'dnd5e:srd-5.1:spell:fireball';

// The GM reads the whole sheet of the characters brought to their parties, through the same
// repositories the owner uses, and can't write any of it. Nobody else at the table reads it.
describe('Leitura do mestre (Integration)', () => {
  let gm: Session;
  let player: Session;
  let colleague: Session;
  let stranger: Session;
  let partyId: string;
  let characterId: string;

  const reads = async (session: Session, id = characterId) => ({
    character: await new SupabaseCharacterRepository(session.client).findById(id),
    lore: await new SupabaseLoreRepository(session.client).findByCharacterId(id),
    spells: await new SupabaseCharacterSpellRepository(session.client).findByCharacterId(id),
  });

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    colleague = await createSignedInClient('colleague');
    stranger = await createSignedInClient('stranger');
    partyId = await createParty(gm);
    await addMember(partyId, player.userId, 'active');
    await addMember(partyId, colleague.userId, 'active');

    characterId = await createCharacter(player.userId, {
      name: 'Arani',
      system_data: { race: 'Elfa', class: 'Maga' },
    });
    await new SupabaseLoreRepository(player.client).save(
      characterId,
      new Lore('120', undefined, undefined, undefined, undefined, undefined, 'Segredo'),
    );
    await new SupabaseCharacterSpellRepository(player.client).learn(characterId, fireball);

    const { error } = await player.client
      .from('party_characters')
      .insert({ party_id: partyId, character_id: characterId });
    if (error) throw error;
  });

  it('o mestre lê personagem, lore e magias pelos repositórios atuais', async () => {
    const { character, lore, spells } = await reads(gm);

    expect(character?.name).toBe('Arani');
    expect(lore?.backstory).toBe('Segredo');
    expect(spells).toEqual([expect.objectContaining({ ref: fireball })]);
  });

  it('o mestre não altera: ficha, lore e magias ficam como estavam', async () => {
    const characters = new SupabaseCharacterRepository(gm.client);
    const character = (await characters.findById(characterId))!;
    character.name = 'Sequestrada';
    await expect(characters.save(character)).rejects.toThrow();

    await expect(
      new SupabaseLoreRepository(gm.client).save(characterId, new Lore('1')),
    ).rejects.toThrow();
    await expect(
      new SupabaseCharacterSpellRepository(gm.client).learn(
        characterId,
        'dnd5e:srd-5.1:spell:shield',
      ),
    ).rejects.toThrow();
    // Update and delete denied by RLS are no-ops, not errors
    await new SupabaseCharacterSpellRepository(gm.client).togglePrepared(
      characterId,
      fireball,
      true,
    );
    await new SupabaseCharacterSpellRepository(gm.client).forget(characterId, fireball);
    await gm.client.from('characters').update({ name: 'Sequestrada' }).eq('id', characterId);
    await gm.client.from('characters').delete().eq('id', characterId);

    const { character: after, lore, spells } = await reads(player);
    expect(after?.name).toBe('Arani');
    expect(lore?.age).toBe('120');
    expect(spells).toEqual([expect.objectContaining({ ref: fireball, isPrepared: false })]);
  });

  it('o colega e o estranho não leem o personagem, a lore nem as magias', async () => {
    for (const session of [colleague, stranger]) {
      expect(await reads(session)).toEqual({ character: null, lore: null, spells: [] });
    }
  });

  it('o mestre não lê um personagem do jogador que não foi levado à mesa', async () => {
    const otherId = await createCharacter(player.userId, { name: 'Fora da mesa' });

    expect(await reads(gm, otherId)).toEqual({ character: null, lore: null, spells: [] });
  });

  it('depois que o jogador sai, o mestre não lê mais', async () => {
    await player.client
      .from('party_members')
      .delete()
      .eq('party_id', partyId)
      .eq('user_id', player.userId);

    expect(await reads(gm)).toEqual({ character: null, lore: null, spells: [] });
  });

  it('depois que o jogador apaga o personagem, o mestre não lê mais', async () => {
    await admin()
      .from('characters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', characterId);

    expect(await reads(gm)).toEqual({ character: null, lore: null, spells: [] });
  });

  it('o mestre de outra mesa não lê', async () => {
    const otherGm = await createSignedInClient('other-gm');
    await createParty(otherGm);

    expect(await reads(otherGm)).toEqual({ character: null, lore: null, spells: [] });
  });
});
