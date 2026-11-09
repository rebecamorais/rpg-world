import { describe, expect, it, vi } from 'vitest';

import { getConditionCatalog } from '@backend/contexts/conditions';

import { CombatErrorCodes } from '../domain/CombatError';
import { toGmRow } from '../domain/gm-row';
import { CombatRepo, CombatSheet, ParticipantRecord } from '../domain/repository/combat.repo';
import { AddParticipantUseCase } from './add-participant.use-case';
import { EncounterCommands } from './encounter-commands';
import { GetEncounterUseCase } from './get-encounter.use-case';
import { SetConditionsUseCase } from './set-conditions.use-case';
import { UpdateParticipantUseCase } from './update-participant.use-case';

const sheet = (overrides: Partial<CombatSheet> = {}): CombatSheet => ({
  id: 'hero',
  ownerId: 'player-1',
  name: 'Arani',
  hpCurrent: 12,
  hpMax: 20,
  hpTemp: 3,
  avatarUrl: null,
  accentColor: '#1d4ed8',
  race: 'Elfa',
  class: 'Maga',
  ac: 15,
  speed: 9,
  level: 5,
  attributes: { WIS: 14 },
  skills: { PERCEPTION: { isProficient: true } },
  deathSaves: { successes: 1, failures: 2 },
  ...overrides,
});

const participant = (overrides: Partial<ParticipantRecord> = {}): ParticipantRecord => ({
  id: 'p-hero',
  characterId: 'hero',
  side: 'player',
  label: null,
  initiative: 14,
  position: 1,
  hpCurrent: null,
  hpTemp: null,
  conditions: [],
  visibility: 'visible',
  fate: null,
  deathSaves: { successes: 0, failures: 0 },
  deathRevealed: false,
  ...overrides,
});

const goblinSheet = sheet({
  id: 'goblin',
  name: 'Goblin',
  hpMax: 7,
  ac: 13,
  attributes: {},
  skills: {},
  deathSaves: null,
});

const makeRepo = () =>
  ({
    findPartyGm: vi.fn<CombatRepo['findPartyGm']>().mockResolvedValue({ gmId: 'gm-1' }),
    findEncounter: vi.fn<CombatRepo['findEncounter']>().mockResolvedValue({
      round: 0,
      currentParticipantId: null,
      participants: [],
    }),
    sheets: vi.fn<CombatRepo['sheets']>().mockResolvedValue([]),
    turns: vi.fn<CombatRepo['turns']>().mockResolvedValue(null),
    usernames: vi.fn<CombatRepo['usernames']>().mockResolvedValue({}),
    partyCharacterIds: vi.fn<CombatRepo['partyCharacterIds']>().mockResolvedValue(['hero']),
    enemySheet: vi.fn<CombatRepo['enemySheet']>().mockResolvedValue(null),
    create: vi.fn<CombatRepo['create']>().mockResolvedValue(undefined),
    addParticipants: vi.fn<CombatRepo['addParticipants']>().mockResolvedValue(undefined),
    updateParticipant: vi.fn<CombatRepo['updateParticipant']>().mockResolvedValue(true),
    removeParticipant: vi.fn<CombatRepo['removeParticipant']>().mockResolvedValue(true),
    setOrder: vi.fn<CombatRepo['setOrder']>().mockResolvedValue(undefined),
    start: vi.fn<CombatRepo['start']>().mockResolvedValue(undefined),
    endTurn: vi.fn<CombatRepo['endTurn']>().mockResolvedValue(undefined),
    previousTurn: vi.fn<CombatRepo['previousTurn']>().mockResolvedValue(undefined),
    setMyInitiative: vi.fn<CombatRepo['setMyInitiative']>().mockResolvedValue(true),
    finish: vi.fn<CombatRepo['finish']>().mockResolvedValue(true),
    setConditions: vi.fn<CombatRepo['setConditions']>().mockResolvedValue(true),
  }) satisfies CombatRepo;

