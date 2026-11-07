import { beforeEach, describe, expect, it } from 'vitest';

import {
  addMember,
  bring,
  createCharacter,
  createNpc,
  createParty,
} from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';
import { CombatErrorCodes } from '../domain/CombatError';
import { SupabaseCombatRepository } from './supabase-combat.repository';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

describe('SupabaseCombatRepository (Integration)', () => {
  let gm: Session;
  let player: Session;
  let partyId: string;
  let heroId: string;
  let goblinId: string;
  let repo: SupabaseCombatRepository;

  const error = (promise: Promise<unknown>) => promise.then(() => null).catch((e) => e.code);

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    partyId = await createParty(gm);
    await addMember(partyId, player.userId, 'active');
    heroId = await createCharacter(player.userId, {
      name: 'Arani',
      hp_max: 20,
      hp_current: 12,
      level: 5,
      attributes: { WIS: 14 },
      system_data: { ac: 15, hpTemp: 2, race: 'Elfa', class: 'Maga', speed: 9 },
    });
    await bring(player, partyId, heroId);
    goblinId = await createNpc(gm.userId, 'Goblin', 7);
    repo = new SupabaseCombatRepository(gm.client);
  });

  it('fluxo do mestre: preparar, pôr 1 jogador e 3 goblins, ordenar, começar e passar 2 turnos', async () => {
    expect(await repo.findPartyGm(partyId)).toEqual({ gmId: gm.userId });
    expect(await repo.findEncounter(partyId)).toBeNull();
    expect(await repo.partyCharacterIds(partyId)).toEqual([heroId]);
    expect(await repo.enemySheet(goblinId)).toEqual({ name: 'Goblin' });
    expect(await repo.enemySheet(heroId)).toBeNull();

    await repo.create(partyId);
    await repo.addParticipants(partyId, [{ characterId: heroId, side: 'player', label: null }]);
    await repo.addParticipants(
      partyId,
      [1, 2, 3].map((n) => ({ characterId: goblinId, side: 'enemy', label: `Goblin ${n}` })),
    );

    const prepared = (await repo.findEncounter(partyId))!;
    expect(prepared.round).toBe(0);
    expect(prepared.participants.map((p) => [p.label, p.hpCurrent])).toEqual([
      [null, null],
      ['Goblin 1', 7],
      ['Goblin 2', 7],
      ['Goblin 3', 7],
    ]);

    const [hero, g1, g2, g3] = prepared.participants.map((p) => p.id);
    expect(await repo.updateParticipant(partyId, g1, { initiative: 18, hpCurrent: 4 })).toBe(true);
    await repo.setOrder(partyId, [g1, hero, g2, g3]);
    await repo.start(partyId);
    await repo.endTurn(partyId, g1);
    await new SupabaseCombatRepository(player.client).endTurn(partyId, hero);

    const running = (await repo.findEncounter(partyId))!;
    expect(running.round).toBe(1);
    expect(running.currentParticipantId).toBe(g2);
    expect(running.participants.map((p) => p.id)).toEqual([g1, hero, g2, g3]);
    expect(running.participants[0]).toMatchObject({ initiative: 18, hpCurrent: 4 });

    const [heroSheet] = await repo.sheets([heroId]);
    expect(heroSheet).toMatchObject({
      name: 'Arani',
      hpCurrent: 12,
      hpMax: 20,
      hpTemp: 2,
      ac: 15,
      level: 5,
      race: 'Elfa',
      class: 'Maga',
      speed: 9,
      avatarUrl: null,
      // The column's default
      accentColor: '#663399',
    });

    expect(await repo.removeParticipant(partyId, g3)).toBe(true);
    expect(await repo.finish(partyId)).toBe(true);
    expect(await repo.findEncounter(partyId)).toBeNull();
  });

  it('a visão do jogador pelo repositório: ordem, nomes e de quem é a vez', async () => {
    await repo.create(partyId);
    const playerRepo = new SupabaseCombatRepository(player.client);
    expect(await playerRepo.turns(partyId)).toEqual({ round: 0, turns: [] });

    await repo.addParticipants(partyId, [{ characterId: heroId, side: 'player', label: null }]);
    await repo.addParticipants(partyId, [
      { characterId: goblinId, side: 'enemy', label: 'Goblin' },
    ]);
    // NPC entra oculto; visível, o jogador o vê
    await gm.client
      .from('encounter_participants')
      .update({ visibility: 'visible' })
      .eq('party_id', partyId)
      .neq('side', 'player');
    await repo.start(partyId);

    expect(await playerRepo.turns(partyId)).toEqual({
      round: 1,
      turns: [
        {
          participantId: expect.any(String),
          name: 'Arani',
          isCurrent: true,
          isMine: true,
          conditions: [],
        },
        {
          participantId: expect.any(String),
          name: 'Goblin',
          isCurrent: false,
          isMine: false,
          conditions: [],
        },
      ],
    });
    expect(await playerRepo.findEncounter(partyId)).toBeNull();

    await repo.finish(partyId);
    expect(await playerRepo.turns(partyId)).toBeNull();
  });

  it('condições: setConditions grava, turns e findEncounter devolvem, e quem não pode recebe false', async () => {
    await repo.create(partyId);
    await repo.addParticipants(partyId, [{ characterId: heroId, side: 'player', label: null }]);
    const playerRepo = new SupabaseCombatRepository(player.client);
    const stranger = new SupabaseCombatRepository((await createSignedInClient('stranger')).client);
    const [{ id }] = (await repo.findEncounter(partyId))!.participants;
    expect((await repo.findEncounter(partyId))!.participants[0].conditions).toEqual([]);

    const conditions = [
      { key: 'dnd5e:srd-5.2:condition:prone', level: null },
      { key: 'dnd5e:srd-5.2:condition:exhaustion', level: 2 },
    ];
    expect(await repo.setConditions(partyId, id, conditions)).toBe(true);
    expect((await repo.findEncounter(partyId))!.participants[0].conditions).toEqual(conditions);
    expect((await playerRepo.turns(partyId))!.turns[0].conditions).toEqual(conditions);

    expect(await stranger.setConditions(partyId, id, [])).toBe(false);
    expect(await repo.setConditions(partyId, crypto.randomUUID(), [])).toBe(false);
  });

  it('cada erro do banco vira o CombatError certo', async () => {
    const playerRepo = new SupabaseCombatRepository(player.client);

    expect(await error(repo.start(partyId))).toBe(CombatErrorCodes.NOT_FOUND);
    await repo.create(partyId);
    expect(await error(repo.create(partyId))).toBe(CombatErrorCodes.EXISTS);
    expect(await error(repo.start(partyId))).toBe(CombatErrorCodes.EMPTY);

    const otherNpc = await createNpc(player.userId, 'Orc');
    expect(
      await error(
        repo.addParticipants(partyId, [{ characterId: otherNpc, side: 'enemy', label: 'Orc' }]),
      ),
    ).toBe(CombatErrorCodes.CHARACTER_NOT_ALLOWED);

    await repo.addParticipants(
      partyId,
      Array.from({ length: 50 }, (_, i) => ({
        characterId: goblinId,
        side: 'enemy' as const,
        label: `Goblin ${i + 1}`,
      })),
    );
    expect(
      await error(
        repo.addParticipants(partyId, [{ characterId: heroId, side: 'player', label: null }]),
      ),
    ).toBe(CombatErrorCodes.FULL);

    await repo.start(partyId);
    const { currentParticipantId } = (await repo.findEncounter(partyId))!;
    expect(await error(playerRepo.endTurn(partyId, currentParticipantId!))).toBe(
      CombatErrorCodes.NOT_YOUR_TURN,
    );
    expect(await error(playerRepo.create(partyId))).toBe(CombatErrorCodes.NOT_FOUND);
    expect(await playerRepo.finish(partyId)).toBe(false);
    expect(await playerRepo.removeParticipant(partyId, currentParticipantId!)).toBe(false);
  });
});
