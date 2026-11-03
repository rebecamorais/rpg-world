import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import {
  addMember,
  chooseUsername,
  createCharacter,
  inviteCode,
} from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';
import { PartyErrorCodes } from '../domain/PartyError';
import { SupabasePartyRepository } from './supabase-party.repository';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

describe('SupabasePartyRepository (Integration)', () => {
  let gm: Session;
  let stranger: Session;

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    stranger = await createSignedInClient('stranger');
  });

  it('cria, renomeia, troca o código e apaga a mesa do mestre', async () => {
    const repo = new SupabasePartyRepository(gm.client);

    const id = await repo.create(gm.userId, 'Mesa');
    expect(await repo.rename(id, 'Mesa Nova')).toBe(true);
    expect(await repo.setEdition(id, '2014')).toBe(true);
    expect((await repo.findParty(id))?.edition).toBe('2014');
    const code = crypto.randomUUID().replaceAll('-', '');
    expect(await repo.setInviteCode(id, code)).toBe(true);
    expect(await inviteCode(id)).toBe(code);

    expect(await repo.listMine()).toEqual([
      {
        id,
        name: 'Mesa Nova',
        system: 'dnd_5e',
        role: 'gm',
        status: 'gm',
        gmUsername: null,
        pendingRequests: 0,
      },
    ]);
    expect(await repo.delete(id)).toBe(true);
    expect(await repo.listMine()).toEqual([]);
  });

  it('o mestre grava, troca e remove o diário', async () => {
    const repo = new SupabasePartyRepository(gm.client);
    const id = await repo.create(gm.userId, 'Mesa');
    const first = '1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-ab';
    const second = '9ZyXwVuTsRqPoNmLkJiHgFeDcBa_0123456789-zz';

    expect(await repo.journalDocId(id)).toBeNull();
    await repo.setJournal(id, first);
    expect(await repo.journalDocId(id)).toBe(first);
    await repo.setJournal(id, second);
    expect(await repo.journalDocId(id)).toBe(second);
    await repo.setJournal(id, null);
    expect(await repo.journalDocId(id)).toBeNull();
  });

  it('em mesa alheia renomear, trocar o código e apagar respondem false', async () => {
    const id = await new SupabasePartyRepository(gm.client).create(gm.userId, 'Mesa');
    const repo = new SupabasePartyRepository(stranger.client);

    expect(await repo.rename(id, 'X')).toBe(false);
    expect(await repo.setEdition(id, '2014')).toBe(false);
    expect(await repo.setInviteCode(id, crypto.randomUUID().replaceAll('-', ''))).toBe(false);
    expect(await repo.delete(id)).toBe(false);
  });

  it('traduz party_gm_limit para PartyError GM_LIMIT', async () => {
    const repo = new SupabasePartyRepository(gm.client);
    for (let i = 1; i <= 5; i++) await repo.create(gm.userId, `Mesa ${i}`);

    const error = await repo.create(gm.userId, 'Mesa 6').catch((e) => e);

    expect(error.code).toBe(PartyErrorCodes.GM_LIMIT);
  });
});

describe('SupabasePartyRepository — convites e membros (Integration)', () => {
  let gm: Session;
  let player: Session;
  let partyId: string;
  let playerName: string;

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    playerName = `bia_${crypto.randomUUID().slice(0, 8)}`;
    await chooseUsername(player.userId, playerName);
    partyId = await new SupabasePartyRepository(gm.client).create(gm.userId, 'Mesa');
  });

  const playerParties = () => new SupabasePartyRepository(player.client).listMine();

  it('pedido pelo link → mestre aprova → a mesa aparece como ativa para o jogador', async () => {
    const code = await inviteCode(partyId);
    const repo = new SupabasePartyRepository(player.client);

    expect(await repo.getInvite(code)).toEqual({
      partyId,
      name: 'Mesa',
      gmUsername: null,
      myStatus: null,
    });
    expect(await repo.requestJoin(code)).toBe('requested');
    expect(
      await new SupabasePartyRepository(gm.client).activateMember(partyId, player.userId),
    ).toBe(true);

    expect(await playerParties()).toEqual([
      expect.objectContaining({ id: partyId, status: 'active' }),
    ]);
  });

  it('card do convite: nome e imagem para quem nem entrou na conta, nada mais', async () => {
    const code = await inviteCode(partyId);
    const gmRepo = new SupabasePartyRepository(gm.client);
    const anon = new SupabasePartyRepository(SupabaseFactory.createAnon());
    const imageUrl = `https://images.test/avatars/${gm.userId}/parties/${partyId}-v1.webp`;

    expect(await anon.inviteCard(code)).toEqual({ name: 'Mesa', imageUrl: null });
    expect(await gmRepo.setImage(partyId, imageUrl)).toBe(true);
    expect(await anon.inviteCard(code)).toEqual({ name: 'Mesa', imageUrl });
    expect(await anon.inviteCard('0'.repeat(32))).toBeNull();
    // A mesa em si continua fechada sem login
    await expect(anon.findParty(partyId)).rejects.toThrow('permission denied');
  });

  it('só o mestre muda a imagem da mesa', async () => {
    const code = await inviteCode(partyId);
    await new SupabasePartyRepository(player.client).requestJoin(code);
    await new SupabasePartyRepository(gm.client).activateMember(partyId, player.userId);

    expect(
      await new SupabasePartyRepository(player.client).setImage(partyId, 'https://evil.test/x'),
    ).toBe(false);
    expect((await new SupabasePartyRepository(gm.client).findParty(partyId))?.imageUrl).toBeNull();
  });

  it('código inexistente: getInvite null e requestJoin com INVITE_NOT_FOUND', async () => {
    const repo = new SupabasePartyRepository(player.client);

    expect(await repo.getInvite('0'.repeat(32))).toBeNull();
    expect((await repo.requestJoin('0'.repeat(32)).catch((e) => e)).code).toBe(
      PartyErrorCodes.INVITE_NOT_FOUND,
    );
  });

  it('convite por username → jogador aceita', async () => {
    expect(await new SupabasePartyRepository(gm.client).invite(partyId, playerName)).toBe(
      'invited',
    );
    expect(
      await new SupabasePartyRepository(player.client).activateMember(partyId, player.userId),
    ).toBe(true);

    expect(await playerParties()).toEqual([
      expect.objectContaining({ id: partyId, status: 'active' }),
    ]);
  });

  it('username desconhecido responde USER_NOT_FOUND', async () => {
    const error = await new SupabasePartyRepository(gm.client)
      .invite(partyId, 'ninguem_aqui')
      .catch((e) => e);

    expect(error.code).toBe(PartyErrorCodes.USER_NOT_FOUND);
  });

  it('jogador recusa o convite: some da lista dele', async () => {
    await new SupabasePartyRepository(gm.client).invite(partyId, playerName);

    expect(
      await new SupabasePartyRepository(player.client).deleteMember(partyId, player.userId),
    ).toBe(true);
    expect(await playerParties()).toEqual([]);
  });

  it('mestre tira o membro; tirar de novo responde false', async () => {
    const gmRepo = new SupabasePartyRepository(gm.client);
    await gmRepo.invite(partyId, playerName);
    await new SupabasePartyRepository(player.client).activateMember(partyId, player.userId);

    expect(await gmRepo.deleteMember(partyId, player.userId)).toBe(true);
    expect(await gmRepo.deleteMember(partyId, player.userId)).toBe(false);
  });
});