describe('toGmRow', () => {
  it('o jogador com PV 0 mostra os testes contra a morte; com PV acima de 0, não', () => {
    expect(toGmRow(participant(), sheet({ hpCurrent: 0 }), null).deathSaves).toEqual({
      successes: 1,
      failures: 2,
    });
    expect(toGmRow(participant(), sheet(), null).deathSaves).toBeNull();
  });

  it('o jogador usa o PV, a CA, a percepção e a identidade da ficha', () => {
    expect(toGmRow(participant(), sheet(), 'p-hero')).toEqual({
      participantId: 'p-hero',
      characterId: 'hero',
      side: 'player',
      name: 'Arani',
      initiative: 14,
      hp: { current: 12, max: 20, temp: 3 },
      deathSaves: null,
      avatarUrl: null,
      accentColor: '#1d4ed8',
      race: 'Elfa',
      class: 'Maga',
      level: 5,
      ac: 15,
      // 10 + WIS 14 (+2) + proficiency at level 5 (+3)
      passivePerception: 15,
      speed: 9,
      attributes: { WIS: 14 },
      conditions: [],
      isCurrent: true,
      visibility: 'visible',
      fate: null,
      deathRevealed: false,
      ownerUsername: null,
    });
  });

  it('o jogador mostra o nome de usuário do dono; o NPC, nunca', () => {
    expect(toGmRow(participant(), sheet(), null, 'arani_fan').ownerUsername).toBe('arani_fan');
    const npc = participant({ id: 'p-g', characterId: 'goblin', side: 'enemy' });
    expect(toGmRow(npc, goblinSheet, null, 'gm-name').ownerUsername).toBeNull();
  });

  it('o inimigo usa o rótulo e o PV do participante, com o máximo da ficha, e nunca mostra testes contra a morte', () => {
    const row = toGmRow(
      participant({
        id: 'p-g',
        characterId: 'goblin',
        side: 'enemy',
        label: 'Goblin 2',
        hpCurrent: 0,
        hpTemp: 1,
      }),
      goblinSheet,
      null,
    );

    expect(row).toMatchObject({
      name: 'Goblin 2',
      hp: { current: 0, max: 7, temp: 1 },
      deathSaves: null,
      ac: 13,
      passivePerception: 10,
      isCurrent: false,
    });
  });
});

describe('toGmRow death saves of npcs', () => {
  const npc = (overrides: Partial<ParticipantRecord>) =>
    participant({ id: 'p-g', characterId: 'goblin', side: 'enemy', hpCurrent: 0, ...overrides });

  it('a linha do mestre traz os testes do NPC quando o destino é death_saves', () => {
    const row = toGmRow(
      npc({ fate: 'death_saves', deathSaves: { successes: 2, failures: 1 }, deathRevealed: true }),
      goblinSheet,
      null,
    );
    expect(row).toMatchObject({
      fate: 'death_saves',
      deathRevealed: true,
      deathSaves: { successes: 2, failures: 1 },
    });
  });

  it('o NPC sem destino death_saves não tem testes', () => {
    expect(toGmRow(npc({}), goblinSheet, null).deathSaves).toBeNull();
    expect(toGmRow(npc({ fate: 'dead' }), goblinSheet, null).deathSaves).toBeNull();
  });
});

describe('toGmRow conditions', () => {
  it('as condições vêm do participante', () => {
    const conditions = [{ key: 'dnd5e:srd-5.2:condition:prone', level: null }];
    expect(toGmRow(participant({ conditions }), sheet(), null).conditions).toEqual(conditions);
  });
});

