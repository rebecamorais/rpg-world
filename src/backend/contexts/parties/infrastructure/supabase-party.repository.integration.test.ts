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

  it('em mesa alheia renomear, trocar o código e apagar respondem false', async () => {
    const id = await new SupabasePartyRepository(gm.client).create(gm.userId, 'Mesa');
    const repo = new SupabasePartyRepository(stranger.client);

    expect(await repo.rename(id, 'X')).toBe(false);
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

  it('roster, pessoas e mesa vêm pelo repositório; tirar o personagem tira do roster', async () => {
    const characterId = await createCharacter(player.userId, { name: 'Arani' });
    const playerRepo = new SupabasePartyRepository(player.client);
    await playerRepo.addCharacters(partyId, [characterId]);

    expect(await playerRepo.findParty(partyId)).toEqual({
      id: partyId,
      name: 'Mesa',
      system: 'dnd_5e',
      gmId: gm.userId,
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
