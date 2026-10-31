import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PartySummary } from '../domain/Party';
import { PartyErrorCodes } from '../domain/PartyError';
import { PartyPerson, RosterCharacter } from '../domain/PartyView';
import { PartyRepo } from '../domain/repository/party.repo';
import { AcceptMemberUseCase } from './accept-member.use-case';
import { CreatePartyUseCase } from './create-party.use-case';
import { DeletePartyUseCase } from './delete-party.use-case';
import { GetInviteUseCase } from './get-invite.use-case';
import { GetPartyUseCase } from './get-party.use-case';
import { InviteByUsernameUseCase } from './invite-by-username.use-case';
import { ListMyPartiesUseCase } from './list-my-parties.use-case';
import { RemoveMemberUseCase } from './remove-member.use-case';
import { RenamePartyUseCase } from './rename-party.use-case';
import { RotateInviteCodeUseCase } from './rotate-invite-code.use-case';
import { SetMyCharactersUseCase } from './set-my-characters.use-case';

const makePartyRepo = () =>
  ({
    listMine: vi.fn<PartyRepo['listMine']>().mockResolvedValue([]),
    create: vi.fn<PartyRepo['create']>().mockResolvedValue('party-1'),
    rename: vi.fn<PartyRepo['rename']>().mockResolvedValue(true),
    delete: vi.fn<PartyRepo['delete']>().mockResolvedValue(true),
    setInviteCode: vi.fn<PartyRepo['setInviteCode']>().mockResolvedValue(true),
    getInvite: vi.fn<PartyRepo['getInvite']>().mockResolvedValue(null),
    requestJoin: vi.fn<PartyRepo['requestJoin']>().mockResolvedValue('requested'),
    invite: vi.fn<PartyRepo['invite']>().mockResolvedValue('invited'),
    activateMember: vi.fn<PartyRepo['activateMember']>().mockResolvedValue(true),
    deleteMember: vi.fn<PartyRepo['deleteMember']>().mockResolvedValue(true),
    findParty: vi
      .fn<PartyRepo['findParty']>()
      .mockResolvedValue({ id: 'p', name: 'Mesa', system: 'dnd_5e', gmId: 'gm-1' }),
    people: vi.fn<PartyRepo['people']>().mockResolvedValue([]),
    roster: vi.fn<PartyRepo['roster']>().mockResolvedValue([]),
    inviteCode: vi.fn<PartyRepo['inviteCode']>().mockResolvedValue('c'.repeat(32)),
    rolePlaySheets: vi.fn<PartyRepo['rolePlaySheets']>().mockResolvedValue([]),
    addCharacters: vi.fn<PartyRepo['addCharacters']>().mockResolvedValue(undefined),
    removeCharacters: vi.fn<PartyRepo['removeCharacters']>().mockResolvedValue(undefined),
  }) satisfies PartyRepo;

const summary = (overrides: Partial<PartySummary>): PartySummary => ({
  id: 'p',
  name: 'Mesa',
  system: 'dnd_5e',
  role: 'player',
  status: 'active',
  gmUsername: 'mestra',
  pendingRequests: 0,
  ...overrides,
});

const person = (userId: string, status: PartyPerson['status']): PartyPerson => ({
  userId,
  username: userId,
  avatarUrl: null,
  status,
});

const rosterCharacter = (characterId: string, ownerId: string): RosterCharacter => ({
  characterId,
  ownerId,
  name: characterId,
  avatarUrl: null,
  race: 'Elfa',
  class: 'Maga',
  level: 1,
  accentColor: null,
});

const codeOf = (promise: Promise<unknown>) => promise.catch((e) => e.code);