describe('SetConditionsUseCase', () => {
  const PRONE = 'dnd5e:srd-5.2:condition:prone';
  const EXHAUSTION = 'dnd5e:srd-5.2:condition:exhaustion';
  const run = (conditions: { key: string; level: number | null }[], repo = makeRepo()) => {
    const result = new SetConditionsUseCase(repo, getConditionCatalog())
      .execute('party-1', 'p-hero', conditions)
      .then(() => null)
      .catch((e) => e.code);
    return { repo, result };
  };

  it('recusa chave que o catálogo não acha', async () => {
    const { repo, result } = run([{ key: 'dnd5e:srd-5.2:condition:nope', level: null }]);
    expect(await result).toBe(CombatErrorCodes.INVALID_CONDITION);
    expect(repo.setConditions).not.toHaveBeenCalled();
  });

  describe('chave desconhecida que o participante já tinha', () => {
    const GONE = 'dnd5e:srd-5.2:condition:gone';
    const withStored = (keys: string[]) => {
      const repo = makeRepo();
      repo.findEncounter.mockResolvedValue({
        round: 1,
        currentParticipantId: null,
        participants: [participant({ conditions: keys.map((key) => ({ key, level: null })) })],
      });
      return repo;
    };

    it('é descartada, sem travar o resto', async () => {
      const repo = withStored([GONE]);
      const { result } = run(
        [
          { key: GONE, level: null },
          { key: PRONE, level: null },
        ],
        repo,
      );
      expect(await result).toBeNull();
      expect(repo.setConditions).toHaveBeenCalledWith('party-1', 'p-hero', [
        { key: PRONE, level: null },
      ]);
    });

    it('uma chave desconhecida nova continua recusada', async () => {
      const repo = withStored([GONE]);
      const { result } = run([{ key: 'dnd5e:srd-5.2:condition:other', level: null }], repo);
      expect(await result).toBe(CombatErrorCodes.INVALID_CONDITION);
      expect(repo.setConditions).not.toHaveBeenCalled();
    });
  });

  it('recusa nível em condição sem níveis', async () => {
    expect(await run([{ key: PRONE, level: 2 }]).result).toBe(CombatErrorCodes.INVALID_CONDITION);
  });

  it('recusa nível fora de 1 até o máximo', async () => {
    expect(await run([{ key: EXHAUSTION, level: 7 }]).result).toBe(
      CombatErrorCodes.INVALID_CONDITION,
    );
    expect(await run([{ key: EXHAUSTION, level: 0 }]).result).toBe(
      CombatErrorCodes.INVALID_CONDITION,
    );
  });

  it('exaustão sem nível vira nível 1', async () => {
    const { repo, result } = run([{ key: EXHAUSTION, level: null }]);
    expect(await result).toBeNull();
    expect(repo.setConditions).toHaveBeenCalledWith('party-1', 'p-hero', [
      { key: EXHAUSTION, level: 1 },
    ]);
  });

  it('condições repetidas viram uma só', async () => {
    const { repo } = run([
      { key: PRONE, level: null },
      { key: PRONE, level: null },
    ]);
    await vi.waitFor(() =>
      expect(repo.setConditions).toHaveBeenCalledWith('party-1', 'p-hero', [
        { key: PRONE, level: null },
      ]),
    );
  });

  it('o repositório devolvendo false vira NOT_FOUND', async () => {
    const repo = makeRepo();
    repo.setConditions.mockResolvedValue(false);
    expect(await run([], repo).result).toBe(CombatErrorCodes.NOT_FOUND);
  });
});

describe('GetEncounterUseCase', () => {
  it('o jogador recebe só rodada e ordem: sem iniciativa, PV nem CA', async () => {
    const repo = makeRepo();
    repo.turns.mockResolvedValue({
      round: 2,
      turns: [
        {
          participantId: 'p-hero',
          side: 'player',
          name: 'Arani',
          avatarUrl: null,
          life: 'normal',
          isCurrent: true,
          isMine: true,
          conditions: [],
          initiative: 14,
          characterId: 'hero',
          ownerUsername: 'arani_fan',
        },
      ],
      hiddenTurn: false,
    });

    const view = await new GetEncounterUseCase(repo).execute('party-1', 'player-1');

    expect(view).toEqual({
      role: 'player',
      round: 2,
      hiddenTurn: false,
      turns: [
        {
          participantId: 'p-hero',
          side: 'player',
          name: 'Arani',
          avatarUrl: null,
          life: 'normal',
          isCurrent: true,
          isMine: true,
          conditions: [],
          initiative: 14,
          characterId: 'hero',
          ownerUsername: 'arani_fan',
        },
      ],
    });
    expect(repo.findEncounter).not.toHaveBeenCalled();
    expect(repo.sheets).not.toHaveBeenCalled();
  });

  it('o mestre recebe uma linha por participante, na ordem, com o atual marcado', async () => {
    const repo = makeRepo();
    repo.findEncounter.mockResolvedValue({
      round: 1,
      currentParticipantId: 'p-g',
      participants: [
        participant(),
        participant({
          id: 'p-g',
          characterId: 'goblin',
          side: 'enemy',
          label: 'Goblin',
          hpCurrent: 7,
          hpTemp: 0,
          position: 2,
        }),
      ],
    });
    repo.sheets.mockResolvedValue([goblinSheet, sheet()]);

    const view = await new GetEncounterUseCase(repo).execute('party-1', 'gm-1');

    expect(view?.role).toBe('gm');
    expect(view && 'rows' in view && view.rows.map((r) => [r.name, r.isCurrent])).toEqual([
      ['Arani', false],
      ['Goblin', true],
    ]);
    expect(repo.sheets).toHaveBeenCalledWith(['hero', 'goblin']);
  });

  it('o mestre vê o nome de usuário do dono só nas linhas de jogador', async () => {
    const repo = makeRepo();
    repo.findEncounter.mockResolvedValue({
      round: 0,
      currentParticipantId: null,
      participants: [
        participant(),
        participant({ id: 'p-g', characterId: 'goblin', side: 'enemy', label: 'Goblin' }),
      ],
    });
    repo.sheets.mockResolvedValue([goblinSheet, sheet()]);
    repo.usernames.mockResolvedValue({ 'player-1': 'arani_fan' });

    const view = await new GetEncounterUseCase(repo).execute('party-1', 'gm-1');

    expect(view && 'rows' in view && view.rows.map((r) => r.ownerUsername)).toEqual([
      'arani_fan',
      null,
    ]);
    expect(repo.usernames).toHaveBeenCalledWith('party-1');
  });

  it('sem combate, ou mesa que a pessoa não vê, responde null', async () => {
    const repo = makeRepo();
    repo.findEncounter.mockResolvedValue(null);
    expect(await new GetEncounterUseCase(repo).execute('party-1', 'gm-1')).toBeNull();

    repo.findPartyGm.mockResolvedValue(null);
    expect(await new GetEncounterUseCase(repo).execute('party-1', 'stranger')).toBeNull();
  });

  it('mesa sem mestre: o jogador ativo recebe a visão de jogador, sem encontro', async () => {
    const repo = makeRepo();
    repo.findPartyGm.mockResolvedValue({ gmId: null });
    repo.turns.mockResolvedValue(null);

    expect(await new GetEncounterUseCase(repo).execute('party-1', 'player-1')).toBeNull();
    expect(repo.turns).toHaveBeenCalledWith('party-1');
    expect(repo.findEncounter).not.toHaveBeenCalled();
  });

  it('mesa sem mestre: o que sobrar de turnos continua só com a visão de jogador', async () => {
    const repo = makeRepo();
    repo.findPartyGm.mockResolvedValue({ gmId: null });
    repo.turns.mockResolvedValue({ round: 2, turns: [], hiddenTurn: false });

    const view = await new GetEncounterUseCase(repo).execute('party-1', 'player-1');

    expect(view?.role).toBe('player');
    expect(repo.findEncounter).not.toHaveBeenCalled();
  });
});

