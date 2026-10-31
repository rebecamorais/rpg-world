import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PartySummary } from '../domain/Party';
import { PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';
import { AcceptMemberUseCase } from './accept-member.use-case';
import { CreatePartyUseCase } from './create-party.use-case';
import { DeletePartyUseCase } from './delete-party.use-case';
import { GetInviteUseCase } from './get-invite.use-case';
import { InviteByUsernameUseCase } from './invite-by-username.use-case';
import { ListMyPartiesUseCase } from './list-my-parties.use-case';
import { RemoveMemberUseCase } from './remove-member.use-case';
import { RenamePartyUseCase } from './rename-party.use-case';
import { RotateInviteCodeUseCase } from './rotate-invite-code.use-case';

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
});
