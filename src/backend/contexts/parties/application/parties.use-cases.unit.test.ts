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
import { IsGmOfCharacterUseCase } from './is-gm-of-character.use-case';
import { ListMyPartiesUseCase } from './list-my-parties.use-case';
import {
  GetInviteCardUseCase,
  RemovePartyImageUseCase,
  UploadPartyImageUseCase,
} from './party-image.use-cases';
import { RemoveMemberUseCase } from './remove-member.use-case';
import { RenamePartyUseCase } from './rename-party.use-case';
import { RotateInviteCodeUseCase } from './rotate-invite-code.use-case';
import { SetJournalUseCase } from './set-journal.use-case';
import { SetMyCharactersUseCase } from './set-my-characters.use-case';
import { SetPartyEditionUseCase } from './set-party-edition.use-case';

const makePartyRepo = () =>
  ({
    listMine: vi.fn<PartyRepo['listMine']>().mockResolvedValue([]),
    create: vi.fn<PartyRepo['create']>().mockResolvedValue('party-1'),
    rename: vi.fn<PartyRepo['rename']>().mockResolvedValue(true),
    setEdition: vi.fn<PartyRepo['setEdition']>().mockResolvedValue(true),
    delete: vi.fn<PartyRepo['delete']>().mockResolvedValue(true),
    setInviteCode: vi.fn<PartyRepo['setInviteCode']>().mockResolvedValue(true),
    getInvite: vi.fn<PartyRepo['getInvite']>().mockResolvedValue(null),
    requestJoin: vi.fn<PartyRepo['requestJoin']>().mockResolvedValue('requested'),
    invite: vi.fn<PartyRepo['invite']>().mockResolvedValue('invited'),
    activateMember: vi.fn<PartyRepo['activateMember']>().mockResolvedValue(true),
    deleteMember: vi.fn<PartyRepo['deleteMember']>().mockResolvedValue(true),
    findParty: vi.fn<PartyRepo['findParty']>().mockResolvedValue({
      id: 'p',
      name: 'Mesa',
      system: 'dnd_5e',
      gmId: 'gm-1',
      edition: '2024',
      imageUrl: null,
    }),
    people: vi.fn<PartyRepo['people']>().mockResolvedValue([]),
    roster: vi.fn<PartyRepo['roster']>().mockResolvedValue([]),
    inviteCode: vi.fn<PartyRepo['inviteCode']>().mockResolvedValue('c'.repeat(32)),
    rolePlaySheets: vi.fn<PartyRepo['rolePlaySheets']>().mockResolvedValue([]),
    addCharacters: vi.fn<PartyRepo['addCharacters']>().mockResolvedValue(undefined),
    removeCharacters: vi.fn<PartyRepo['removeCharacters']>().mockResolvedValue(undefined),
    journalDocId: vi.fn<PartyRepo['journalDocId']>().mockResolvedValue(null),
    setJournal: vi.fn<PartyRepo['setJournal']>().mockResolvedValue(undefined),
    inviteCard: vi.fn<PartyRepo['inviteCard']>().mockResolvedValue(null),
    setImage: vi.fn<PartyRepo['setImage']>().mockResolvedValue(true),
    gmClaim: vi.fn<PartyRepo['gmClaim']>().mockResolvedValue(null),
    claimGm: vi.fn<PartyRepo['claimGm']>().mockResolvedValue('pending'),
    voteGmClaim: vi.fn<PartyRepo['voteGmClaim']>().mockResolvedValue('pending'),
    cancelGmClaim: vi.fn<PartyRepo['cancelGmClaim']>().mockResolvedValue(undefined),
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

const DOC_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-ab';

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

    it('trocar a edição de mesa alheia responde not found', async () => {
      repo.setEdition.mockResolvedValue(false);

      expect(await codeOf(new SetPartyEditionUseCase(repo).execute('p', '2014'))).toBe(
        PartyErrorCodes.NOT_FOUND,
      );
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

  describe('SetJournalUseCase', () => {
    it('guarda o ID extraído de uma URL válida', async () => {
      await new SetJournalUseCase(repo).execute(
        'p',
        'gm-1',
        `https://docs.google.com/document/d/${DOC_ID}/edit`,
      );

      expect(repo.setJournal).toHaveBeenCalledWith('p', DOC_ID);
    });

    it('null remove o diário', async () => {
      await new SetJournalUseCase(repo).execute('p', 'gm-1', null);

      expect(repo.setJournal).toHaveBeenCalledWith('p', null);
    });

    it('recusa uma URL inválida sem gravar', async () => {
      expect(
        await codeOf(new SetJournalUseCase(repo).execute('p', 'gm-1', 'https://evil.com/x')),
      ).toBe(PartyErrorCodes.JOURNAL_URL_INVALID);
      expect(repo.setJournal).not.toHaveBeenCalled();
    });

    it('quem não é o mestre responde not found', async () => {
      expect(await codeOf(new SetJournalUseCase(repo).execute('p', 'player-1', DOC_ID))).toBe(
        PartyErrorCodes.NOT_FOUND,
      );
      expect(repo.setJournal).not.toHaveBeenCalled();
    });

    it('mesa inexistente responde not found', async () => {
      repo.findParty.mockResolvedValue(null);

      expect(await codeOf(new SetJournalUseCase(repo).execute('p', 'gm-1', DOC_ID))).toBe(
        PartyErrorCodes.NOT_FOUND,
      );
    });
  });

  describe('imagem da mesa', () => {
    const storage = { upload: vi.fn(), download: vi.fn(), remove: vi.fn() };
    const image = (type = 'image/webp', size = 1000) => new Blob([new Uint8Array(size)], { type });
    const upload = () => new UploadPartyImageUseCase(repo, storage, () => 'v1');

    beforeEach(() => {
      storage.upload.mockReset().mockResolvedValue('https://images.test/avatars/gm-1/x.webp');
    });

    it('o mestre envia: o arquivo vai para a pasta dele e a URL fica na mesa', async () => {
      const url = await upload().execute('p', 'gm-1', image());

      expect(storage.upload).toHaveBeenCalledWith(
        'avatars',
        'gm-1/parties/p-v1.webp',
        expect.any(Blob),
      );
      expect(repo.setImage).toHaveBeenCalledWith('p', url);
    });

    it('quem não é o mestre responde not found e nada é enviado', async () => {
      expect(await codeOf(upload().execute('p', 'player-1', image()))).toBe(
        PartyErrorCodes.NOT_FOUND,
      );
      expect(await codeOf(new RemovePartyImageUseCase(repo).execute('p', 'player-1'))).toBe(
        PartyErrorCodes.NOT_FOUND,
      );
      expect(storage.upload).not.toHaveBeenCalled();
      expect(repo.setImage).not.toHaveBeenCalled();
    });

    it('recusa arquivo grande demais ou de outro tipo', async () => {
      expect(
        await codeOf(upload().execute('p', 'gm-1', image('image/webp', 6 * 1024 * 1024))),
      ).toBe(PartyErrorCodes.IMAGE_TOO_LARGE);
      expect(await codeOf(upload().execute('p', 'gm-1', image('image/svg+xml')))).toBe(
        PartyErrorCodes.IMAGE_INVALID_TYPE,
      );
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('o mestre remove a imagem', async () => {
      await new RemovePartyImageUseCase(repo).execute('p', 'gm-1');
      expect(repo.setImage).toHaveBeenCalledWith('p', null);
    });

    it('o card do convite vem do repositório', async () => {
      repo.inviteCard.mockResolvedValue({ name: 'Mesa', imageUrl: null });
      expect(await new GetInviteCardUseCase(repo).execute('c'.repeat(32))).toEqual({
        name: 'Mesa',
        imageUrl: null,
      });
    });
  });

  describe('GetPartyUseCase', () => {
    it.each(['gm-1', 'player-1'])('%s recebe o ID do diário', async (userId) => {
      repo.people.mockResolvedValue([person('gm-1', 'gm'), person('player-1', 'active')]);
      repo.journalDocId.mockResolvedValue(DOC_ID);

      const view = await new GetPartyUseCase(repo).execute('p', userId);

      expect(view.journalDocId).toBe(DOC_ID);
    });

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

  describe('IsGmOfCharacterUseCase', () => {
    beforeEach(() => {
      repo.roster.mockResolvedValue([rosterCharacter('c1', 'player-1')]);
    });

    it('o mestre de um personagem da mesa tem acesso', async () => {
      expect(await new IsGmOfCharacterUseCase(repo).execute('p', 'c1', 'gm-1')).toBe(true);
    });

    it('um jogador da mesa não tem', async () => {
      expect(await new IsGmOfCharacterUseCase(repo).execute('p', 'c1', 'player-1')).toBe(false);
      expect(repo.roster).not.toHaveBeenCalled();
    });

    it('um personagem fora da mesa não é lido', async () => {
      expect(await new IsGmOfCharacterUseCase(repo).execute('p', 'c2', 'gm-1')).toBe(false);
    });

    it('mesa que a pessoa não vê não dá acesso', async () => {
      repo.findParty.mockResolvedValue(null);
      expect(await new IsGmOfCharacterUseCase(repo).execute('p', 'c1', 'gm-1')).toBe(false);
    });
  });
});