describe('AddParticipantUseCase', () => {
  const withGoblins = (count: number) => {
    const repo = makeRepo();
    repo.enemySheet.mockResolvedValue({ name: 'Goblin' });
    repo.findEncounter.mockResolvedValue({
      round: 0,
      currentParticipantId: null,
      participants: Array.from({ length: count }, (_, i) =>
        participant({
          id: `g${i}`,
          characterId: 'goblin',
          side: 'enemy',
          label: `Goblin ${i + 1}`,
        }),
      ),
    });
    return repo;
  };

  const labels = (repo: ReturnType<typeof makeRepo>) =>
    repo.addParticipants.mock.calls[0][1].map((p) => p.label);

  it('um personagem da mesa entra como jogador, uma vez, ignorando a quantidade', async () => {
    const repo = makeRepo();

    await new AddParticipantUseCase(repo).execute('party-1', 'hero', 3);

    expect(repo.addParticipants).toHaveBeenCalledWith('party-1', [
      { characterId: 'hero', side: 'player', label: null },
    ]);
  });

  it('um inimigo sozinho fica com o nome da ficha', async () => {
    const repo = withGoblins(0);
    await new AddParticipantUseCase(repo).execute('party-1', 'goblin', 1);
    expect(labels(repo)).toEqual(['Goblin']);
  });

  it('três inimigos viram "Goblin 1..3"; mais dois depois de três viram "Goblin 4..5"', async () => {
    const fresh = withGoblins(0);
    await new AddParticipantUseCase(fresh).execute('party-1', 'goblin', 3);
    expect(labels(fresh)).toEqual(['Goblin 1', 'Goblin 2', 'Goblin 3']);

    const more = withGoblins(3);
    await new AddParticipantUseCase(more).execute('party-1', 'goblin', 2);
    expect(labels(more)).toEqual(['Goblin 4', 'Goblin 5']);
  });

  it('a ficha npc entra como aliada quando o mestre pede, com o mesmo rótulo do inimigo', async () => {
    const repo = withGoblins(0);
    await new AddParticipantUseCase(repo).execute('party-1', 'goblin', 2, 'ally');
    expect(repo.addParticipants).toHaveBeenCalledWith('party-1', [
      { characterId: 'goblin', side: 'ally', label: 'Goblin 1' },
      { characterId: 'goblin', side: 'ally', label: 'Goblin 2' },
    ]);
  });

  it('personagem fora da mesa que não é ficha npc do mestre é recusado', async () => {
    const repo = makeRepo();

    await expect(
      new AddParticipantUseCase(repo).execute('party-1', 'stranger-char', 1),
    ).rejects.toMatchObject({ code: CombatErrorCodes.CHARACTER_NOT_ALLOWED });
    expect(repo.addParticipants).not.toHaveBeenCalled();
  });

  it('sem combate preparado: NOT_FOUND', async () => {
    const repo = makeRepo();
    repo.findEncounter.mockResolvedValue(null);

    await expect(
      new AddParticipantUseCase(repo).execute('party-1', 'hero', 1),
    ).rejects.toMatchObject({ code: CombatErrorCodes.NOT_FOUND });
  });
});

