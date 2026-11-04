import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PartyErrorCodes } from '../domain/PartyError';
import { PartyPerson } from '../domain/PartyView';
import { PartyRepo } from '../domain/repository/party.repo';
import { GetPartyUseCase } from './get-party.use-case';

const NOW = new Date('2026-11-10T12:00:00.000Z');
const HOUR = 60 * 60 * 1000;

const person = (userId: string, status: PartyPerson['status']): PartyPerson => ({
  userId,
  username: userId,
  avatarUrl: null,
  status,
});

const makeRepo = (gmId: string | null) => ({
  findParty: vi.fn<PartyRepo['findParty']>().mockResolvedValue({
    id: 'p',
    name: 'Mesa',
    system: 'dnd_5e',
    gmId,
    edition: '2024',
    imageUrl: null,
  }),
  people: vi
    .fn<PartyRepo['people']>()
    .mockResolvedValue([person('player-1', 'active'), person('player-2', 'active')]),
  roster: vi.fn<PartyRepo['roster']>().mockResolvedValue([]),
  journalDocId: vi.fn<PartyRepo['journalDocId']>().mockResolvedValue(null),
  inviteCode: vi.fn<PartyRepo['inviteCode']>().mockResolvedValue(null),
  rolePlaySheets: vi.fn<PartyRepo['rolePlaySheets']>().mockResolvedValue([]),
  gmClaim: vi.fn<PartyRepo['gmClaim']>().mockResolvedValue(null),
});

const useCase = (repo: ReturnType<typeof makeRepo>) =>
  new GetPartyUseCase(repo as unknown as PartyRepo);

describe('GetPartyUseCase numa mesa sem mestre', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('o jogador ativo vê a mesa como jogador, sem mestre e sem pedido', async () => {
    const repo = makeRepo(null);

    const view = await useCase(repo).execute('p', 'player-1');

    expect(view.role).toBe('player');
    expect(view.hasGm).toBe(false);
    expect(view.gm).toBeNull();
    expect(view.gmClaim).toBeNull();
    expect(repo.inviteCode).not.toHaveBeenCalled();
  });

  it('quem não é ativo responde not found, mesmo sem mestre', async () => {
    const repo = makeRepo(null);
    repo.people.mockResolvedValue([person('player-1', 'active'), person('guest', 'invited')]);

    await expect(useCase(repo).execute('p', 'guest')).rejects.toMatchObject({
      message: PartyErrorCodes.NOT_FOUND,
    });
    await expect(useCase(repo).execute('p', 'stranger')).rejects.toMatchObject({
      message: PartyErrorCodes.NOT_FOUND,
    });
    expect(repo.gmClaim).not.toHaveBeenCalled();
  });

  it('com mestre, hasGm é verdadeiro e o pedido nem é lido', async () => {
    const repo = makeRepo('gm-1');
    repo.people.mockResolvedValue([person('gm-1', 'gm'), person('player-1', 'active')]);

    const view = await useCase(repo).execute('p', 'player-1');

    expect(view.hasGm).toBe(true);
    expect(view.gmClaim).toBeNull();
    expect(repo.gmClaim).not.toHaveBeenCalled();
  });

  describe('com um pedido aberto', () => {
    const claimOpenFor = (ms: number) => ({
      candidateId: 'player-2',
      candidateUsername: null,
      createdAt: new Date(NOW.getTime() - ms).toISOString(),
      pendingUserIds: ['player-1'],
    });

    it('devolve o pedido com o nome vazio de quem não escolheu um', async () => {
      const repo = makeRepo(null);
      repo.gmClaim.mockResolvedValue(claimOpenFor(HOUR));

      const view = await useCase(repo).execute('p', 'player-1');

      expect(view.gmClaim).toEqual({
        candidateId: 'player-2',
        candidateUsername: null,
        createdAt: claimOpenFor(HOUR).createdAt,
        pendingUserIds: ['player-1'],
        canAskSupport: false,
      });
    });

    it('canAskSupport é falso com 23h59 e verdadeiro com 24h', async () => {
      const repo = makeRepo(null);
      const use = useCase(repo);

      repo.gmClaim.mockResolvedValue(claimOpenFor(24 * HOUR - 60 * 1000));
      expect((await use.execute('p', 'player-1')).gmClaim?.canAskSupport).toBe(false);

      repo.gmClaim.mockResolvedValue(claimOpenFor(24 * HOUR));
      expect((await use.execute('p', 'player-1')).gmClaim?.canAskSupport).toBe(true);
    });
  });
});