describe('casos de uso das mesas', () => {
  let repo: ReturnType<typeof makePartyRepo>;

  beforeEach(() => {
    repo = makePartyRepo();
  });

  describe('CreatePartyUseCase', () => {
    it('cria com o nome sem espaços nas pontas', async () => {
      const result = await new CreatePartyUseCase(repo).execute('gm-1', '  Mesa de Quinta ');

      expect(result).toEqual({ id: 'party-1' });
      expect(repo.create).toHaveBeenCalledWith('gm-1', 'Mesa de Quinta');
    });

    it.each(['   ', 'x'.repeat(61)])('recusa o nome %j', async (name) => {
      expect(await codeOf(new CreatePartyUseCase(repo).execute('gm-1', name))).toBe(
        PartyErrorCodes.NAME_INVALID,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('ListMyPartiesUseCase', () => {
    it('separa mestre, jogador, convites e pedidos', async () => {
      repo.listMine.mockResolvedValue([
        summary({ id: 'gm', role: 'gm', status: 'gm' }),
        summary({ id: 'active', status: 'active' }),
        summary({ id: 'invited', status: 'invited' }),
        summary({ id: 'requested', status: 'requested' }),
      ]);

      const mine = await new ListMyPartiesUseCase(repo).execute();

      expect({
        asGm: mine.asGm.map((p) => p.id),
        asPlayer: mine.asPlayer.map((p) => p.id),
        invites: mine.invites.map((p) => p.id),
        requests: mine.requests.map((p) => p.id),
      }).toEqual({
        asGm: ['gm'],
        asPlayer: ['active'],
        invites: ['invited'],
        requests: ['requested'],
      });
    });
  });

  describe('RenamePartyUseCase e DeletePartyUseCase', () => {
    it('renomear mesa alheia responde not found', async () => {
      repo.rename.mockResolvedValue(false);

      const error = await new RenamePartyUseCase(repo).execute('p', 'Nova').catch((e) => e);

      expect(error.code).toBe(PartyErrorCodes.NOT_FOUND);
      expect(error.kind).toBe('not_found');
    });

    it('renomear valida o nome', async () => {
      expect(await codeOf(new RenamePartyUseCase(repo).execute('p', ' '))).toBe(
        PartyErrorCodes.NAME_INVALID,
      );
    });

    it('apagar mesa alheia responde not found', async () => {
      repo.delete.mockResolvedValue(false);

      expect(await codeOf(new DeletePartyUseCase(repo).execute('p'))).toBe(
        PartyErrorCodes.NOT_FOUND,
      );
    });
  });

  describe('RotateInviteCodeUseCase', () => {
    it('devolve um código novo de 32 hex', async () => {
      const first = await new RotateInviteCodeUseCase(repo).execute('p');
      const second = await new RotateInviteCodeUseCase(repo).execute('p');

      expect(first).toMatch(/^[a-f0-9]{32}$/);
      expect(second).not.toBe(first);
      expect(repo.setInviteCode).toHaveBeenLastCalledWith('p', second);
    });

    it('de mesa alheia responde not found', async () => {
      repo.setInviteCode.mockResolvedValue(false);

      expect(await codeOf(new RotateInviteCodeUseCase(repo).execute('p'))).toBe(
        PartyErrorCodes.NOT_FOUND,
      );
    });
  });

  describe('convites e membros', () => {
    it('getInvite de código inexistente responde invite not found', async () => {
      const error = await new GetInviteUseCase(repo).execute('a'.repeat(32)).catch((e) => e);

      expect(error.code).toBe(PartyErrorCodes.INVITE_NOT_FOUND);
      expect(error.kind).toBe('not_found');
    });

    it('getInvite devolve o preview', async () => {
      const preview = { partyId: 'p', name: 'Mesa', gmUsername: 'mestra', myStatus: null };
      repo.getInvite.mockResolvedValue(preview);

      expect(await new GetInviteUseCase(repo).execute('a'.repeat(32))).toEqual(preview);
    });

    it('inviteByUsername tira o @ e os espaços', async () => {
      await new InviteByUsernameUseCase(repo).execute('p', ' @Bia ');

      expect(repo.invite).toHaveBeenCalledWith('p', 'Bia');
    });

    it('acceptMember sem linha afetada responde not found', async () => {
      repo.activateMember.mockResolvedValue(false);

      expect(await codeOf(new AcceptMemberUseCase(repo).execute('p', 'u'))).toBe(
        PartyErrorCodes.NOT_FOUND,
      );
    });

    it('removeMember sem linha afetada responde not found', async () => {
      repo.deleteMember.mockResolvedValue(false);

      expect(await codeOf(new RemoveMemberUseCase(repo).execute('p', 'u'))).toBe(
        PartyErrorCodes.NOT_FOUND,
      );
    });
  });

  describe('GetPartyUseCase', () => {
    it('quem é só invited responde not found', async () => {
      repo.people.mockResolvedValue([person('gm-1', 'gm')]);

      expect(await codeOf(new GetPartyUseCase(repo).execute('p', 'player-1'))).toBe(
        PartyErrorCodes.NOT_FOUND,
      );
    });

    it('mesa inexistente responde not found', async () => {
      repo.findParty.mockResolvedValue(null);

      expect(await codeOf(new GetPartyUseCase(repo).execute('p', 'gm-1'))).toBe(
        PartyErrorCodes.NOT_FOUND,
      );
    });

    it('o jogador recebe roster e os próprios personagens, sem a parte do mestre', async () => {
      repo.people.mockResolvedValue([person('gm-1', 'gm'), person('player-1', 'active')]);
      repo.roster.mockResolvedValue([
        rosterCharacter('mine', 'player-1'),
        rosterCharacter('theirs', 'player-2'),
      ]);

      const view = await new GetPartyUseCase(repo).execute('p', 'player-1');

      expect(view.role).toBe('player');
      expect(view.gm).toBeNull();
      expect(view.myCharacterIds).toEqual(['mine']);
      expect(view.roster).toHaveLength(2);
      expect(repo.inviteCode).not.toHaveBeenCalled();
      expect(repo.rolePlaySheets).not.toHaveBeenCalled();
    });

    it('o mestre recebe o código e os cards do Role Play, com o username do jogador', async () => {
      repo.people.mockResolvedValue([person('gm-1', 'gm'), person('player-1', 'active')]);
      repo.roster.mockResolvedValue([rosterCharacter('c1', 'player-1')]);
      repo.rolePlaySheets.mockResolvedValue([
        {
          id: 'c1',
          sheet: { attributes: { WIS: 14 }, level: 1, skills: {} },
          lore: { ideals: 'Saber' },
        },
      ]);

      const view = await new GetPartyUseCase(repo).execute('p', 'gm-1');

      expect(view.role).toBe('gm');
      expect(view.gm?.inviteCode).toBe('c'.repeat(32));
      expect(view.gm?.rolePlay).toEqual([
        expect.objectContaining({
          characterId: 'c1',
          ownerUsername: 'player-1',
          ideals: 'Saber',
          passivePerception: 12,
        }),
      ]);
      expect(repo.rolePlaySheets).toHaveBeenCalledWith(['c1']);
    });
  });

  describe('SetMyCharactersUseCase', () => {
    it('troca A por B: tira A e leva B', async () => {
      repo.roster.mockResolvedValue([
        rosterCharacter('a', 'player-1'),
        rosterCharacter('other', 'player-2'),
      ]);

      await new SetMyCharactersUseCase(repo).execute('p', 'player-1', ['b', 'b']);

      expect(repo.removeCharacters).toHaveBeenCalledWith('p', ['a']);
      expect(repo.addCharacters).toHaveBeenCalledWith('p', ['b']);
    });

    it('sem mudança não escreve nada', async () => {
      repo.roster.mockResolvedValue([rosterCharacter('a', 'player-1')]);

      await new SetMyCharactersUseCase(repo).execute('p', 'player-1', ['a']);

      expect(repo.removeCharacters).not.toHaveBeenCalled();
      expect(repo.addCharacters).not.toHaveBeenCalled();
    });
  });
});