describe('SupabasePartyRepository — página da mesa (Integration)', () => {
  let gm: Session;
  let player: Session;
  let partyId: string;

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    partyId = await new SupabasePartyRepository(gm.client).create(gm.userId, 'Mesa');
    await addMember(partyId, player.userId, 'active');
  });

  it('o mestre recebe as fichas do Role Play: atributos, perícias e lore', async () => {
    const characterId = await createCharacter(player.userId, {
      attributes: { WIS: 16 },
      level: 1,
      system_data: { skills: { PERCEPTION: { isProficient: true } }, passivePerception: 10 },
    });
    await new SupabasePartyRepository(player.client).addCharacters(partyId, [characterId]);
    await SupabaseFactory.createAdmin()
      .from('character_lore')
      .insert({ character_id: characterId, ideals: 'Saber' });

    const sheets = await new SupabasePartyRepository(gm.client).rolePlaySheets([characterId]);

    expect(sheets).toEqual([
      {
        id: characterId,
        sheet: {
          attributes: { WIS: 16 },
          level: 1,
          skills: { PERCEPTION: { isProficient: true } },
        },
        lore: expect.objectContaining({ ideals: 'Saber' }),
      },
    ]);
  });

  it('levar um npc responde CHARACTER_NOT_ALLOWED', async () => {
    const npc = await createCharacter(player.userId, { kind: 'npc' });

    const error = await new SupabasePartyRepository(player.client)
      .addCharacters(partyId, [npc])
      .catch((e) => e);

    expect(error.code).toBe(PartyErrorCodes.CHARACTER_NOT_ALLOWED);
  });

  it('dois addCharacters iguais em paralelo terminam sem erro, com o personagem uma vez', async () => {
    const characterId = await createCharacter(player.userId);
    const repo = new SupabasePartyRepository(player.client);

    await Promise.all([
      repo.addCharacters(partyId, [characterId]),
      repo.addCharacters(partyId, [characterId]),
    ]);

    expect((await repo.roster(partyId)).map((c) => c.characterId)).toEqual([characterId]);
  });

  it('convidar quem já é membro ativo responde ALREADY_MEMBER', async () => {
    const username = `bia_${crypto.randomUUID().slice(0, 8)}`;
    await chooseUsername(player.userId, username);

    const error = await new SupabasePartyRepository(gm.client)
      .invite(partyId, username)
      .catch((e) => e);

    expect(error.code).toBe(PartyErrorCodes.ALREADY_MEMBER);
  });

  it('roster, pessoas e mesa vêm pelo repositório; tirar o personagem tira do roster', async () => {
    const characterId = await createCharacter(player.userId, { name: 'Arani' });
    const playerRepo = new SupabasePartyRepository(player.client);
    await playerRepo.addCharacters(partyId, [characterId]);

    expect(await playerRepo.findParty(partyId)).toEqual({
      id: partyId,
      name: 'Mesa',
      system: 'dnd_5e',
      gmId: gm.userId,
      edition: '2024',
      imageUrl: null,
    });
    expect((await playerRepo.people(partyId)).map((p) => p.status).sort()).toEqual([
      'active',
      'gm',
    ]);
    expect(await playerRepo.roster(partyId)).toEqual([
      expect.objectContaining({ characterId, ownerId: player.userId, name: 'Arani' }),
    ]);
    expect(await playerRepo.inviteCode(partyId)).toBeNull();
    expect(await new SupabasePartyRepository(gm.client).inviteCode(partyId)).toMatch(
      /^[a-f0-9]{32}$/,
    );

    await playerRepo.removeCharacters(partyId, [characterId]);
    expect(await playerRepo.roster(partyId)).toEqual([]);
  });
});