describe('UpdateParticipantUseCase', () => {
  const withGoblin = () => {
    const repo = makeRepo();
    repo.findEncounter.mockResolvedValue({
      round: 1,
      currentParticipantId: null,
      participants: [
        participant({
          id: 'p-g',
          characterId: 'goblin',
          side: 'enemy',
          label: 'Goblin',
          hpCurrent: 7,
          hpTemp: 0,
        }),
      ],
    });
    repo.sheets.mockResolvedValue([goblinSheet]);
    return repo;
  };

  it('PV acima do máximo da ficha grava o máximo; o rótulo vai sem espaços nas pontas', async () => {
    const repo = withGoblin();

    await new UpdateParticipantUseCase(repo).execute('party-1', 'p-g', {
      hpCurrent: 30,
      label: '  Chefe  ',
    });

    expect(repo.updateParticipant).toHaveBeenCalledWith('party-1', 'p-g', {
      hpCurrent: 7,
      label: 'Chefe',
    });
  });

  it('recusa lado, visibilidade, destino e testes na linha de um jogador', async () => {
    const repo = makeRepo();
    repo.findEncounter.mockResolvedValue({
      round: 1,
      currentParticipantId: null,
      participants: [participant()],
    });
    const patches = [
      { side: 'enemy' },
      { visibility: 'hidden' },
      { fate: 'dead' },
      { deathSaves: { successes: 1, failures: 0 } },
      { deathRevealed: true },
    ] as const;

    for (const patch of patches) {
      await expect(
        new UpdateParticipantUseCase(repo).execute('party-1', 'p-hero', patch),
      ).rejects.toMatchObject({ code: CombatErrorCodes.INVALID_CHANGE });
    }
    expect(repo.updateParticipant).not.toHaveBeenCalled();
  });

  it('aceita mudar o lado de um NPC para neutro', async () => {
    const repo = withGoblin();

    await new UpdateParticipantUseCase(repo).execute('party-1', 'p-g', { side: 'neutral' });

    expect(repo.updateParticipant).toHaveBeenCalledWith('party-1', 'p-g', { side: 'neutral' });
  });

  it('participante que não está no combate: NOT_FOUND', async () => {
    const repo = withGoblin();

    await expect(
      new UpdateParticipantUseCase(repo).execute('party-1', 'other', { initiative: 3 }),
    ).rejects.toMatchObject({ code: CombatErrorCodes.NOT_FOUND });
  });
});

describe('EncounterCommands', () => {
  it('remover ou encerrar o que não existe (ou não é do mestre) responde NOT_FOUND', async () => {
    const repo = makeRepo();
    repo.removeParticipant.mockResolvedValue(false);
    repo.finish.mockResolvedValue(false);
    const commands = new EncounterCommands(repo);

    await expect(commands.removeParticipant('party-1', 'p')).rejects.toMatchObject({
      code: CombatErrorCodes.NOT_FOUND,
    });
    await expect(commands.finish('party-1')).rejects.toMatchObject({
      code: CombatErrorCodes.NOT_FOUND,
    });
  });
});

describe('EncounterCommands player initiative and previous turn', () => {
  it('previousTurn repassa para o repositório', async () => {
    const repo = makeRepo();
    await new EncounterCommands(repo).previousTurn('party-1');
    expect(repo.previousTurn).toHaveBeenCalledWith('party-1');
  });

  it('setMyInitiative repassa; false vira NOT_FOUND', async () => {
    const repo = makeRepo();
    await new EncounterCommands(repo).setMyInitiative('party-1', 'p-hero', 15);
    expect(repo.setMyInitiative).toHaveBeenCalledWith('party-1', 'p-hero', 15);

    repo.setMyInitiative.mockResolvedValue(false);
    await expect(
      new EncounterCommands(repo).setMyInitiative('party-1', 'p-hero', null),
    ).rejects.toMatchObject({ code: CombatErrorCodes.NOT_FOUND });
  });
});
